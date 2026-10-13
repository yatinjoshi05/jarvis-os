use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    image::Image,
    Emitter,
    Manager,
};
mod terminal_pty;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::io::{Read, Write};
use std::net::TcpStream;
use std::sync::atomic::{AtomicBool, Ordering};
use screenshots::Screen;
use windows::{
    Win32::{
        Media::Audio::{eMultimedia, eRender, Endpoints::IAudioEndpointVolume, IMMDeviceEnumerator, MMDeviceEnumerator},
        System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED},
    },
};

struct AppState {
    was_dirty: AtomicBool,
}

#[derive(serde::Serialize)]
struct StoragePayload {
    data: String,
    was_dirty: bool,
}

/// The only user-visible filesystem locations available to System Control.
/// This intentionally does not accept arbitrary paths from the frontend.
#[derive(Clone, Copy, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum KnownFolder {
    Desktop,
    Documents,
    Downloads,
    Pictures,
}

impl KnownFolder {
    fn display_name(self) -> &'static str {
        match self {
            Self::Desktop => "Desktop",
            Self::Documents => "Documents",
            Self::Downloads => "Downloads",
            Self::Pictures => "Pictures",
        }
    }

    fn path(self) -> Result<PathBuf, String> {
        let profile = std::env::var_os("USERPROFILE")
            .map(PathBuf::from)
            .ok_or_else(|| "Unable to determine the current Windows user profile.".to_string())?;
        Ok(profile.join(self.display_name()))
    }
}

fn validate_folder_name(name: &str) -> Result<&str, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Folder name cannot be empty.".to_string());
    }
    if trimmed == "." || trimmed == ".." || trimmed.contains("..") || trimmed.contains(['/', '\\']) {
        return Err("Folder names cannot contain paths or traversal characters.".to_string());
    }
    if trimmed.chars().any(|character| matches!(character, '<' | '>' | ':' | '"' | '|' | '?' | '*')) {
        return Err("Folder name contains characters that Windows does not allow.".to_string());
    }
    Ok(trimmed)
}

fn open_with_windows_start(target: &str) -> Result<(), String> {
    Command::new("cmd")
        .args(["/C", "start", "", target])
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Windows could not open the requested item: {error}"))
}

fn percent_encode_query(query: &str) -> String {
    query
        .bytes()
        .flat_map(|byte| match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => vec![byte as char],
            b' ' => vec!['+'],
            _ => format!("%{byte:02X}").chars().collect(),
        })
        .collect()
}

fn default_audio_endpoint() -> Result<IAudioEndpointVolume, String> {
    let _ = unsafe { CoInitializeEx(None, COINIT_MULTITHREADED) };
    let enumerator: IMMDeviceEnumerator = unsafe {
        CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)
            .map_err(|error| format!("Unable to access Windows audio devices: {error}"))?
    };
    let device = unsafe {
        enumerator
            .GetDefaultAudioEndpoint(eRender, eMultimedia)
            .map_err(|error| format!("Unable to find the default audio output: {error}"))?
    };
    unsafe {
        device
            .Activate(CLSCTX_ALL, None)
            .map_err(|error| format!("Unable to control the default audio output: {error}"))
    }
}

#[tauri::command]
fn open_application(name: String) -> Result<String, String> {
    let normalized = name.trim().to_ascii_lowercase();
    let (label, target) = match normalized.as_str() {
        "chrome" | "google chrome" => ("Chrome", "chrome"),
        "vs code" | "vscode" | "visual studio code" => ("VS Code", "code"),
        "spotify" => ("Spotify", "spotify:"),
        _ => return Err(format!("I can currently open Chrome, VS Code, or Spotify—not \"{}\".", name.trim())),
    };
    open_with_windows_start(target)?;
    Ok(format!("Opening {label}."))
}

#[tauri::command]
fn search_web(query: String, engine: String) -> Result<String, String> {
    let query = query.trim();
    if query.is_empty() {
        return Err("Search query cannot be empty.".to_string());
    }
    let engine = engine.trim().to_ascii_lowercase();
    let (label, template) = match engine.as_str() {
        "" | "google" | "web" => ("Google", "https://www.google.com/search?q="),
        "youtube" => ("YouTube", "https://www.youtube.com/results?search_query="),
        "duckduckgo" | "ddg" => ("DuckDuckGo", "https://duckduckgo.com/?q="),
        _ => return Err(format!("Unsupported search engine: {engine}. Try YouTube, Google, or DuckDuckGo.")),
    };
    open_with_windows_start(&format!("{template}{}", percent_encode_query(query)))?;
    Ok(format!("Searching {label} for \"{query}\"."))
}

