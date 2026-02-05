/**
 * Simple logger with optional correlation id for ingestion and sync.
 */

let correlationId: string | null = null;

export function setCorrelationId(id: string): void {
  correlationId = id;
}

export function getCorrelationId(): string | null {
  return correlationId;
}

export function clearCorrelationId(): void {
  correlationId = null;
}

function prefix(): string {
  const c = correlationId ? `[${correlationId}] ` : '';
  return `${c}[jobs-ingestion]`;
}

export const logger = {
  info(msg: string, data?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.log(prefix(), msg, data ?? '');
  },
  warn(msg: string, data?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.warn(prefix(), msg, data ?? '');
  },
  error(msg: string, err?: unknown, data?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.error(prefix(), msg, err, data ?? '');
  },
};
