import type { Ref } from 'react';

/**
 * A cleanup function returned from a RefCallback.
 */
export type CleanupFn = () => void;

/**
 * A React {@link Ref} with `null` removed.
 */
export type NonNullRef<T> = Exclude<Ref<T>, null>;

/**
 * @param ref {@link NonNullRef} to assign to.
 * @param value Value to assign to the ref.
 * @returns An appropriate cleanup function for the ref.
 */
export function assignToRef<T>(ref: NonNullRef<T>, value: T): CleanupFn {
  if (typeof ref === 'function') {
    const cleanup = ref(value);
    return typeof cleanup === 'function' ? cleanup : () => ref(null);
  } else {
    ref.current = value;
    return () => {
      ref.current = null;
    };
  }
}