#[tauri::command]
fn create_folder(name: String, base: KnownFolder) -> Result<String, String> {
    let name = validate_folder_name(&name)?;
    let base_path = base.path()?;
    fs::create_dir_all(&base_path).map_err(|error| format!("Unable to access {}: {error}", base.display_name()))?;
    let safe_base = fs::canonicalize(&base_path).map_err(|error| format!("Unable to validate {}: {error}", base.display_name()))?;
    let target = safe_base.join(name);
    if target.parent() != Some(safe_base.as_path()) || !target.starts_with(&safe_base) {
        return Err("Folder location is outside the allowed directory.".to_string());
    }
    fs::create_dir_all(&target).map_err(|error| format!("Unable to create the folder: {error}"))?;
    Ok(format!("Created folder \"{name}\" in {}.", base.display_name()))
}

#[tauri::command]
fn take_screenshot() -> Result<String, String> {
    let pictures = KnownFolder::Pictures.path()?;
    let directory = pictures.join("Screenshots");
    fs::create_dir_all(&directory).map_err(|error| format!("Unable to create the Screenshots folder: {error}"))?;
    let screen = Screen::all()
        .map_err(|error| format!("Unable to enumerate displays: {error}"))?
        .into_iter()
        .next()
        .ok_or_else(|| "No display was available for screenshot capture.".to_string())?;
    let image = screen.capture().map_err(|error| format!("Unable to capture the screen: {error}"))?;
    let path = directory.join(format!("jarvis-{}.png", timestamp_millis()));
    image.save(&path).map_err(|error| format!("Unable to save the screenshot: {error}"))?;
    Ok(path.to_string_lossy().into_owned())
}

fn timestamp_millis() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

fn validate_runtime_id(id: &str) -> Result<&str, String> {
    let trimmed = id.trim();
    if trimmed.len() < 2 || trimmed.len() > 96 || !trimmed.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') {
        return Err("Runtime id must be 2-96 letters, numbers, underscores, or hyphens.".to_string());
    }
    Ok(trimmed)
}

fn runtime_request(method: &str, endpoint: &str, body: Option<serde_json::Value>) -> Result<serde_json::Value, String> {
    let payload = body.map(|value| value.to_string()).unwrap_or_default();
    let request = format!("{method} {endpoint} HTTP/1.1\r\nHost: 127.0.0.1:3001\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{payload}", payload.len());
    let mut stream = TcpStream::connect("127.0.0.1:3001").map_err(|error| format!("Runtime backend is unavailable: {error}"))?;
    stream.write_all(request.as_bytes()).map_err(|error| format!("Unable to send runtime request: {error}"))?;
    let mut response = String::new(); stream.read_to_string(&mut response).map_err(|error| format!("Unable to read runtime response: {error}"))?;
    let (_, json) = response.split_once("\r\n\r\n").ok_or_else(|| "Runtime backend returned an invalid response.".to_string())?;
    let value: serde_json::Value = serde_json::from_str(json).map_err(|error| format!("Runtime backend returned invalid JSON: {error}"))?;
    if value.get("ok").and_then(|ok| ok.as_bool()) == Some(true) { Ok(value["data"].clone()) } else { Err(value.get("error").and_then(|error| error.as_str()).unwrap_or("Runtime request failed.").to_string()) }
}

