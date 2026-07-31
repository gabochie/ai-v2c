export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  correlationId?: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  environment: string;
}

// Redact sensitive values from context
function sanitizeData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['key', 'token', 'secret', 'password', 'authorization', 'apiKey', 'gemini_api_key'];

  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (sensitiveKeys.some((sk) => k.toLowerCase().includes(sk))) {
      sanitized[k] = '[REDACTED_SECRET]';
    } else if (typeof v === 'object' && v !== null) {
      sanitized[k] = sanitizeData(v);
    } else {
      sanitized[k] = v;
    }
  }

  return sanitized;
}

class Logger {
  private serviceName = 'forge-ai-engine';
  private environment = process.env.NODE_ENV || 'development';

  private createEntry(level: LogLevel, message: string, context?: Record<string, unknown>, err?: Error): StructuredLogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      environment: this.environment,
      ...(context ? { context: sanitizeData(context) as Record<string, unknown> } : {}),
      ...(err ? {
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        }
      } : {}),
    };
  }

  public info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('INFO', message, context);
    console.log(JSON.stringify(entry));
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('WARN', message, context);
    console.warn(JSON.stringify(entry));
  }

  public error(message: string, err?: Error, context?: Record<string, unknown>): void {
    const entry = this.createEntry('ERROR', message, context, err);
    console.error(JSON.stringify(entry));
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.LOG_LEVEL === 'debug' || this.environment !== 'production') {
      const entry = this.createEntry('DEBUG', message, context);
      console.debug(JSON.stringify(entry));
    }
  }

  public audit(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry('AUDIT', message, context);
    console.log(JSON.stringify(entry));
  }
}

export const logger = new Logger();
