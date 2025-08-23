import type { RefObject } from 'react';

type RefObjectSpy<T> = {
  ref: RefObject<T | null>;
  history: (T | null)[];
};

export function makeRefObjectSpy<T>(initialValue: T | null): RefObjectSpy<T> {
  const history = [initialValue];

  const ref = new Proxy(
    { current: initialValue },
    {
      set(target, p, newValue: T | null, receiver) {
        if (p === 'current') {
          target.current = newValue;
          history.push(newValue);
        }

        return Reflect.set(target, p, newValue, receiver);
      },
    },
  );

  return {
    ref,
    history,
  };
}