#[tauri::command] fn start_agent(id: String) -> Result<serde_json::Value, String> { runtime_request("POST", &format!("/api/runtime/agents/{}/start", validate_runtime_id(&id)?), None) }
#[tauri::command] fn stop_agent(id: String) -> Result<serde_json::Value, String> { runtime_request("POST", &format!("/api/runtime/agents/{}/stop", validate_runtime_id(&id)?), None) }
#[tauri::command] fn restart_agent(id: String) -> Result<serde_json::Value, String> { runtime_request("POST", &format!("/api/runtime/agents/{}/restart", validate_runtime_id(&id)?), None) }
#[tauri::command] fn enable_agent(id: String) -> Result<serde_json::Value, String> { runtime_request("POST", &format!("/api/runtime/agents/{}/enable", validate_runtime_id(&id)?), None) }
#[tauri::command] fn disable_agent(id: String) -> Result<serde_json::Value, String> { runtime_request("POST", &format!("/api/runtime/agents/{}/disable", validate_runtime_id(&id)?), None) }
#[tauri::command] fn remove_agent(id: String) -> Result<serde_json::Value, String> { runtime_request("DELETE", &format!("/api/runtime/agents/{}", validate_runtime_id(&id)?), None) }
#[tauri::command] fn install_agent(manifest: serde_json::Value) -> Result<serde_json::Value, String> { runtime_request("POST", "/api/runtime/agents", Some(manifest)) }
#[tauri::command] fn import_agent(manifest: serde_json::Value) -> Result<serde_json::Value, String> { runtime_request("POST", "/api/runtime/agents", Some(manifest)) }
#[tauri::command] fn update_agent_config(id: String, configuration: serde_json::Value) -> Result<serde_json::Value, String> { runtime_request("PUT", &format!("/api/runtime/agents/{}/config", validate_runtime_id(&id)?), Some(configuration)) }
#[tauri::command] fn get_agent_logs(id: String) -> Result<serde_json::Value, String> { runtime_request("GET", &format!("/api/runtime/agents/{}/logs", validate_runtime_id(&id)?), None) }
#[tauri::command] fn get_agent_metrics(id: String) -> Result<serde_json::Value, String> { runtime_request("GET", &format!("/api/runtime/agents/{}/metrics", validate_runtime_id(&id)?), None) }
#[tauri::command] fn get_agent_tasks(id: String) -> Result<serde_json::Value, String> { runtime_request("GET", &format!("/api/runtime/agents/{}/tasks", validate_runtime_id(&id)?), None) }
#[tauri::command] fn subscribe_runtime_events() -> Result<String, String> { Ok("http://127.0.0.1:3001/api/runtime/events".to_string()) }

#[tauri::command]
fn set_system_volume(level: u8) -> Result<String, String> {
    if level > 100 {
        return Err("Volume must be between 0 and 100.".to_string());
    }
    let endpoint = default_audio_endpoint()?;
    unsafe {
        endpoint
            .SetMasterVolumeLevelScalar(level as f32 / 100.0, std::ptr::null())
            .map_err(|error| format!("Unable to set system volume: {error}"))?;
    }
    Ok(format!("System volume set to {level}%."))
}

#[tauri::command]
fn adjust_volume(delta: i8) -> Result<String, String> {
    let endpoint = default_audio_endpoint()?;
    let current = unsafe {
        endpoint
            .GetMasterVolumeLevelScalar()
            .map_err(|error| format!("Unable to read system volume: {error}"))?
    };
    let level = ((current * 100.0).round() as i16 + delta as i16).clamp(0, 100) as u8;
    set_system_volume(level)
}

#[tauri::command]
fn open_special_folder(folder: KnownFolder) -> Result<String, String> {
    let path = folder.path()?;
    fs::create_dir_all(&path).map_err(|error| format!("Unable to access {}: {error}", folder.display_name()))?;
    Command::new("explorer")
        .arg(&path)
        .spawn()
        .map_err(|error| format!("Unable to open {}: {error}", folder.display_name()))?;
    Ok(format!("Opening {}.", folder.display_name()))
}

#[tauri::command]
async fn save_storage_state(app: tauri::AppHandle, data: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let path = app.path().app_config_dir().map_err(|e| e.to_string())?.join("storage.json");
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        fs::write(path, data).map_err(|e| e.to_string())
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
fn load_storage_state(app: tauri::AppHandle, state: tauri::State<'_, AppState>) -> Result<StoragePayload, String> {
    let path = app.path().app_config_dir().map_err(|e| e.to_string())?.join("storage.json");
    let data = if path.exists() {
        fs::read_to_string(path).map_err(|e| e.to_string())?
    } else {
        "{}".to_string()
    };
    Ok(StoragePayload {
        data,
        was_dirty: state.was_dirty.load(Ordering::Relaxed),
    })
}

#[tauri::command]
async fn close_splashscreen(app: tauri::AppHandle) {
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
        let _ = main.unminimize();
        let _ = main.set_focus();
    }
    if let Some(splash) = app.get_webview_window("splashscreen") {
        let _ = splash.close();
    }
}

