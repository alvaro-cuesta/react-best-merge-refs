/* eslint-disable @typescript-eslint/no-non-null-assertion
  --- we often deals with keys we know exist, so ! is often fine in this file */
/* eslint-disable @typescript-eslint/no-dynamic-delete
  --- needed for interior mutability */

import { useRef, type RefCallback } from 'react';
import type { NonNullRef } from './react-ref.js';
import {
  assignToStoredRef,
  cleanupStoredRef,
  makeStoredRef,
  type StoredRef,
} from './stored-ref.js';
import type { Maybe } from './utils.js';

/**
 * A collection of React refs (or `null`/`undefined`, for convenience) associated with a unique key.
 *
 * Each ref's key is similar to React's `key` prop, where it is used a guarantee of stability.
 */
export type RefCollection<T> = Record<string, NonNullRef<T> | null | undefined>;

/**
 * A collection of {@link StoredRef} associated with a unique key.
 *
 * Each ref's key is similar to React's `key` prop, where it is used a guarantee of stability.
 */
type StoredRefs<T> = Record<string, StoredRef<T>>;

/**
 * @param storedRefs The current keyed collection of {@link StoredRefs}.
 * @param refs The keyed collection of React refs to reconciliate into {@link storedRefs}.
 * @param maybeValue The latest value (if any) to initialize the refs with.
 *
 * **WARNING:** This function mutates {@link storedRefs} for performance reasons.
 */
function reconciliateRefs<T>(
  storedRefs: StoredRefs<T>,
  refs: RefCollection<T>,
  maybeValue: Maybe<T>,
) {
  const storedKeys = Object.keys(storedRefs);
  // We consider null/undefined values the same as a non-existent key
  const keys = Object.entries(refs)
    // Intentional != for null-ish
    .filter(([_, v]) => v != null)
    .map(([k]) => k);

  const storedKeysSet = new Set(storedKeys);
  const keysSet = new Set(keys);

  // Handle keys that no longer exist in new collection -- cleanup and remove
  for (const removedKey of storedKeys.filter((k) => !keysSet.has(k))) {
    const storedRef = storedRefs[removedKey]!;
    cleanupStoredRef(storedRef);
    delete storedRefs[removedKey];
  }

  // Handle keys that are in both stored and new collections
  for (const existingKey of keys.filter((k) => storedKeysSet.has(k))) {
    const storedRef = storedRefs[existingKey]!;
    const ref = refs[existingKey]!;

    // The ref is stable -- do nothing
    if (storedRef.ref === ref) continue;

    // Same key but not same ref -- cleanup old and store the new one
    cleanupStoredRef(storedRef);
    storedRefs[existingKey] = makeStoredRef(ref, maybeValue);
  }

  // Handle keys that are only in new collection
  for (const addedKey of keys.filter((k) => !storedKeysSet.has(k))) {
    const ref = refs[addedKey]!;
    storedRefs[addedKey] = makeStoredRef(ref, maybeValue);
  }
}

/**
 * Merge a collection of refs into a single ref to be passed to a React `ref` prop.
 *
 * All refs will see updates as if they were the only ref passed to the `ref` prop, completely matching the original
 * React behavior. I.e.:
 *
 * - Once the DOM node is available each ref will be updated accordingly.
 * - Once the DOM node is removed each ref will be cleaned up.
 * - If a new ref is added and the component already had a DOM node, it will be initialized accordingly. Other
 *   already-existing refs will not be updated.
 * - If a ref is removed it will be cleaned up. Other already-existing refs will not be cleaned up.
 *
 * **WARNING:** This will also match
 * [React's behavior on unstable refs](https://react.dev/reference/react-dom/components/common#caveats) (e.g. functions
 * that are created in every render, with no memoization or `useCallback` to keep their reference stable), which will
 * trigger a cleanup (on the old ref) and a new initialization (on the new ref) on every re-render, regardless of
 * changes on the underlying DOM node.
 *
 * This hooks ensures complete safety by making sure that ref instability is not viral. If any of the {@link refs} is
 * unstable (e.g. if you are accepting a `ref` prop and are not sure if they consumer will keep their reference stable),
 * the rest of the refs will be provided the same guarantees that React provides in their documentation.
 *
 * @param refs Collection of refs to merge.
 * @returns The merged ref. Can be passed to a React `ref` prop.
 * @example
 * function AutoFocusedInput({ ref }) {
 *   // Wrap our ref function in `useCallback` to make it stable across renders.
 *   const autoFocusRef = useCallback((input) => input?.focus(), []);
 *
 *   return (
 *     <input
 *       // Even if `ref` might be unstable (since we don't control the consumer of this component),
 *       // our `autoFocusRef` is guaranteed to only be called once per mount, no spurious calls on
 *       // re-render.
 *       ref={useMergeRefs({ ref, autoFocusRef })}
 *     />
 *   );
 * }
 * @see https://react.dev/reference/react-dom/components/common#ref-callback
 * @see https://react.dev/reference/react-dom/components/common#manipulating-a-dom-node-with-a-ref
 * @see https://react.dev/learn/manipulating-the-dom-with-refs
 * @see https://react.dev/learn/referencing-values-with-refs
 * @see https://react.dev/reference/react/useRef
 * @see https://react.dev/reference/react/createRef
 */
export function useMergeRefs<T>(refs: RefCollection<T>): RefCallback<T> {
  const storedRefsRef = useRef<StoredRefs<T>>({});
  const storedMaybeValueRef = useRef<Maybe<T>>({ hasValue: false });

  reconciliateRefs(storedRefsRef.current, refs, storedMaybeValueRef.current);

  // This function will be always stable, ensuring React only calls us on actual element changes
  const callbackRef = useRef<RefCallback<T>>(null);
  callbackRef.current ??= (value: T) => {
    storedMaybeValueRef.current = { hasValue: true, value };

    for (const storedRef of Object.values(storedRefsRef.current)) {
      assignToStoredRef(storedRef, value);
    }

    return () => {
      storedMaybeValueRef.current = { hasValue: false };

      // We don't check if storedMaybeValueRef has a value because, this being a cleanup, we assume it does
      for (const storedRef of Object.values(storedRefsRef.current)) {
        cleanupStoredRef(storedRef);
      }
    };
  };

  return callbackRef.current;
}
