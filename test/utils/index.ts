import type { Mock } from 'vitest';

export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

export function isMock(
  value: unknown,
): value is Mock<(...args: unknown[]) => unknown> {
  // @todo This is actually only a partial check...
  return (
    typeof value === 'function' &&
    'mock' in value &&
    isObject(value.mock) &&
    'calls' in value.mock &&
    Array.isArray(value.mock.calls)
  );
}