pub fn validate_and_resolve_path(raw_path: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(raw_path);
    let absolute_path = if path.is_absolute() {
        path.clone()
    } else {
        std::env::current_dir()
            .map(|d| d.join(&path))
            .map_err(|e| format!("Failed to resolve current directory: {e}"))?
    };

    let normalized_absolute = absolute_path.to_string_lossy().to_lowercase().replace('\\', "/");

    let mut allowed = false;
    for &folder in &[KnownFolder::Desktop, KnownFolder::Documents, KnownFolder::Downloads, KnownFolder::Pictures] {
        if let Ok(base_path) = folder.path() {
            let normalized_base = base_path.to_string_lossy().to_lowercase().replace('\\', "/");
            if normalized_absolute.starts_with(&normalized_base) {
                allowed = true;
                break;
            }
        }
    }

    if !allowed {
        return Err(format!("Access denied. Path '{}' is outside allowlisted directories.", raw_path));
    }

    Ok(absolute_path)
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct FileMoveProposal {
    pub from_path: String,
    pub to_path: String,
    pub filename: String,
    pub category: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct FileRenameProposal {
    pub from_path: String,
    pub to_path: String,
    pub old_filename: String,
    pub new_filename: String,
}

#[tauri::command]
fn extract_pdf_text(path: String) -> Result<String, String> {
    let verified_path = validate_and_resolve_path(&path)?;
    if !verified_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    if verified_path.extension().and_then(|ext| ext.to_str()).map(|s| s.to_ascii_lowercase()) != Some("pdf".to_string()) {
        return Err("File is not a PDF.".to_string());
    }

    let bytes = fs::read(&verified_path)
        .map_err(|e| format!("Failed to read PDF file: {e}"))?;

    let text = pdf_extract::extract_text_from_mem(&bytes)
        .map_err(|e| format!("Failed to extract text from PDF: {e}"))?;

    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Err("SCANNED_PDF: No extractable text found.".to_string());
    }

    Ok(trimmed.to_string())
}

#[tauri::command]
fn preview_organize_folder(folder: KnownFolder) -> Result<Vec<FileMoveProposal>, String> {
    let folder_path = folder.path()?;
    if !folder_path.exists() {
        return Err(format!("Directory does not exist: {:?}", folder_path));
    }

    let mut proposals = Vec::new();
    let entries = fs::read_dir(&folder_path)
        .map_err(|e| format!("Failed to read directory: {e}"))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Error reading directory entry: {e}"))?;
        let path = entry.path();
        if path.is_file() {
            let filename = match path.file_name().and_then(|f| f.to_str()) {
                Some(name) => name.to_string(),
                None => continue,
            };

            if filename.starts_with('.') || filename.starts_with('~') {
                continue;
            }

            let ext = path.extension()
                .and_then(|e| e.to_str())
                .map(|e| e.to_ascii_lowercase())
                .unwrap_or_default();

            let category = match ext.as_str() {
                "pdf" | "docx" | "doc" | "txt" | "xlsx" | "xls" | "pptx" | "ppt" | "csv" | "md" => "Documents",
                "png" | "jpg" | "jpeg" | "gif" | "webp" | "svg" | "bmp" => "Images",
                "zip" | "tar" | "gz" | "rar" | "7z" => "Archives",
                "mp3" | "wav" | "m4a" | "ogg" | "flac" => "Audio",
                "mp4" | "mkv" | "avi" | "mov" | "webm" => "Video",
                "js" | "ts" | "tsx" | "html" | "css" | "rs" | "py" | "json" | "go" | "cpp" | "c" => "Code",
                "exe" | "msi" => "Executables",
                _ => "Other",
            };

            let dest_dir = folder_path.join(category);
            let dest_path = dest_dir.join(&filename);

            proposals.push(FileMoveProposal {
                from_path: path.to_string_lossy().to_string(),
                to_path: dest_path.to_string_lossy().to_string(),
                filename,
                category: category.to_string(),
            });
        }
    }

    Ok(proposals)
}

