import type { RefCallback } from 'react';
import type { Mock } from 'vitest';
import { isMock, isObject } from './index.js';

type RefCallbackWithCleanupSpy<T> = {
  name?: string | undefined;
  setup: Mock<(value: T) => void>;
  cleanup: Mock<() => void>;
};

function isRefCallbackWithCleanupSpy<T>(
  value: unknown,
): value is RefCallbackWithCleanupSpy<T> {
  return (
    isObject(value) &&
    'setup' in value &&
    isMock(value.setup) &&
    'cleanup' in value &&
    isMock(value.cleanup) &&
    (!('name' in value) ||
      value.name === undefined ||
      typeof value.name === 'string')
  );
}

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

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-unused-vars
  interface Assertion<T> {
    toHaveRefCallbackWithCleanupTimes(
      setupTimes: number,
      cleanupTimes: number,
    ): void;
  }
}

expect.extend({
  toHaveRefCallbackWithCleanupTimes: (
    received: unknown,
    setupTimes: number,
    cleanupTimes: number,
  ) => {
    // We need to actually check this because `Assertion` is not types WRT `expect` so this could be anything
    if (!isRefCallbackWithCleanupSpy(received)) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new TypeError(`${received} is not a RefCallbackWithCleanupSpy`);
    }

    const actual = {
      setup: received.setup.mock.calls.length,
      cleanup: received.cleanup.mock.calls.length,
    };

    const expected = {
      setup: setupTimes,
      cleanup: cleanupTimes,
    };

    const name = received.name ?? 'spy';

    if (
      expected.setup !== actual.setup ||
      expected.cleanup !== actual.cleanup
    ) {
      return {
        message: () =>
          `expected "${name}" to be set up ${expected.setup} times and cleaned up ${expected.cleanup} times, but got set up ${actual.setup} times and cleaned up ${actual.cleanup} times`,
        pass: false,
        actual,
        expected,
      };
    }

    return {
      message: () =>
        `correctly expected "${name}" to be set up ${expected.setup} times and cleaned up ${expected.cleanup} times`,
      pass: true,
      actual,
      expected,
    };
  },
});
