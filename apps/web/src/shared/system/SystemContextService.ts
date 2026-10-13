/**
 * SystemContextService.ts
 * Manages full computer system context, real-time clock/date formatting,
 * system access capabilities, and live weather telemetry for JARVIS OS.
 */

export interface WeatherInfo {
  location: string;
  country: string;
  tempC: number;
  tempF: number;
  feelsLikeC: number;
  condition: string;
  humidity: number;
  windSpeedKmh: number;
  timestamp: number;
}

export class SystemContextService {
  /**
   * Get current formatted local system time and date
   */
  public static getCurrentTimeAndDate(): { time: string; date: string; timeZone: string; full: string } {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const full = `${date} at ${time} (${timeZone})`;

    return { time, date, timeZone, full };
  }

  /**
   * Fetch live weather data for a given city or current IP location (via wttr.in free service)
   */
  public static async fetchLiveWeather(location = ''): Promise<string> {
    const cleanLoc = location.trim();
    const query = cleanLoc ? encodeURIComponent(cleanLoc) : '';

    // 1. Try wttr.in JSON format (j1)
    try {
      const url = `https://wttr.in/${query}?format=j1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        const current = data.current_condition?.[0];
        const area = data.nearest_area?.[0];

        const cityName = cleanLoc || area?.areaName?.[0]?.value || area?.region?.[0]?.value || 'Your Current Location';
        const country = area?.country?.[0]?.value || '';

        if (current) {
          const tempC = current.temp_C;
          const tempF = current.temp_F;
          const condition = current.weatherDesc?.[0]?.value || 'Clear';
          const humidity = current.humidity;
          const windKmh = current.windspeedKmph;
          const feelsLikeC = current.FeelsLikeC;

          return `### 🌤️ Live Weather Report: ${cityName}${country ? `, ${country}` : ''}\n\n` +
                 `- **Condition**: ${condition}\n` +
                 `- **Temperature**: ${tempC}°C (${tempF}°F)\n` +
                 `- **Feels Like**: ${feelsLikeC}°C\n` +
                 `- **Humidity**: ${humidity}%\n` +
                 `- **Wind Speed**: ${windKmh} km/h\n` +
                 `\n*Live telemetry updated at ${new Date().toLocaleTimeString()}*`;
        }
      }
    } catch (_) {}

    // 2. Try wttr.in text format fallback (format=3)
    try {
      const url = `https://wttr.in/${query}?format=3`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const text = await res.text();
        if (text && !text.includes('Unknown location')) {
          return `### 🌤️ Live Weather Report\n\n${text.trim()}`;
        }
      }
    } catch (_) {}

    return `Unable to fetch live weather data for "${location || 'your location'}". Please check internet connectivity.`;
  }

  /**
   * Build full system environment context block for LLM prompts
   */
  public static getSystemEnvironmentContext(): string {
    const { time, date, timeZone } = this.getCurrentTimeAndDate();
    const platform = typeof navigator !== 'undefined' ? navigator.platform : 'Windows Desktop';

    return `=== JARVIS OS COMPUTER SYSTEM CONTEXT & CAPABILITIES ===\n` +
           `- Current Local Time: ${time} (${timeZone})\n` +
           `- Current Date: ${date}\n` +
           `- Host Platform: ${platform}\n` +
           `- System Access: FULL PERMISSIONS ENABLED\n` +
           `- Active Controls: App Launcher (Chrome/VS Code/Spotify), Desktop/Downloads Organizer, Volume Controller, PDF Extractor/Summarizer, Word to PDF Converter, Screenshot Capture, Live Weather Telemetry, Web Search\n\n`;
  }
}

export default SystemContextService;
