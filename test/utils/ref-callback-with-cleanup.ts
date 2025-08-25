import type { RefCallback } from 'react';
import type { Mock } from 'vitest';

type RefCallbackWithCleanupSpy<T> = {
  name?: string | undefined;
  setup: Mock<(value: T) => void>;
  cleanup: Mock<() => void>;
};

export function makeRefCallbackWithCleanupSpy<T>(
  name?: string,
): RefCallbackWithCleanupSpy<T> {
  return {
    name,
    setup: vi.fn(),
    cleanup: vi.fn(),
  };
}

export function makeSpiedRefCallbackWithCleanup<T>(
  spies: RefCallbackWithCleanupSpy<T>,
): RefCallback<T> {
  return (value: T) => {
    spies.setup(value);
    return spies.cleanup;
  };
}
