import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE_PATH = path.resolve(__dirname, '../../config/settings.json');

/**
 * SettingsService — Public API for Application Configuration, Preferences & API Keys
 */
export class SettingsService {
  /**
   * Load durable settings from configuration storage
   */
  static async getSettings() {
    try {
      if (fs.existsSync(SETTINGS_FILE_PATH)) {
        const raw = await fs.promises.readFile(SETTINGS_FILE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn(`[SettingsService] Could not load settings:`, err.message);
    }
    return {};
  }

  /**
   * Save settings update to configuration storage
   */
  static async saveSettings(settingsData) {
    try {
      const dir = path.dirname(SETTINGS_FILE_PATH);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
      const existing = await this.getSettings();
      const merged = { ...existing, ...settingsData };
      await fs.promises.writeFile(SETTINGS_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
      return merged;
    } catch (err) {
      console.error(`[SettingsService] Failed to save settings:`, err.message);
      throw new Error(`SettingsService Error: ${err.message}`);
    }
  }
}
