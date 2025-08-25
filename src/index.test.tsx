import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import type { RefCallback, RefObject } from 'react';
import {
  makeRefCallbackWithCleanupSpy,
  makeSpiedRefCallbackWithCleanup,
} from '../test/utils/ref-callback-with-cleanup.js';
import { makeRefObjectSpy } from '../test/utils/ref-object.js';
import { useMergeRefs, type RefCollection } from './index.js';

function TestRefCallback({ ref }: { ref: RefCallback<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      data-testid="ref-div"
    />
  );
}

function TestRefObject({ ref }: { ref: RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={ref}
      data-testid="ref-div"
    />
  );
}

function TestRefCollection({ refs }: { refs: RefCollection<HTMLDivElement> }) {
  return (
    <div
      ref={useMergeRefs(refs)}
      data-testid="ref-div"
    />
  );
}

function TestSpuriousCleanups<T extends HTMLDivElement>({
  refs,
  show,
}: {
  refs: RefCollection<T>;
  show?: boolean;
}) {
  const mergedRefs = useMergeRefs(refs);
  return (
    <div data-testid="wrapper-div">
      {show ? (
        <div
          ref={mergedRefs}
          data-testid="ref-div"
        />
      ) : null}
    </div>
  );
}

describe('Callback refs (no cleanup)', () => {
  describe('React (baseline)', () => {
    describe('Stable', () => {
      test('Is not called on re-renders', () => {
        const ref = vi.fn();

        const r = render(<TestRefCallback ref={ref} />);
        const r1div = r.getByTestId('ref-div');
        expect(ref.mock.calls).toEqual([[r1div]]);

        r.rerender(<TestRefCallback ref={ref} />);
        expect(ref.mock.calls).toEqual([[r1div]]);

        r.rerender(<div />);
        expect(ref.mock.calls).toEqual([
          [r1div],
          [
            null,
            // @todo WTF? Why all the `undefined`s here?
            undefined,
            undefined,
            undefined,
            undefined,
          ],
        ]);
      });
    });

    describe('Unstable', () => {
      test('Is called on every re-render', () => {
        const ref = vi.fn();

        const r = render(
          <TestRefCallback
            ref={(v) => {
              ref(v);
            }}
          />,
        );
        const r1div = r.getByTestId('ref-div');
        expect(ref.mock.calls).toEqual([[r1div]]);

        r.rerender(
          <TestRefCallback
            ref={(v) => {
              ref(v);
            }}
          />,
        );
        const r2div = r.getByTestId('ref-div');
        expect(ref.mock.calls).toEqual([[r1div], [null], [r2div]]);

        r.rerender(<div />);
        expect(ref.mock.calls).toEqual([[r1div], [null], [r2div], [null]]);
      });
    });
  });

  describe('useMergeRefs', () => {
    test('Single ref', () => {
      const ref = vi.fn();

      const r = render(<TestRefCollection refs={{ ref }} />);
      const r1div = r.getByTestId('ref-div');
      expect(ref.mock.calls).toEqual([[r1div]]);

      r.rerender(<TestRefCollection refs={{ ref }} />);
      expect(ref.mock.calls).toEqual([[r1div]]);

      r.rerender(<div />);
      expect(ref.mock.calls).toEqual([[r1div], [null]]);
    });

    describe('All stable', () => {
      test('None are called on re-render', () => {
        const ref1 = vi.fn();
        const ref2 = vi.fn();

        const r = render(<TestRefCollection refs={{ ref1, ref2 }} />);
        const r1div = r.getByTestId('ref-div');
        expect(ref1.mock.calls).toEqual([[r1div]]);
        expect(ref2.mock.calls).toEqual([[r1div]]);

        r.rerender(<TestRefCollection refs={{ ref1, ref2 }} />);
        expect(ref1.mock.calls).toEqual([[r1div]]);
        expect(ref2.mock.calls).toEqual([[r1div]]);

        r.rerender(<div />);
        expect(ref1.mock.calls).toEqual([[r1div], [null]]);
        expect(ref2.mock.calls).toEqual([[r1div], [null]]);
      });
    });

    describe('Add a new ref', () => {
      test.each([
        ['Undefined', { ref3: undefined }],
        ['Null', { ref3: null }],
        ['Optional property', {}],
      ])(
        '(%s) Only the added key is called on re-renders',
        (_, ref3Wrapper) => {
          const ref1 = vi.fn();
          const ref2 = vi.fn();
          const ref3 = vi.fn();

          const r = render(
            <TestRefCollection refs={{ ref1, ref2, ...ref3Wrapper }} />,
          );
          const r1div = r.getByTestId('ref-div');
          expect(ref1.mock.calls).toEqual([[r1div]]);
          expect(ref2.mock.calls).toEqual([[r1div]]);
          expect(ref3.mock.calls).toEqual([]);

          r.rerender(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
          expect(ref1.mock.calls).toEqual([[r1div]]);
          expect(ref2.mock.calls).toEqual([[r1div]]);
          expect(ref3.mock.calls).toEqual([[r1div]]);

          r.rerender(<div />);
          expect(ref1.mock.calls).toEqual([[r1div], [null]]);
          expect(ref2.mock.calls).toEqual([[r1div], [null]]);
          expect(ref3.mock.calls).toEqual([[r1div], [null]]);
        },
      );
    });

    describe('Remove a ref', () => {
      test.each([
        ['Undefined', { ref3: undefined }],
        ['Null', { ref3: null }],
        ['Optional property', {}],
      ])('(%s) Only the removed key is cleaned up', (_, ref3Wrapper) => {
        const ref1 = vi.fn();
        const ref2 = vi.fn();
        const ref3 = vi.fn();

        const r = render(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
        const r1div = r.getByTestId('ref-div');
        expect(ref1.mock.calls).toEqual([[r1div]]);
        expect(ref2.mock.calls).toEqual([[r1div]]);
        expect(ref3.mock.calls).toEqual([[r1div]]);

        r.rerender(<TestRefCollection refs={{ ref1, ref2, ...ref3Wrapper }} />);
        expect(ref1.mock.calls).toEqual([[r1div]]);
        expect(ref2.mock.calls).toEqual([[r1div]]);
        expect(ref3.mock.calls).toEqual([[r1div], [null]]);

        r.rerender(<div />);
        expect(ref1.mock.calls).toEqual([[r1div], [null]]);
        expect(ref2.mock.calls).toEqual([[r1div], [null]]);
        expect(ref3.mock.calls).toEqual([[r1div], [null]]);
      });
    });

    describe('External unstable', () => {
      test('Only the unstable ref is called on every render', () => {
        const ref1 = vi.fn();
        const ref2 = vi.fn();
        const ref3 = vi.fn();

        const r = render(
          <TestRefCollection
            refs={{
              ref1,
              ref2,
              ref3: (v) => {
                ref3(v);
              },
            }}
          />,
        );
        const r1div = r.getByTestId('ref-div');
        expect(ref1.mock.calls).toEqual([[r1div]]);
        expect(ref2.mock.calls).toEqual([[r1div]]);
        expect(ref3.mock.calls).toEqual([[r1div]]);

        r.rerender(
          <TestRefCollection
            refs={{
              ref1,
              ref2,
              ref3: (v) => {
                ref3(v);
              },
            }}
          />,
        );
        expect(ref1.mock.calls).toEqual([[r1div]]);
        expect(ref2.mock.calls).toEqual([[r1div]]);
        expect(ref3.mock.calls).toEqual([[r1div], [null], [r1div]]);

        r.rerender(<div />);
        expect(ref1.mock.calls).toEqual([[r1div], [null]]);
        expect(ref2.mock.calls).toEqual([[r1div], [null]]);
        expect(ref3.mock.calls).toEqual([[r1div], [null], [r1div], [null]]);
      });
    });

    test('No spurious calls', () => {
      const ref = vi.fn();

      const r = render(<TestSpuriousCleanups refs={{}} />);
      expect(ref.mock.calls).toEqual([]);

      // Here we set a ref (and thus `useMergeRefs` stores it) but never `show` so it never gets assigned a value
      // If our code is bugged it might assign a value here, or set it to `null` or something...
      r.rerender(<TestSpuriousCleanups refs={{ ref }} />);
      expect(ref.mock.calls).toEqual([]);

      // same here, it might try to do a spurious cleanup even though the ref was actually never assigned
      r.rerender(<TestSpuriousCleanups refs={{}} />);
      expect(ref.mock.calls).toEqual([]);
    });
  });
});

describe('Callback refs (with cleanup)', () => {
  describe('React (baseline)', () => {
    describe('Stable', () => {
      test('Is not called on re-renders', () => {
        const spies = makeRefCallbackWithCleanupSpy();
        const ref = makeSpiedRefCallbackWithCleanup(spies);

        const r = render(<TestRefCallback ref={ref} />);
        const r1div = r.getByTestId('ref-div');
        expect(spies.setup.mock.calls).toEqual([[r1div]]);
        expect(spies.cleanup.mock.calls).toEqual([]);

        r.rerender(<TestRefCallback ref={ref} />);
        expect(spies.setup.mock.calls).toEqual([[r1div]]);
        expect(spies.cleanup.mock.calls).toEqual([]);

        r.rerender(<div />);
        expect(spies.setup.mock.calls).toEqual([[r1div]]);
        expect(spies.cleanup.mock.calls).toEqual([
          [
            // @todo WTF? Why all the `undefined`s here?
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
          ],
        ]);
      });
    });

    describe('Unstable', () => {
      test('Is called on every re-render', () => {
        const spies = makeRefCallbackWithCleanupSpy();

        const r = render(
          <TestRefCallback ref={makeSpiedRefCallbackWithCleanup(spies)} />,
        );
        const r1div = r.getByTestId('ref-div');
        expect(spies.setup.mock.calls).toEqual([[r1div]]);
        expect(spies.cleanup.mock.calls).toEqual([]);

        r.rerender(
          <TestRefCallback ref={makeSpiedRefCallbackWithCleanup(spies)} />,
        );
        expect(spies.setup.mock.calls).toEqual([[r1div], [r1div]]);
        expect(spies.cleanup.mock.calls).toEqual([
          [
            // @todo WTF? Why all the `undefined`s here?
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
          ],
        ]);

        r.rerender(<div />);
        expect(spies.setup.mock.calls).toEqual([[r1div], [r1div]]);
        expect(spies.cleanup.mock.calls).toEqual([
          [
            // @todo WTF? Why all the `undefined`s here?
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
          ],
          [
            // @todo WTF? Why all the `undefined`s here?
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
          ],
        ]);
      });
    });
  });

  describe('useMergeRefs', () => {
    test('Single ref', () => {
      const spies = makeRefCallbackWithCleanupSpy();
      const ref = makeSpiedRefCallbackWithCleanup(spies);

      const r = render(<TestRefCollection refs={{ ref }} />);
      const r1div = r.getByTestId('ref-div');
      expect(spies.setup.mock.calls).toEqual([[r1div]]);
      expect(spies.cleanup.mock.calls).toEqual([]);

      r.rerender(<TestRefCollection refs={{ ref }} />);
      expect(spies.setup.mock.calls).toEqual([[r1div]]);
      expect(spies.cleanup.mock.calls).toEqual([]);

      r.rerender(<div />);
      expect(spies.setup.mock.calls).toEqual([[r1div]]);
      expect(spies.cleanup.mock.calls).toEqual([[]]);
    });

    describe('All stable', () => {
      test('None are called on re-render', () => {
        const spies1 = makeRefCallbackWithCleanupSpy();
        const ref1 = makeSpiedRefCallbackWithCleanup(spies1);
        const spies2 = makeRefCallbackWithCleanupSpy();
        const ref2 = makeSpiedRefCallbackWithCleanup(spies2);

        const r = render(<TestRefCollection refs={{ ref1, ref2 }} />);
        const r1div = r.getByTestId('ref-div');
        expect(spies1.setup.mock.calls).toEqual([[r1div]]);
        expect(spies1.cleanup.mock.calls).toEqual([]);
        expect(spies2.setup.mock.calls).toEqual([[r1div]]);
        expect(spies2.cleanup.mock.calls).toEqual([]);

        r.rerender(<TestRefCollection refs={{ ref1, ref2 }} />);
        expect(spies1.setup.mock.calls).toEqual([[r1div]]);
        expect(spies1.cleanup.mock.calls).toEqual([]);
        expect(spies2.setup.mock.calls).toEqual([[r1div]]);
        expect(spies2.cleanup.mock.calls).toEqual([]);

        r.rerender(<div />);
        expect(spies1.setup.mock.calls).toEqual([[r1div]]);
        expect(spies1.cleanup.mock.calls).toEqual([[]]);
        expect(spies2.setup.mock.calls).toEqual([[r1div]]);
        expect(spies2.cleanup.mock.calls).toEqual([[]]);
      });
    });

    describe('Add a new ref', () => {
      test.each([
        ['Undefined', { ref3: undefined }],
        ['Null', { ref3: null }],
        ['Optional property', {}],
      ])(
        '(%s) Only the added key is called on re-renders',
        (_, ref3Wrapper) => {
          const spies1 = makeRefCallbackWithCleanupSpy();
          const ref1 = makeSpiedRefCallbackWithCleanup(spies1);
          const spies2 = makeRefCallbackWithCleanupSpy();
          const ref2 = makeSpiedRefCallbackWithCleanup(spies2);
          const spies3 = makeRefCallbackWithCleanupSpy();
          const ref3 = makeSpiedRefCallbackWithCleanup(spies3);

          const r = render(
            <TestRefCollection refs={{ ref1, ref2, ...ref3Wrapper }} />,
          );
          const r1div = r.getByTestId('ref-div');
          expect(spies1.setup.mock.calls).toEqual([[r1div]]);
          expect(spies1.cleanup.mock.calls).toEqual([]);
          expect(spies2.setup.mock.calls).toEqual([[r1div]]);
          expect(spies2.cleanup.mock.calls).toEqual([]);
          expect(spies3.setup.mock.calls).toEqual([]);
          expect(spies3.cleanup.mock.calls).toEqual([]);

          r.rerender(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
          expect(spies1.setup.mock.calls).toEqual([[r1div]]);
          expect(spies1.cleanup.mock.calls).toEqual([]);
          expect(spies2.setup.mock.calls).toEqual([[r1div]]);
          expect(spies2.cleanup.mock.calls).toEqual([]);
          expect(spies3.setup.mock.calls).toEqual([[r1div]]);
          expect(spies3.cleanup.mock.calls).toEqual([]);

          r.rerender(<div />);
          expect(spies1.setup.mock.calls).toEqual([[r1div]]);
          expect(spies1.cleanup.mock.calls).toEqual([[]]);
          expect(spies2.setup.mock.calls).toEqual([[r1div]]);
          expect(spies2.cleanup.mock.calls).toEqual([[]]);
          expect(spies3.setup.mock.calls).toEqual([[r1div]]);
          expect(spies3.cleanup.mock.calls).toEqual([[]]);
        },
      );
    });

    describe('Remove a ref', () => {
      test.each([
        ['Undefined', { ref3: undefined }],
        ['Null', { ref3: null }],
        ['Optional property', {}],
      ])('(%s) Only the removed key is cleaned up', (_, ref3Wrapper) => {
        const spies1 = makeRefCallbackWithCleanupSpy();
        const ref1 = makeSpiedRefCallbackWithCleanup(spies1);
        const spies2 = makeRefCallbackWithCleanupSpy();
        const ref2 = makeSpiedRefCallbackWithCleanup(spies2);
        const spies3 = makeRefCallbackWithCleanupSpy();
        const ref3 = makeSpiedRefCallbackWithCleanup(spies3);

        const r = render(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
        const r1div = r.getByTestId('ref-div');
        expect(spies1.setup.mock.calls).toEqual([[r1div]]);
        expect(spies1.cleanup.mock.calls).toEqual([]);
        expect(spies2.setup.mock.calls).toEqual([[r1div]]);
        expect(spies2.cleanup.mock.calls).toEqual([]);
        expect(spies3.setup.mock.calls).toEqual([[r1div]]);
        expect(spies3.cleanup.mock.calls).toEqual([]);

        r.rerender(<TestRefCollection refs={{ ref1, ref2, ...ref3Wrapper }} />);
        expect(spies1.setup.mock.calls).toEqual([[r1div]]);
        expect(spies1.cleanup.mock.calls).toEqual([]);
        expect(spies2.setup.mock.calls).toEqual([[r1div]]);
        expect(spies2.cleanup.mock.calls).toEqual([]);
        expect(spies3.setup.mock.calls).toEqual([[r1div]]);
        expect(spies3.cleanup.mock.calls).toEqual([[]]);

        r.rerender(<div />);
        expect(spies1.setup.mock.calls).toEqual([[r1div]]);
        expect(spies1.cleanup.mock.calls).toEqual([[]]);
        expect(spies2.setup.mock.calls).toEqual([[r1div]]);
        expect(spies2.cleanup.mock.calls).toEqual([[]]);
        expect(spies3.setup.mock.calls).toEqual([[r1div]]);
        expect(spies3.cleanup.mock.calls).toEqual([[]]);
      });
    });

    describe('External unstable', () => {
      test('Only the unstable ref is called on every render', () => {
        const spies1 = makeRefCallbackWithCleanupSpy();
        const ref1 = makeSpiedRefCallbackWithCleanup(spies1);
        const spies2 = makeRefCallbackWithCleanupSpy();
        const ref2 = makeSpiedRefCallbackWithCleanup(spies2);
        const spies3 = makeRefCallbackWithCleanupSpy();

        const r = render(
          <TestRefCollection
            refs={{ ref1, ref2, ref3: makeSpiedRefCallbackWithCleanup(spies3) }}
          />,
        );
        const r1div = r.getByTestId('ref-div');
        expect(spies1.setup.mock.calls).toEqual([[r1div]]);
        expect(spies1.cleanup.mock.calls).toEqual([]);
        expect(spies2.setup.mock.calls).toEqual([[r1div]]);
        expect(spies2.cleanup.mock.calls).toEqual([]);
        expect(spies3.setup.mock.calls).toEqual([[r1div]]);
        expect(spies3.cleanup.mock.calls).toEqual([]);

        r.rerender(
          <TestRefCollection
            refs={{ ref1, ref2, ref3: makeSpiedRefCallbackWithCleanup(spies3) }}
          />,
        );
        expect(spies1.setup.mock.calls).toEqual([[r1div]]);
        expect(spies1.cleanup.mock.calls).toEqual([]);
        expect(spies2.setup.mock.calls).toEqual([[r1div]]);
        expect(spies2.cleanup.mock.calls).toEqual([]);
        expect(spies3.setup.mock.calls).toEqual([[r1div], [r1div]]);
        expect(spies3.cleanup.mock.calls).toEqual([[]]);

        r.rerender(<div />);
        expect(spies1.setup.mock.calls).toEqual([[r1div]]);
        expect(spies1.cleanup.mock.calls).toEqual([[]]);
        expect(spies2.setup.mock.calls).toEqual([[r1div]]);
        expect(spies2.cleanup.mock.calls).toEqual([[]]);
        expect(spies3.setup.mock.calls).toEqual([[r1div], [r1div]]);
        expect(spies3.cleanup.mock.calls).toEqual([[], []]);
      });
    });

    test('No spurious calls', () => {
      const spies = makeRefCallbackWithCleanupSpy();
      const ref = makeSpiedRefCallbackWithCleanup(spies);

      const r = render(<TestSpuriousCleanups refs={{}} />);
      expect(spies.setup.mock.calls).toEqual([]);
      expect(spies.cleanup.mock.calls).toEqual([]);

      // Here we set a ref (and thus `useMergeRefs` stores it) but never `show` so it never gets assigned a value
      // If our code is bugged it might assign a value here, or set it to `null` or something...
      r.rerender(<TestSpuriousCleanups refs={{ ref }} />);
      expect(spies.setup.mock.calls).toEqual([]);
      expect(spies.cleanup.mock.calls).toEqual([]);

      // same here, it might try to do a spurious cleanup even though the ref was actually never assigned
      r.rerender(<TestSpuriousCleanups refs={{}} />);
      expect(spies.setup.mock.calls).toEqual([]);
      expect(spies.cleanup.mock.calls).toEqual([]);
    });
  });
});

describe('Object refs', () => {
  describe('React (baseline)', () => {
    describe('Stable', () => {
      test('Is not updated on re-renders', () => {
        const [ref, history] = makeRefObjectSpy(null);

        const r = render(<TestRefObject ref={ref} />);
        const r1div = r.getByTestId('ref-div');
        expect(history).toEqual([null, r1div]);

        r.rerender(<TestRefObject ref={ref} />);
        expect(history).toEqual([null, r1div]);

        r.rerender(<div />);
        expect(history).toEqual([null, r1div, null]);
      });
    });

    describe('Unstable', () => {
      test('Is updated on every re-render', () => {
        const [ref1, history1] = makeRefObjectSpy(null);
        const [ref2, history2] = makeRefObjectSpy(null);

        const r = render(<TestRefObject ref={ref1} />);
        const r1div = r.getByTestId('ref-div');
        expect(history1).toEqual([null, r1div]);
        expect(history2).toEqual([null]);

        r.rerender(<TestRefObject ref={ref2} />);
        const r2div = r.getByTestId('ref-div');
        expect(history1).toEqual([null, r1div, null]);
        expect(history2).toEqual([null, r2div]);

        r.rerender(<div />);
        expect(history1).toEqual([null, r1div, null]);
        expect(history2).toEqual([null, r2div, null]);
      });
    });
  });

  describe('useMergeRefs', () => {
    test('Single ref', () => {
      const [ref, history] = makeRefObjectSpy(null);

      const r = render(<TestRefCollection refs={{}} />);
      expect(history).toEqual([null]);

      r.rerender(<TestRefCollection refs={{ ref }} />);
      const r1div = r.getByTestId('ref-div');
      expect(history).toEqual([null, r1div]);

      r.rerender(<TestRefCollection refs={{ ref }} />);
      expect(history).toEqual([null, r1div]);

      r.rerender(<TestRefCollection refs={{}} />);
      expect(history).toEqual([null, r1div, null]);
    });

    describe('All stable', () => {
      test('None are called on re-render', () => {
        const [ref1, history1] = makeRefObjectSpy(null);
        const [ref2, history2] = makeRefObjectSpy(null);

        const r = render(<TestRefCollection refs={{}} />);
        expect(history1).toEqual([null]);
        expect(history2).toEqual([null]);

        r.rerender(<TestRefCollection refs={{ ref1, ref2 }} />);
        const r1div = r.getByTestId('ref-div');
        expect(history1).toEqual([null, r1div]);
        expect(history2).toEqual([null, r1div]);

        r.rerender(<TestRefCollection refs={{ ref1, ref2 }} />);
        expect(history1).toEqual([null, r1div]);
        expect(history2).toEqual([null, r1div]);

        r.rerender(<TestRefCollection refs={{}} />);
        expect(history1).toEqual([null, r1div, null]);
        expect(history2).toEqual([null, r1div, null]);
      });
    });

    describe('Add a new ref', () => {
      test.each([
        ['Undefined', { ref3: undefined }],
        ['Null', { ref3: null }],
        ['Optional property', {}],
      ])(
        '(%s) Only the added key is called on re-renders',
        (_, ref3Wrapper) => {
          const [ref1, history1] = makeRefObjectSpy(null);
          const [ref2, history2] = makeRefObjectSpy(null);
          const [ref3, history3] = makeRefObjectSpy(null);

          const r = render(
            <TestRefCollection refs={{ ref1, ref2, ...ref3Wrapper }} />,
          );
          const r1div = r.getByTestId('ref-div');
          expect(history1).toEqual([null, r1div]);
          expect(history2).toEqual([null, r1div]);
          expect(history3).toEqual([null]);

          r.rerender(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
          expect(history1).toEqual([null, r1div]);
          expect(history2).toEqual([null, r1div]);
          expect(history3).toEqual([null, r1div]);

          r.rerender(<div />);
          expect(history1).toEqual([null, r1div, null]);
          expect(history2).toEqual([null, r1div, null]);
          expect(history3).toEqual([null, r1div, null]);
        },
      );
    });

    describe('Remove a ref', () => {
      test.each([
        ['Undefined', { ref3: undefined }],
        ['Null', { ref3: null }],
        ['Optional property', {}],
      ])('(%s) Only the removed key is cleaned up', (_, ref3Wrapper) => {
        const [ref1, history1] = makeRefObjectSpy(null);
        const [ref2, history2] = makeRefObjectSpy(null);
        const [ref3, history3] = makeRefObjectSpy(null);

        const r = render(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
        const r1div = r.getByTestId('ref-div');
        expect(history1).toEqual([null, r1div]);
        expect(history2).toEqual([null, r1div]);
        expect(history3).toEqual([null, r1div]);

        r.rerender(<TestRefCollection refs={{ ref1, ref2, ...ref3Wrapper }} />);
        expect(history1).toEqual([null, r1div]);
        expect(history2).toEqual([null, r1div]);
        expect(history3).toEqual([null, r1div, null]);

        r.rerender(<div />);
        expect(history1).toEqual([null, r1div, null]);
        expect(history2).toEqual([null, r1div, null]);
        expect(history3).toEqual([null, r1div, null]);
      });
    });

    describe('External unstable', () => {
      test('Only the unstable ref is called on every render', () => {
        const [ref1, history1] = makeRefObjectSpy(null);

        const r = render(<TestRefCollection refs={{}} />);
        expect(history1).toEqual([null]);

        const [ref2, history2] = makeRefObjectSpy(null);
        r.rerender(<TestRefCollection refs={{ ref1, refx: ref2 }} />);
        const r1div = r.getByTestId('ref-div');
        expect(history1).toEqual([null, r1div]);
        expect(history2).toEqual([null, r1div]);

        const [ref3, history3] = makeRefObjectSpy(null);
        r.rerender(<TestRefCollection refs={{ ref1, refx: ref3 }} />);
        expect(history1).toEqual([null, r1div]);
        expect(history2).toEqual([null, r1div, null]);
        expect(history3).toEqual([null, r1div]);

        r.rerender(<TestRefCollection refs={{}} />);
        expect(history1).toEqual([null, r1div, null]);
        expect(history2).toEqual([null, r1div, null]);
        expect(history3).toEqual([null, r1div, null]);
      });
    });

    test('No spurious assignments', () => {
      const fakeDiv = document.createElement('div');
      const [ref, history] = makeRefObjectSpy(fakeDiv);

      const r = render(<TestSpuriousCleanups refs={{}} />);
      expect(history).toEqual([fakeDiv]);

      // Here we set a ref (and thus `useMergeRefs` stores it) but never `show` so it never gets assigned a value
      // If our code is bugged it might assign a value here, or set it to `null` or something...
      r.rerender(<TestSpuriousCleanups refs={{ ref }} />);
      expect(history).toEqual([fakeDiv]);

      // same here, it might try to do a spurious cleanup even though the ref was actually never assigned
      r.rerender(<TestSpuriousCleanups refs={{}} />);
      expect(history).toEqual([fakeDiv]);
    });
  });
});
