# react-best-merge-refs 🔗

<p align="center">
  <a href="./LICENSE">
    <img src="https://img.shields.io/github/license/alvaro-cuesta/react-best-merge-refs" alt="License (MIT)" /></a>
  <a href="https://www.npmjs.com/package/react-best-merge-refs">
    <img src="https://img.shields.io/npm/v/react-best-merge-refs/latest.svg" alt="npm package" /></a>
  <a href="https://bundlephobia.com/package/react-best-merge-refs">
    <img src="https://img.shields.io/bundlephobia/minzip/react-best-merge-refs" alt="npm bundle size" /></a>
  <a href="https://github.com/alvaro-cuesta/react-best-merge-refs/actions/workflows/ci.yml">
    <img src="https://github.com/alvaro-cuesta/react-best-merge-refs/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
  <a href="https://github.com/alvaro-cuesta/react-best-merge-refs/issues">
    <img src="https://img.shields.io/github/issues/alvaro-cuesta/react-best-merge-refs" alt="Issues" /></a>
  <a href="https://github.com/alvaro-cuesta/react-best-merge-refs/fork">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" /></a>
</p>

React utility to merge multiple refs into a single one.

Fully correct behavior, matching React 19. See ["Why would I need this?"](#why-would-i-need-this) for an explanation,
and ["Why not other ref merging libraries?"](#why-not-other-ref-merging-libraries) for additional details on what other
ref merging libraries get wrong.

```console
$ npm install react-best-merge-refs
```

## Example

```tsx
import type { Ref } from 'react';
import { useMergeRefs } from 'react-best-merge-refs';

function AutoFocusedInput({ ref }: { ref?: Ref<HTMLInputElement> }) {
  // Wrap our ref function in `useCallback` to make it stable across renders.
  const autoFocusRef = useCallback((input: HTMLInputElement | null) => {
    input?.focus();
  }, []);

  return (
    <input
      // Even if `ref` might be unstable (since we don't control the consumer of this component),
      // our `autoFocusRef` is guaranteed to only be called once per mount, no spurious calls on
      // re-render.
      ref={useMergeRefs({ ref, autoFocusRef })}
    />
  );
}
```

## FAQ

### Why would I need this?

Low-level UI components often need to use their own refs, while also fowarding external ones, like this:

```tsx
import type { Ref } from 'react';

function MyInput({ ref }: { ref?: Ref<HTMLInputElement> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  /* ... do stuff with `inputRef` ... */

  // How can we pass both `inputRef` and the external `ref` here?
  return <input ref={/* ... */} />;
}
```

React does not offer a way to set two refs inside the `ref` property (see facebook/react#29757). This small utility
allow you to combine multiple refs into a single ref that you can pass around like this:

```tsx
import type { Ref } from 'react';
import { useMergeRefs } from 'react-best-merge-refs';

function MyInput({ ref }: { ref?: Ref<HTMLInputElement> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  /* ... do stuff with `inputRef` ... */

  return <input ref={useMergeRefs({ ref, inputRef })} />;
}
```

The advantage of using this library is that we will keep compatibility with React semantics for you.

### Why not other ref merging libraries?

[React 19 introduced cleanup functions for refs](https://react.dev/blog/2024/12/05/react-19#cleanup-functions-for-refs)
and this library has full support for them, completely providing the same guarantees that React provides for you,
exactly as if you were using individual refs.

React refs are subtle and merging is easy to implement wrong. The fantastic
[react-merge-refs](https://github.com/gregberge/react-merge-refs/) library is a great implementation, but has a
[subtle issue with unstable refs](https://github.com/gregberge/react-merge-refs/issues/42) that (1) completely breaks
React's contract for refs and, worst of it, (2) cannot be fixed without patching the broken library (your refs are
subtly broken as long as anyone merges them with unstable refs).

See ["Example"](#example) for a very common use case that is broken in other libraries. This pattern is so common across
the whole React ecosystem, I'm pretty sure most merged refs are subtly broken everywhere!

### Why an object for refs instead of a simple array?

Other merging libraries allow you to pass the refs as an array (or multiple arguments), but this can lead to subtle bugs
under some circumstances since the refs are implicitly ordered.

Similar to [React's key prop](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key) we need to
track individual refs over time (regardless of their order) to abide to React's ref semantics. For example, if we
allowed an array and someone compiled a list of refs like this:

```tsx
function BuggyComponent({
  ref,
  onDomReady,
  onDomReadyEnabled,
}: {
  ref?: Ref<HTMLInputElement>;
  onDomReadyCallbacks: (() => {})[];
}) {
  return <input ref={useMergeRefs([...onDomReadyCallbacks, ref])} />;
}
```

...if a callback is added or removed in `onDomReadyCallbacks`, refs will be considered as having changed, including
calling `ref` unexpectedly and breaking React's guarantees for anyone using your component.

Since merging refs [can break the contract](#why-not-other-ref-merging-libraries) even for refs that are external to
your code, it is very important to keep the API foolproof and prevent doing the wrong thing. You probably have some sort
of stable id (like the one you'd use for a `key` prop) and if you don't you can always resort to using indices as keys
as a last resort (again, like React's `key` prop).

By forcing all refs to be keyed (and thus explicitly unordered) we can safely track additions and removals without
breaking external refs by mistake.

# License (MIT)

Copyright 2025 [Álvaro Cuesta](https://alvaro.cuesta.dev) ([alvaro-cuesta@GitHub](https://github.com/alvaro-cuesta/))

Licensed under the [MIT license](./LICENSE).