#[tauri::command]
fn execute_organize_folder(proposals: Vec<FileMoveProposal>) -> Result<String, String> {
    let mut count = 0;
    for prop in proposals {
        let from = validate_and_resolve_path(&prop.from_path)?;
        let to = validate_and_resolve_path(&prop.to_path)?;

        if let Some(parent) = to.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create category directory: {e}"))?;
        }

        fs::rename(&from, &to)
            .map_err(|e| format!("Failed to move file '{}' to '{}': {}", prop.from_path, prop.to_path, e))?;
        count += 1;
    }

    Ok(format!("Successfully organized {} files.", count))
}

#[tauri::command]
fn preview_rename_files(folder: KnownFolder, search: String, replace: String) -> Result<Vec<FileRenameProposal>, String> {
    let folder_path = folder.path()?;
    if !folder_path.exists() {
        return Err(format!("Directory does not exist: {:?}", folder_path));
    }

    let mut proposals = Vec::new();
    let entries = fs::read_dir(&folder_path)
        .map_err(|e| format!("Failed to read directory: {e}"))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Error reading directory entry: {e}"))?;
        let path = entry.path();
        if path.is_file() {
            let filename = match path.file_name().and_then(|f| f.to_str()) {
                Some(name) => name.to_string(),
                None => continue,
            };

            if filename.starts_with('.') || filename.starts_with('~') {
                continue;
            }

            if filename.contains(&search) {
                let new_filename = filename.replace(&search, &replace);
                let to_path = folder_path.join(&new_filename);

                proposals.push(FileRenameProposal {
                    from_path: path.to_string_lossy().to_string(),
                    to_path: to_path.to_string_lossy().to_string(),
                    old_filename: filename,
                    new_filename,
                });
            }
        }
    }

    Ok(proposals)
}

#[tauri::command]
fn execute_rename_files(proposals: Vec<FileRenameProposal>) -> Result<String, String> {
    let mut count = 0;
    for prop in proposals {
        let from = validate_and_resolve_path(&prop.from_path)?;
        let to = validate_and_resolve_path(&prop.to_path)?;

        fs::rename(&from, &to)
            .map_err(|e| format!("Failed to rename file '{}' to '{}': {}", prop.from_path, prop.to_path, e))?;
        count += 1;
    }

    Ok(format!("Successfully renamed {} files.", count))
}

