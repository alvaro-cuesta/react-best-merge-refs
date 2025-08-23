/**
 * A type that might or might not contain a value {@link T}.
 *
 * Essentially this is like `T | null` but allows `T` to also be `null` and still be distinct.
 *
 * E.g.: `Maybe<number | null> | null` is distinct from `numer | null | null` which is just `number | null`.
 */
export type Maybe<T> = { hasValue: true; value: T } | { hasValue: false };
