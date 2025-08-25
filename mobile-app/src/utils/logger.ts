// Logger utility for development vs production logging
import { isFeatureEnabled } from '../config/environment';

class Logger {
  private isDevelopment = isFeatureEnabled('DEBUG_MODE');

  log(...args: any[]) {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  error(...args: any[]) {
    // Always log errors, even in production
    console.error(...args);
  }

  warn(...args: any[]) {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  info(...args: any[]) {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  debug(...args: any[]) {
    if (this.isDevelopment) {
      console.debug(...args);
    }
  }
}

export const logger = new Logger();
export default logger;
