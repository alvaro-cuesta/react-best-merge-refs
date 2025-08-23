import type { Mock } from 'vitest';

type RefCallbackSpy<T> = {
  name?: string | undefined;
  ref: Mock<(value: T | null) => void>;
};

export function makeRefCallbackSpy<T>(name?: string): RefCallbackSpy<T> {
  return {
    name,
    ref: vi.fn(),
  };
}
