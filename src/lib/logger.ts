/**
 * Mosaic — Structured Logger
 * 
 * Logs to console in development. Ready for integration with a hosted
 * logging service (e.g., Datadog, Logtail, Sentry) in production.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const isDev = import.meta.env.DEV;

function createEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };
}

function output(entry: LogEntry) {
  if (isDev) {
    const method = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log';
    console[method](`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context || '');
  } else {
    // Production: structured JSON for log aggregation
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    if (isDev) output(createEntry('debug', message, context));
  },
  info: (message: string, context?: Record<string, unknown>) => {
    output(createEntry('info', message, context));
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    output(createEntry('warn', message, context));
  },
  error: (message: string, context?: Record<string, unknown>) => {
    output(createEntry('error', message, context));
  },
};
