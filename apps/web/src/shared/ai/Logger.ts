export class AILogger {
  private isDev = (() => {
    try {
      return Boolean((import.meta as any)?.env?.DEV);
    } catch (_) {
      return false;
    }
  })();

  public info(namespace: string, message: string, ...args: any[]) {
    this.log('info', namespace, message, ...args);
  }

  public warn(namespace: string, message: string, ...args: any[]) {
    this.log('warn', namespace, message, ...args);
  }

  public error(namespace: string, message: string, ...args: any[]) {
    this.log('error', namespace, message, ...args);
  }

  public debug(namespace: string, message: string, ...args: any[]) {
    if (this.isDev) {
      this.log('debug', namespace, message, ...args);
    }
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', namespace: string, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${namespace}]`;
    
    switch (level) {
      case 'error':
        console.error(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      default:
        console.log(prefix, message, ...args);
    }
  }
}

export const aiLogger = new AILogger();

export const latencyTracker = {
  startTime: 0,
  start() {
    this.startTime = Date.now();
  },
  getElapsed(): number {
    return this.startTime ? Date.now() - this.startTime : 0;
  }
};
