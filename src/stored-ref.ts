import { assignToRef, type CleanupFn, type NonNullRef } from './react-ref.js';
import type { Maybe } from './utils.js';

/**
 * A {@link NonNullRef} with an associated {@link CleanupFn cleanup function} that has been stored after assigning to
 * it, or `null` if it has not been assigned yet.
 */
export type StoredRef<T> = {
  ref: NonNullRef<T>;
  cleanup: CleanupFn | null;
};

/**
 * @param storedRef Ref to assign the value to.
 * @param value Value to assign to the ref.
 *
 * **WARNING:** This function mutates the ref for performance reasons.
 */
export function assignToStoredRef<T>(storedRef: StoredRef<T>, value: T): void {
  storedRef.cleanup = assignToRef(storedRef.ref, value);
}

/**
 * @param storedRef Ref to cleanup.
 *
 * **WARNING:** This function mutates the ref for performance reasons.
 */
export function cleanupStoredRef<T>(storedRef: StoredRef<T>): void {
  storedRef.cleanup?.();
  storedRef.cleanup = null;
}

/**
 * @see StoredRef
 *
 * @param ref Original React ref to store.
 * @param maybeValue Optional initial value to store on the ref.
 * @returns A {@link StoredRef}.
 */
export function makeStoredRef<T>(
  ref: NonNullRef<T>,
  maybeValue: Maybe<T>,
): StoredRef<T> {
  return {
    ref,
    cleanup: maybeValue.hasValue ? assignToRef(ref, maybeValue.value) : null,
  };
}
