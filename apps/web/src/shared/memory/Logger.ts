export class MemoryLogger {
  private isDev = import.meta.env.DEV;

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
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [Memory:${namespace}]`;
    
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

export const memoryLogger = new MemoryLogger();
export default memoryLogger;
