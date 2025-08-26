
export function ensureError(e: unknown): Error {
  if (e instanceof Error) return e;
  try {
    return new Error(typeof e === 'string' ? e : JSON.stringify(e));
  } catch {
    return new Error(String(e));
  }
}

export function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export function serializeError(e: unknown): object {
  if (e instanceof Error) {
    return { message: e.message, stack: e.stack };
  }
  return { value: toErrorMessage(e) };
}