#[tauri::command]
fn convert_docx_to_pdf(path: String) -> Result<String, String> {
    let verified_path = validate_and_resolve_path(&path)?;
    if !verified_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    if verified_path.extension().and_then(|ext| ext.to_str()).map(|s| s.to_ascii_lowercase()) != Some("docx".to_string()) {
        return Err("File is not a DOCX document.".to_string());
    }

    let parent_dir = verified_path.parent()
        .ok_or_else(|| "Could not resolve parent directory of document.".to_string())?;

    let output = Command::new("soffice")
        .args([
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            &parent_dir.to_string_lossy(),
            &verified_path.to_string_lossy(),
        ])
        .output()
        .map_err(|e| format!("Failed to launch LibreOffice (soffice). Make sure it is installed and added to your system PATH: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("LibreOffice conversion failed: {}", stderr));
    }

    let file_stem = verified_path.file_stem()
        .ok_or_else(|| "Failed to get file stem.".to_string())?;
    let target_pdf_path = parent_dir.join(format!("{}.pdf", file_stem.to_string_lossy()));

    if !target_pdf_path.exists() {
        return Err("Conversion output PDF file was not found after execution.".to_string());
    }

    Ok(target_pdf_path.to_string_lossy().to_string())
}

fn clean_exit(app: &tauri::AppHandle) {
    if let Ok(config_dir) = app.path().app_config_dir() {
        let dirty_flag_path = config_dir.join("dirty.flag");
        let _ = fs::remove_file(dirty_flag_path);
    }
    app.exit(0);
}

#[tauri::command]
fn save_api_key(provider_id: String, raw_key: String) -> Result<String, String> {
    let key_name = match provider_id.as_str() {
        "gemini" => "GEMINI_API_KEY",
        "nvidia" => "NVIDIA_API_KEY",
        "elevenlabs" => "ELEVENLABS_API_KEY",
        "openai" => "VITE_OPENAI_API_KEY",
        "claude" => "VITE_CLAUDE_API_KEY",
        "finnhub" => "FINNHUB_API_KEY",
        "twilio" => "TWILIO_ACCOUNT_SID",
        "whatsapp" => "WHATSAPP_API_TOKEN",
        _ => return Err(format!("Unknown provider: {}", provider_id)),
    };

    let trimmed = raw_key.trim();
    if trimmed.is_empty() {
        return Err("API key cannot be empty.".to_string());
    }

    std::env::set_var(key_name, trimmed);

    let masked = if trimmed.len() <= 8 {
        "••••••••".to_string()
    } else {
        format!("{}••••••••{}", &trimmed[..4], &trimmed[trimmed.len() - 4..])
    };

    Ok(masked)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(main) = app.get_webview_window("main") {
                let _ = main.show();
                let _ = main.unminimize();
                let _ = main.set_focus();
            }
        }))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_autostart::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            close_splashscreen,
            save_storage_state,
            load_storage_state,
            open_application,
            search_web,
            create_folder,
            take_screenshot,
            set_system_volume,
            adjust_volume,
            open_special_folder,
            extract_pdf_text,
            preview_organize_folder,
            execute_organize_folder,
            preview_rename_files,
            execute_rename_files,
            convert_docx_to_pdf,
            save_api_key,
            start_agent,
            stop_agent,
            restart_agent,
            enable_agent,
            disable_agent,
            install_agent,
            remove_agent,
            import_agent,
            update_agent_config,
            get_agent_logs,
            get_agent_metrics,
            get_agent_tasks,
            subscribe_runtime_events,
            terminal_pty::spawn_pty,
            terminal_pty::write_to_pty,
            terminal_pty::resize_pty,
            terminal_pty::close_pty,
            terminal_pty::check_git_bash_available
        ])
        .setup(|app| {
            app.manage(terminal_pty::TerminalPtyState::default());
            if cfg!(debug_assertions) {
                if let Err(error) = app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                ) {
                    eprintln!("[JARVIS] Debug logging is unavailable; continuing without it: {error}");
                }
            }

            // --- CRASH RECOVERY: DIRTY FLAG SETUP ---
            let config_dir = app.path().app_config_dir().expect("Failed to get config directory");
            let dirty_flag_path = config_dir.join("dirty.flag");
            let was_dirty = dirty_flag_path.exists();

            // Create dirty.flag for next crash detection
            if let Some(parent) = dirty_flag_path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            let _ = fs::write(&dirty_flag_path, "1");

            // Manage app state
            app.manage(AppState {
                was_dirty: AtomicBool::new(was_dirty),
            });

            // --- 1. SYSTEM TRAY ICON SETUP ---
            let toggle_item = MenuItemBuilder::with_id("tray_toggle", "Show/Hide").build(app)?;
            let tray_dashboard = MenuItemBuilder::with_id("tray_dashboard", "Open Dashboard").build(app)?;
            let tray_chat = MenuItemBuilder::with_id("tray_chat", "Quick Chat").build(app)?;
            let tray_settings = MenuItemBuilder::with_id("tray_settings", "Settings").build(app)?;
            let tray_quit = MenuItemBuilder::with_id("tray_quit", "Quit").build(app)?;

            let tray_menu = MenuBuilder::new(app)
                .items(&[&toggle_item, &tray_dashboard, &tray_chat, &tray_settings, &tray_quit])
                .build()?;

            let _tray = TrayIconBuilder::new()
                .icon(Image::from_bytes(include_bytes!("../icons/32x32.png")).expect("Failed to load tray icon"))
                .menu(&tray_menu)
                .on_menu_event(|app, event| {
                    let main = app.get_webview_window("main");
                    match event.id().as_ref() {
                        "tray_toggle" => {
                            if let Some(main_win) = main {
                                let is_visible = main_win.is_visible().unwrap_or(false);
                                if is_visible {
                                    let _ = main_win.hide();
                                } else {
                                    let _ = main_win.show();
                                    let _ = main_win.set_focus();
                                }
                            }
                        }
                        "tray_dashboard" => {
                            if let Some(main_win) = main {
                                let _ = main_win.show();
                                let _ = main_win.set_focus();
                                let _ = main_win.emit("navigate", "/").unwrap();
                            }
                        }
                        "tray_chat" => {
                            if let Some(main_win) = main {
                                let _ = main_win.show();
                                let _ = main_win.set_focus();
                                let _ = main_win.emit("navigate", "/chat").unwrap();
                            }
                        }
                        "tray_settings" => {
                            if let Some(main_win) = main {
                                let _ = main_win.show();
                                let _ = main_win.set_focus();
                                let _ = main_win.emit("navigate", "/settings").unwrap();
                            }
                        }
                        "tray_quit" => {
                            clean_exit(app);
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            let handle = app.handle().clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_secs(10));
                if let Some(main) = handle.get_webview_window("main") {
                    if let Ok(visible) = main.is_visible() {
                        if !visible {
                            println!("[JARVIS Watchdog] Main window remained hidden after 10s. Forcing window reveal.");
                            let _ = main.show();
                            let _ = main.unminimize();
                            let _ = main.set_focus();
                            if let Some(splash) = handle.get_webview_window("splashscreen") {
                                let _ = splash.close();
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                if window.label() == "main" {
                    window.hide().unwrap();
                    api.prevent_close();
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    fn get_downloads_dir() -> PathBuf {
        let profile = std::env::var_os("USERPROFILE").map(PathBuf::from).unwrap();
        profile.join("Downloads")
    }

    #[test]
    fn run_verification_loop() {
        println!("========================================================");
        println!("         STARTING JARVIS OS VERIFICATION LOOP           ");
        println!("========================================================");

        // 1. Test Path-Traversal Protection
        println!("\n[1] Testing Path-Traversal Protection:");
        let traversal_paths = vec![
            "C:\\Windows\\System32\\cmd.exe",
            "..\\..\\Windows\\cmd.exe",
            "d:\\jarvis\\apps\\web\\src-tauri\\src\\lib.rs",
        ];

        for path in traversal_paths {
            match validate_and_resolve_path(path) {
                Ok(resolved) => {
                    println!("  FAIL: Allowed unauthorized path '{}' -> {:?}", path, resolved);
                    panic!("Path traversal check failed!");
                }
                Err(e) => println!("  SUCCESS: Correctly rejected path '{}'\n           Error: {}", path, e),
            }
        }

        // 2. Test PDF Summarization on a real, text-based PDF
        println!("\n[2] Testing PDF Summarization (text-based):");
        let text_pdf = "C:\\Users\\H\\Desktop\\Text_to_PDF_Onlinenotpad.pdf";
        match extract_pdf_text(text_pdf.to_string()) {
            Ok(text) => {
                println!("  SUCCESS: Extracted text from PDF. Total chars: {}", text.len());
                let sample_len = std::cmp::min(250, text.len());
                println!("  --- LITERAL TEXT SAMPLE ---");
                println!("{}", &text[..sample_len]);
                println!("  ---------------------------");
            }
            Err(e) => {
                println!("  FAIL: Failed to extract text: {}", e);
                panic!("PDF extraction failed!");
            }
        }

        // 3. Test Scanned-PDF path
        println!("\n[3] Testing Scanned-PDF path (image-only / no text):");
        let scanned_pdf = "C:\\Users\\H\\Documents\\2026-02-17 19-10-08.pdf";
        match extract_pdf_text(scanned_pdf.to_string()) {
            Ok(text) => {
                println!("  WARNING: Extracted text from supposed scanned PDF? Character count: {}", text.len());
                let sample_len = std::cmp::min(200, text.len());
                println!("  Text sample: {:?}", &text[..sample_len]);
            }
            Err(e) => {
                if e.contains("SCANNED_PDF") {
                    println!("  SUCCESS: Correctly identified scanned PDF.\n           Error: {}", e);
                } else {
                    println!("  INFO: Extracted failed with standard error: {}", e);
                }
            }
        }

        // 4. Test Organize & Rename on a test sandbox in Downloads
        println!("\n[4] Testing Organize & Rename (Sandbox):");
        let downloads = get_downloads_dir();
        
        // Backup existing files in Downloads
        println!("  Backing up Downloads directory...");
        let mut backup = Vec::new();
        if let Ok(entries) = fs::read_dir(&downloads) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.is_file() {
                        let filename = path.file_name().unwrap().to_os_string();
                        let backup_path = downloads.join(format!("{}.bak_temp", filename.to_string_lossy()));
                        if fs::rename(&path, &backup_path).is_ok() {
                            backup.push((backup_path, path));
                        }
                    }
                }
            }
        }
        println!("  Backed up {} files.", backup.len());

        // Create dummy files for organization test
        let test_doc = downloads.join("test_file1.docx");
        let test_img = downloads.join("test_file2.png");
        let test_zip = downloads.join("test_file3.zip");

        fs::write(&test_doc, "dummy docx content").unwrap();
        fs::write(&test_img, "dummy png content").unwrap();
        fs::write(&test_zip, "dummy zip content").unwrap();
        println!("  Created 3 dummy files for organization.");

        // Run preview organize
        println!("\n  --- Proposing Organization Plan ---");
        match preview_organize_folder(KnownFolder::Downloads) {
            Ok(proposals) => {
                for p in &proposals {
                    println!("    File: '{}' -> Proposed Folder: '{}'", p.filename, p.category);
                }
                
                // Execute organization
                println!("  Executing Organization...");
                match execute_organize_folder(proposals) {
                    Ok(msg) => {
                        println!("    {}", msg);
                        
                        // Verify actual folder contents matches preview
                        println!("  Verifying actual folder contents:");
                        let expected_paths = vec![
                            downloads.join("Documents").join("test_file1.docx"),
                            downloads.join("Images").join("test_file2.png"),
                            downloads.join("Archives").join("test_file3.zip"),
                        ];
                        for expected in &expected_paths {
                            if expected.exists() {
                                println!("    FOUND expected file: {:?}", expected.file_name().unwrap());
                            } else {
                                println!("    MISSING expected file: {:?}", expected);
                                panic!("Organize verification failed: file is missing!");
                            }
                        }
                    }
                    Err(e) => {
                        println!("    FAIL: Organization execution failed: {}", e);
                        panic!("Organize execution failed!");
                    }
                }
            }
            Err(e) => {
                println!("    FAIL: Organization preview failed: {}", e);
                panic!("Organize preview failed!");
            }
        }

        // Clean up organized files
        let _ = fs::remove_file(downloads.join("Documents").join("test_file1.docx"));
        let _ = fs::remove_file(downloads.join("Images").join("test_file2.png"));
        let _ = fs::remove_file(downloads.join("Archives").join("test_file3.zip"));
        let _ = fs::remove_dir(downloads.join("Documents"));
        let _ = fs::remove_dir(downloads.join("Images"));
        let _ = fs::remove_dir(downloads.join("Archives"));

        // Create dummy files for rename test
        let rename_1 = downloads.join("draft_report_A.txt");
        let rename_2 = downloads.join("draft_report_B.txt");
        let rename_3 = downloads.join("final_report.txt");

        fs::write(&rename_1, "draft content A").unwrap();
        fs::write(&rename_2, "draft content B").unwrap();
        fs::write(&rename_3, "final content").unwrap();
        println!("\n  Created 3 dummy files for renaming.");

        // Run preview rename
        println!("  --- Proposing Renaming Plan ---");
        match preview_rename_files(KnownFolder::Downloads, "draft".to_string(), "review".to_string()) {
            Ok(proposals) => {
                for p in &proposals {
                    println!("    Rename: '{}' -> '{}'", p.old_filename, p.new_filename);
                }

                // Execute renames
                println!("  Executing Renaming...");
                match execute_rename_files(proposals) {
                    Ok(msg) => {
                        println!("    {}", msg);

                        // Verify actual files
                        let expected_renames = vec![
                            downloads.join("review_report_A.txt"),
                            downloads.join("review_report_B.txt"),
                            downloads.join("final_report.txt"),
                        ];
                        for expected in &expected_renames {
                            if expected.exists() {
                                println!("    FOUND renamed file: {:?}", expected.file_name().unwrap());
                            } else {
                                println!("    MISSING renamed file: {:?}", expected);
                                panic!("Rename verification failed: file is missing!");
                            }
                        }
                    }
                    Err(e) => {
                        println!("    FAIL: Renaming execution failed: {}", e);
                        panic!("Rename execution failed!");
                    }
                }
            }
            Err(e) => {
                println!("    FAIL: Renaming preview failed: {}", e);
                panic!("Rename preview failed!");
            }
        }

        // Clean up renamed files
        let _ = fs::remove_file(downloads.join("review_report_A.txt"));
        let _ = fs::remove_file(downloads.join("review_report_B.txt"));
        let _ = fs::remove_file(downloads.join("final_report.txt"));

        // Restore original files
        println!("\n  Restoring backed up files...");
        for (bak_path, original_path) in backup {
            let _ = fs::rename(&bak_path, &original_path);
        }
        println!("  Restore completed.");
        println!("========================================================");
    }
}
