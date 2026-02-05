/**
 * Centralized logging utility for JobAppFiller extension
 * Provides consistent, detailed logging across all contexts
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success'

interface LogOptions {
  data?: any
  context?: string
  timestamp?: boolean
}

class Logger {
  private prefix: string
  private enabled: boolean = true

  constructor(context: string) {
    this.prefix = `[JobAppFiller:${context}]`
  }

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const timestamp = options?.timestamp !== false ? new Date().toISOString() : ''
    const contextStr = options?.context ? ` [${options.context}]` : ''
    return `${timestamp} ${this.prefix}${contextStr} ${message}`
  }

  private getLogStyle(level: LogLevel): string {
    const styles = {
      info: 'color: #2196F3; font-weight: bold',
      warn: 'color: #FF9800; font-weight: bold',
      error: 'color: #F44336; font-weight: bold',
      debug: 'color: #9E9E9E; font-weight: normal',
      success: 'color: #4CAF50; font-weight: bold',
    }
    return styles[level]
  }

  info(message: string, options?: LogOptions) {
    if (!this.enabled) return
    console.log(`%c${this.formatMessage('info', message, options)}`, this.getLogStyle('info'))
    if (options?.data) {
      console.log('  📊 Data:', options.data)
    }
  }

  success(message: string, options?: LogOptions) {
    if (!this.enabled) return
    console.log(`%c${this.formatMessage('success', `✓ ${message}`, options)}`, this.getLogStyle('success'))
    if (options?.data) {
      console.log('  📊 Data:', options.data)
    }
  }

  warn(message: string, options?: LogOptions) {
    if (!this.enabled) return
    console.warn(`%c${this.formatMessage('warn', `⚠️  ${message}`, options)}`, this.getLogStyle('warn'))
    if (options?.data) {
      console.warn('  📊 Data:', options.data)
    }
  }

  error(message: string, error?: Error | any, options?: LogOptions) {
    if (!this.enabled) return
    console.error(`%c${this.formatMessage('error', `❌ ${message}`, options)}`, this.getLogStyle('error'))
    if (error) {
      console.error('  🔥 Error:', error)
      if (error?.stack) {
        console.error('  📚 Stack:', error.stack)
      }
    }
    if (options?.data) {
      console.error('  📊 Data:', options.data)
    }
  }

  debug(message: string, options?: LogOptions) {
    if (!this.enabled) return
    console.log(`%c${this.formatMessage('debug', `🔍 ${message}`, options)}`, this.getLogStyle('debug'))
    if (options?.data) {
      console.log('  📊 Data:', options.data)
    }
  }

  group(label: string, collapsed: boolean = false) {
    if (!this.enabled) return
    if (collapsed) {
      console.groupCollapsed(`%c${this.prefix} ${label}`, 'color: #2196F3; font-weight: bold')
    } else {
      console.group(`%c${this.prefix} ${label}`, 'color: #2196F3; font-weight: bold')
    }
  }

  groupEnd() {
    if (!this.enabled) return
    console.groupEnd()
  }

  table(data: any, label?: string) {
    if (!this.enabled) return
    if (label) {
      console.log(`%c${this.prefix} ${label}`, 'color: #2196F3; font-weight: bold')
    }
    console.table(data)
  }

  time(label: string) {
    if (!this.enabled) return
    console.time(`${this.prefix} ${label}`)
  }

  timeEnd(label: string) {
    if (!this.enabled) return
    console.timeEnd(`${this.prefix} ${label}`)
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }
}

// Create logger instances for different contexts
export const createLogger = (context: string) => new Logger(context)

// Pre-configured loggers for common contexts
export const contentScriptLogger = createLogger('ContentScript')
export const injectLogger = createLogger('Inject')
export const backgroundLogger = createLogger('Background')
export const storageLogger = createLogger('Storage')
export const formFieldLogger = createLogger('FormField')
