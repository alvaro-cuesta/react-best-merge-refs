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
      test('(Undefined) Only the added key is called on re-renders', () => {
        const ref1 = vi.fn();
        const ref2 = vi.fn();
        const ref3 = vi.fn();

        const r = render(
          <TestRefCollection refs={{ ref1, ref2, ref3: undefined }} />,
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
      });

      test('(Null) Only the added key is called on re-renders', () => {
        const ref1 = vi.fn();
        const ref2 = vi.fn();
        const ref3 = vi.fn();

        const r = render(
          <TestRefCollection refs={{ ref1, ref2, ref3: null }} />,
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
      });

      test('(Optional property) Only the added key is called on re-renders', () => {
        const ref1 = vi.fn();
        const ref2 = vi.fn();
        const ref3 = vi.fn();

        const r = render(<TestRefCollection refs={{ ref1, ref2 }} />);
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
      });
    });

    describe('Remove a ref', () => {
      test('(Undefined) Only the removed key is cleaned up', () => {
        const ref1 = vi.fn();
        const ref2 = vi.fn();
        const ref3 = vi.fn();

        const r = render(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
        const r1div = r.getByTestId('ref-div');
        expect(ref1.mock.calls).toEqual([[r1div]]);
        expect(ref2.mock.calls).toEqual([[r1div]]);
        expect(ref3.mock.calls).toEqual([[r1div]]);

        r.rerender(
          <TestRefCollection refs={{ ref1, ref2, ref3: undefined }} />,
        );
        expect(ref1.mock.calls).toEqual([[r1div]]);
        expect(ref2.mock.calls).toEqual([[r1div]]);
        expect(ref3.mock.calls).toEqual([[r1div], [null]]);

        r.rerender(<div />);
        expect(ref1.mock.calls).toEqual([[r1div], [null]]);
        expect(ref2.mock.calls).toEqual([[r1div], [null]]);
        expect(ref3.mock.calls).toEqual([[r1div], [null]]);
      });

      test('(Null) Only the removed key is cleaned up', () => {
        const ref1 = vi.fn();
        const ref2 = vi.fn();
        const ref3 = vi.fn();

        const r = render(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
        const r1div = r.getByTestId('ref-div');
        expect(ref1.mock.calls).toEqual([[r1div]]);
        expect(ref2.mock.calls).toEqual([[r1div]]);
        expect(ref3.mock.calls).toEqual([[r1div]]);

        r.rerender(<TestRefCollection refs={{ ref1, ref2, ref3: null }} />);
        expect(ref1.mock.calls).toEqual([[r1div]]);
        expect(ref2.mock.calls).toEqual([[r1div]]);
        expect(ref3.mock.calls).toEqual([[r1div], [null]]);

        r.rerender(<div />);
        expect(ref1.mock.calls).toEqual([[r1div], [null]]);
        expect(ref2.mock.calls).toEqual([[r1div], [null]]);
        expect(ref3.mock.calls).toEqual([[r1div], [null]]);
      });

      test('(Optional property) Only the removed key is cleaned up', () => {
        const ref1 = vi.fn();
        const ref2 = vi.fn();
        const ref3 = vi.fn();

        const r = render(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
        const r1div = r.getByTestId('ref-div');
        expect(ref1.mock.calls).toEqual([[r1div]]);
        expect(ref2.mock.calls).toEqual([[r1div]]);
        expect(ref3.mock.calls).toEqual([[r1div]]);

        r.rerender(<TestRefCollection refs={{ ref1, ref2 }} />);
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
  });
});

describe('Callback refs (with cleanup)', () => {
  describe('React (baseline)', () => {
    describe('Stable', () => {
      test('Is not called on re-renders', () => {
        const spies = makeRefCallbackWithCleanupSpy();
        const ref = makeSpiedRefCallbackWithCleanup(spies);

        const r = render(<TestRefCallback ref={ref} />);
        expect(spies).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(<TestRefCallback ref={ref} />);
        expect(spies).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(<div />);
        expect(spies).toHaveRefCallbackWithCleanupTimes(1, 1);
      });
    });

    describe('Unstable', () => {
      test('Is called on every re-render', () => {
        const spies = makeRefCallbackWithCleanupSpy();

        const r = render(
          <TestRefCallback ref={makeSpiedRefCallbackWithCleanup(spies)} />,
        );
        expect(spies).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(
          <TestRefCallback ref={makeSpiedRefCallbackWithCleanup(spies)} />,
        );
        expect(spies).toHaveRefCallbackWithCleanupTimes(2, 1);

        r.rerender(<div />);
        expect(spies).toHaveRefCallbackWithCleanupTimes(2, 2);
      });
    });
  });

  describe('useMergeRefs', () => {
    test('Single ref', () => {
      const spies = makeRefCallbackWithCleanupSpy();
      const ref = makeSpiedRefCallbackWithCleanup(spies);

      const r = render(<TestRefCollection refs={{ ref }} />);
      expect(spies).toHaveRefCallbackWithCleanupTimes(1, 0);

      r.rerender(<TestRefCollection refs={{ ref }} />);
      expect(spies).toHaveRefCallbackWithCleanupTimes(1, 0);

      r.rerender(<div />);
      expect(spies).toHaveRefCallbackWithCleanupTimes(1, 1);
    });

    describe('All stable', () => {
      test('None are called on re-render', () => {
        const spies1 = makeRefCallbackWithCleanupSpy();
        const ref1 = makeSpiedRefCallbackWithCleanup(spies1);
        const spies2 = makeRefCallbackWithCleanupSpy();
        const ref2 = makeSpiedRefCallbackWithCleanup(spies2);

        const r = render(<TestRefCollection refs={{ ref1, ref2 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(<TestRefCollection refs={{ ref1, ref2 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(<div />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 1);
      });
    });

    describe('Add a new ref', () => {
      test('(Undefined) Only the added key is called on re-renders', () => {
        const spies1 = makeRefCallbackWithCleanupSpy();
        const ref1 = makeSpiedRefCallbackWithCleanup(spies1);
        const spies2 = makeRefCallbackWithCleanupSpy();
        const ref2 = makeSpiedRefCallbackWithCleanup(spies2);
        const spies3 = makeRefCallbackWithCleanupSpy();
        const ref3 = makeSpiedRefCallbackWithCleanup(spies3);

        const r = render(
          <TestRefCollection refs={{ ref1, ref2, ref3: undefined }} />,
        );
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(0, 0);

        r.rerender(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(<div />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 1);
      });

      test('(Null) Only the added key is called on re-renders', () => {
        const spies1 = makeRefCallbackWithCleanupSpy();
        const ref1 = makeSpiedRefCallbackWithCleanup(spies1);
        const spies2 = makeRefCallbackWithCleanupSpy();
        const ref2 = makeSpiedRefCallbackWithCleanup(spies2);
        const spies3 = makeRefCallbackWithCleanupSpy();
        const ref3 = makeSpiedRefCallbackWithCleanup(spies3);

        const r = render(
          <TestRefCollection refs={{ ref1, ref2, ref3: null }} />,
        );
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(0, 0);

        r.rerender(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(<div />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 1);
      });

      test('(Optional property) Only the added key is called on re-renders', () => {
        const spies1 = makeRefCallbackWithCleanupSpy();
        const ref1 = makeSpiedRefCallbackWithCleanup(spies1);
        const spies2 = makeRefCallbackWithCleanupSpy();
        const ref2 = makeSpiedRefCallbackWithCleanup(spies2);
        const spies3 = makeRefCallbackWithCleanupSpy();
        const ref3 = makeSpiedRefCallbackWithCleanup(spies3);

        const r = render(<TestRefCollection refs={{ ref1, ref2 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(0, 0);

        r.rerender(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(<div />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 1);
      });
    });

    describe('Remove a ref', () => {
      test('(Undefined) Only the removed key is cleaned up', () => {
        const spies1 = makeRefCallbackWithCleanupSpy();
        const ref1 = makeSpiedRefCallbackWithCleanup(spies1);
        const spies2 = makeRefCallbackWithCleanupSpy();
        const ref2 = makeSpiedRefCallbackWithCleanup(spies2);
        const spies3 = makeRefCallbackWithCleanupSpy();
        const ref3 = makeSpiedRefCallbackWithCleanup(spies3);

        const r = render(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(
          <TestRefCollection refs={{ ref1, ref2, ref3: undefined }} />,
        );
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 1);

        r.rerender(<div />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 1);
      });

      test('(Null) Only the removed key is cleaned up', () => {
        const spies1 = makeRefCallbackWithCleanupSpy();
        const ref1 = makeSpiedRefCallbackWithCleanup(spies1);
        const spies2 = makeRefCallbackWithCleanupSpy();
        const ref2 = makeSpiedRefCallbackWithCleanup(spies2);
        const spies3 = makeRefCallbackWithCleanupSpy();
        const ref3 = makeSpiedRefCallbackWithCleanup(spies3);

        const r = render(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(<TestRefCollection refs={{ ref1, ref2, ref3: null }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 1);

        r.rerender(<div />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 1);
      });

      test('(Optional property) Only the removed key is cleaned up', () => {
        const spies1 = makeRefCallbackWithCleanupSpy();
        const ref1 = makeSpiedRefCallbackWithCleanup(spies1);
        const spies2 = makeRefCallbackWithCleanupSpy();
        const ref2 = makeSpiedRefCallbackWithCleanup(spies2);
        const spies3 = makeRefCallbackWithCleanupSpy();
        const ref3 = makeSpiedRefCallbackWithCleanup(spies3);

        const r = render(<TestRefCollection refs={{ ref1, ref2, ref3 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(<TestRefCollection refs={{ ref1, ref2 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 1);

        r.rerender(<div />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 1);
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
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(
          <TestRefCollection
            refs={{ ref1, ref2, ref3: makeSpiedRefCallbackWithCleanup(spies3) }}
          />,
        );
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(2, 1);

        r.rerender(<div />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(2, 2);
      });
    });
  });
});

describe('Object refs', () => {
  describe('React (baseline)', () => {
    describe('Stable', () => {
      test('Is not updated on re-renders', () => {
        const spy = makeRefObjectSpy<HTMLDivElement>(null);

        const r = render(<TestRefObject ref={spy.ref} />);
        const r1div = r.getByTestId('ref-div');
        expect(spy.history).toEqual([null, r1div]);

        r.rerender(<TestRefObject ref={spy.ref} />);
        expect(spy.history).toEqual([null, r1div]);

        r.rerender(<div />);
        expect(spy.history).toEqual([null, r1div, null]);
      });
    });

    describe('Unstable', () => {
      test('Is updated on every re-render', () => {
        const spy1 = makeRefObjectSpy<HTMLDivElement>(null);
        const spy2 = makeRefObjectSpy<HTMLDivElement>(null);

        const r = render(<TestRefObject ref={spy1.ref} />);
        const r1div = r.getByTestId('ref-div');
        expect(spy1.history).toEqual([null, r1div]);
        expect(spy2.history).toEqual([null]);

        r.rerender(<TestRefObject ref={spy2.ref} />);
        const r2div = r.getByTestId('ref-div');
        expect(spy1.history).toEqual([null, r1div, null]);
        expect(spy2.history).toEqual([null, r2div]);

        r.rerender(<div />);
        expect(spy1.history).toEqual([null, r1div, null]);
        expect(spy2.history).toEqual([null, r2div, null]);
      });
    });
  });

  describe('useMergeRefs', () => {
    test('Single ref', () => {
      const spy = makeRefObjectSpy<HTMLDivElement>(null);

      const r = render(<TestRefCollection refs={{}} />);
      expect(spy.history).toEqual([null]);

      r.rerender(<TestRefCollection refs={{ ref: spy.ref }} />);
      const r1div = r.getByTestId('ref-div');
      expect(spy.history).toEqual([null, r1div]);

      r.rerender(<TestRefCollection refs={{ ref: spy.ref }} />);
      expect(spy.history).toEqual([null, r1div]);

      r.rerender(<TestRefCollection refs={{}} />);
      expect(spy.history).toEqual([null, r1div, null]);
    });

    test('No spurious cleanups', () => {
      const fakeDiv = document.createElement('div');
      const spy = makeRefObjectSpy(fakeDiv);

      const r = render(<TestSpuriousCleanups refs={{}} />);
      expect(spy.history).toEqual([fakeDiv]);

      // Here we set a ref (and thus `useMergeRefs` stores it) but never `show` so it never gets assigned a value
      // If our code is bugged it might assign a value here, or set it to `null` or something...
      r.rerender(<TestSpuriousCleanups refs={{ ref: spy.ref }} />);
      expect(spy.history).toEqual([fakeDiv]);

      r.rerender(<TestSpuriousCleanups refs={{}} />);
      expect(spy.history).toEqual([fakeDiv]);
    });
  });
});
