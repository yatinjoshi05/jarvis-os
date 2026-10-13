export interface SettingsConfig {
  theme: 'dark' | 'light' | 'system'
  language: string
  defaultAIProvider: 'gemini' | 'claude' | 'openai' | 'local'
  autoVerify: boolean
  maxTokenBudget: number
  desktopNotifications: boolean
  developerMode: boolean
}

class SettingsManager {
  private config: SettingsConfig = {
    theme: 'dark',
    language: 'en-US',
    defaultAIProvider: 'gemini',
    autoVerify: true,
    maxTokenBudget: 500000,
    desktopNotifications: true,
    developerMode: true,
  }

  public getSettings(): SettingsConfig {
    return { ...this.config }
  }

  public updateSettings(partial: Partial<SettingsConfig>): SettingsConfig {
    this.config = { ...this.config, ...partial }
    return this.getSettings()
  }
}

export const settingsManager = new SettingsManager()
