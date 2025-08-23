import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useCallback, type Ref } from 'react';
import { useMergeRefs } from '../src/index.js';

test('ConsumerBuggyInputBuggy', async () => {
  function AutoFocusedInputBuggy({ ref }: { ref: Ref<HTMLInputElement> }) {
    return (
      <input
        data-testid="input"
        ref={useMergeRefs({
          ref,
          // This is buggy and will be called in every render since we're recreating the function on every render.
          autoFocusRef: (input: HTMLInputElement | null) => {
            input?.focus();
          },
        })}
      />
    );
  }

  function ConsumerBuggyInputBuggy({
    spy,
  }: {
    spy: (input: HTMLInputElement | null) => void;
  }) {
    return (
      <>
        <AutoFocusedInputBuggy
          ref={(input) => {
            spy(input);
          }}
        />

        <textarea data-testid="textarea" />
      </>
    );
  }

  const user = userEvent.setup();

  const spy1 = vi.fn();

  const r = render(<ConsumerBuggyInputBuggy spy={spy1} />);
  expect(spy1).toBeCalledTimes(1);
  expect(r.getByTestId('input')).toHaveFocus();

  await user.click(r.getByTestId('textarea'));
  expect(r.getByTestId('textarea')).toHaveFocus();

  const spy2 = vi.fn();
  r.rerender(<ConsumerBuggyInputBuggy spy={spy2} />);
  expect(spy1).toBeCalledTimes(2);
  expect(spy2).toBeCalledTimes(1);
  expect(r.getByTestId('input')).toHaveFocus(); // <- this is the buggy behavior, compare with ConsumerBuggyInputSafe
});

test('ConsumerBuggyInputSafe', async () => {
  function AutoFocusedInputSafe({ ref }: { ref: Ref<HTMLInputElement> }) {
    // Wrap our ref function in `useCallback` to make it stable across renders.
    const autoFocusRef = useCallback((input: HTMLInputElement | null) => {
      input?.focus();
    }, []);

    return (
      <input
        data-testid="input"
        // Even if `ref` might be unstable (since we don't control the consumer of this component),
        // our `autoFocusRef` is guaranteed to only be called once per mount, no spurious calls on
        // re-render.
        ref={useMergeRefs({ ref, autoFocusRef })}
      />
    );
  }

  function ConsumerBuggyInputSafe({
    spy,
  }: {
    spy: (input: HTMLInputElement | null) => void;
  }) {
    return (
      <>
        <AutoFocusedInputSafe
          ref={(input) => {
            spy(input);
          }}
        />

        <textarea data-testid="textarea" />
      </>
    );
  }

  const user = userEvent.setup();

  const spy1 = vi.fn();
  const r = render(<ConsumerBuggyInputSafe spy={spy1} />);
  expect(spy1).toBeCalledTimes(1);
  expect(r.getByTestId('input')).toHaveFocus();

  await user.click(r.getByTestId('textarea'));
  expect(r.getByTestId('textarea')).toHaveFocus();

  const spy2 = vi.fn();
  r.rerender(<ConsumerBuggyInputSafe spy={spy2} />);
  expect(spy1).toBeCalledTimes(2);
  expect(spy2).toBeCalledTimes(1);
  expect(r.getByTestId('textarea')).toHaveFocus(); // <- this is the correct behavior, compare with ConsumerBuggyInputBuggy
});
