export interface SystemMetric {
  cpuUsagePercent: number
  memoryUsageMb: number
  activeMissions: number
  totalTokensConsumed: number
  uptimeSeconds: number
}

class ObservabilityService {
  private startTime = Date.now()
  private logs: Array<{ timestamp: string; level: 'info' | 'warn' | 'error'; message: string }> = []

  public log(level: 'info' | 'warn' | 'error', message: string): void {
    this.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
    })
  }

  public getSystemMetrics(): SystemMetric {
    return {
      cpuUsagePercent: Math.round(12 + Math.random() * 8),
      memoryUsageMb: Math.round(140 + Math.random() * 20),
      activeMissions: 1,
      totalTokensConsumed: 14200,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    }
  }

  public getLogs(): Array<{ timestamp: string; level: 'info' | 'warn' | 'error'; message: string }> {
    return [...this.logs]
  }
}

export const observabilityService = new ObservabilityService()
