use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::thread;
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use tauri::{AppHandle, Emitter, State};

pub struct PtySession {
  pub master: Box<dyn MasterPty + Send>,
  pub writer: Box<dyn Write + Send>,
}

#[derive(Default)]
pub struct TerminalPtyState {
  pub sessions: Arc<Mutex<HashMap<String, PtySession>>>,
}

pub fn check_git_bash_path() -> Option<String> {
  let paths = [
    r"C:\Program Files\Git\bin\bash.exe",
    r"C:\Program Files (x86)\Git\bin\bash.exe",
    r"C:\Git\bin\bash.exe",
  ];
  for p in paths {
    if Path::new(p).exists() {
      return Some(p.to_string());
    }
  }
  None
}

#[tauri::command]
pub fn check_git_bash_available() -> bool {
  check_git_bash_path().is_some()
}

#[tauri::command]
pub fn spawn_pty(
  app: AppHandle,
  state: State<'_, TerminalPtyState>,
  shell: String,
  cwd: Option<String>,
) -> Result<String, String> {
  let session_id = format!("term-{}", uuid_short());

  let (exec_path, args) = match shell.to_lowercase().as_str() {
    "powershell" => ("powershell.exe".to_string(), vec!["-NoLogo"]),
    "cmd" => ("cmd.exe".to_string(), vec![]),
    "gitbash" | "git-bash" => {
      if let Some(gb_path) = check_git_bash_path() {
        (gb_path, vec!["--login", "-i"])
      } else {
        return Err("Git Bash is not installed on this system.".to_string());
      }
    }
    _ => ("powershell.exe".to_string(), vec!["-NoLogo"]),
  };

  let pty_system = native_pty_system();
  let size = PtySize {
    rows: 24,
    cols: 80,
    pixel_width: 0,
    pixel_height: 0,
  };

  let pair = pty_system
    .openpty(size)
    .map_err(|e| format!("Failed to open PTY: {e}"))?;

  let mut cmd = CommandBuilder::new(exec_path);
  cmd.args(args);

  if let Some(working_dir) = cwd {
    if Path::new(&working_dir).exists() {
      cmd.cwd(working_dir);
    }
  } else if let Ok(profile) = std::env::var("USERPROFILE") {
    cmd.cwd(profile);
  }

  let _child = pair
    .slave
    .spawn_command(cmd)
    .map_err(|e| format!("Failed to spawn shell process: {e}"))?;

  let mut reader = pair
    .master
    .try_clone_reader()
    .map_err(|e| format!("Failed to clone PTY reader: {e}"))?;

  let writer = pair
    .master
    .take_writer()
    .map_err(|e| format!("Failed to take PTY writer: {e}"))?;

  let app_handle = app.clone();
  let event_name = format!("terminal:stream:{session_id}");
  let exit_event_name = format!("terminal:exit:{session_id}");

  // Spawn background stdout stream thread
  thread::spawn(move || {
    let mut buf = [0u8; 1024];
    loop {
      match reader.read(&mut buf) {
        Ok(0) => break,
        Ok(n) => {
          let text = String::from_utf8_lossy(&buf[..n]).to_string();
          let _ = app_handle.emit(&event_name, text);
        }
        Err(_) => break,
      }
    }
    let _ = app_handle.emit(&exit_event_name, 0);
  });

  let mut sessions = state.sessions.lock().unwrap();
  sessions.insert(
    session_id.clone(),
    PtySession {
      master: pair.master,
      writer,
    },
  );

  Ok(session_id)
}

#[tauri::command]
pub fn write_to_pty(
  state: State<'_, TerminalPtyState>,
  session_id: String,
  input: String,
) -> Result<(), String> {
  let mut sessions = state.sessions.lock().unwrap();
  if let Some(session) = sessions.get_mut(&session_id) {
    let formatted_input = if !input.ends_with('\n') && !input.ends_with('\r') {
      format!("{input}\r\n")
    } else {
      input
    };
    session
      .writer
      .write_all(formatted_input.as_bytes())
      .map_err(|e| format!("Failed to write to PTY: {e}"))?;
    session
      .writer
      .flush()
      .map_err(|e| format!("Failed to flush PTY writer: {e}"))?;
    Ok(())
  } else {
    Err(format!("Session {session_id} not found"))
  }
}

#[tauri::command]
pub fn resize_pty(
  state: State<'_, TerminalPtyState>,
  session_id: String,
  cols: u16,
  rows: u16,
) -> Result<(), String> {
  let mut sessions = state.sessions.lock().unwrap();
  if let Some(session) = sessions.get_mut(&session_id) {
    session
      .master
      .resize(PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
      })
      .map_err(|e| format!("Failed to resize PTY: {e}"))?;
    Ok(())
  } else {
    Err(format!("Session {session_id} not found"))
  }
}

#[tauri::command]
pub fn close_pty(
  state: State<'_, TerminalPtyState>,
  session_id: String,
) -> Result<(), String> {
  let mut sessions = state.sessions.lock().unwrap();
  sessions.remove(&session_id);
  Ok(())
}

fn uuid_short() -> String {
  use std::time::{SystemTime, UNIX_EPOCH};
  let duration = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default();
  format!("{:x}", duration.as_nanos())
}
