import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import type { Ref, RefCallback, RefObject } from 'react';
import {
  makeRefCallbackWithCleanupSpy,
  makeSpiedRefCallbackWithCleanup,
} from '../test/utils/ref-callback-with-cleanup.js';
import { makeRefCallbackSpy } from '../test/utils/ref-callback.js';
import { makeRefObjectSpy } from '../test/utils/ref-object.js';
import { useMergeRefs, type RefCollection } from './index.js';

describe('React refs', () => {
  describe('Callback refs', () => {
    function TestComponent({ ref }: { ref: RefCallback<HTMLElement> }) {
      return <div ref={ref} />;
    }

    describe('Stable', () => {
      test('Is not called on re-renders', () => {
        const spy = makeRefCallbackSpy();

        const r = render(<TestComponent ref={spy.ref} />);
        expect(spy.ref).toBeCalledTimes(1);
        expect(spy.ref).not.nthCalledWith(1, null);

        r.rerender(<TestComponent ref={spy.ref} />);
        expect(spy.ref).toBeCalledTimes(1);
        expect(spy.ref).not.nthCalledWith(1, null);

        r.rerender(<div />);
        expect(spy.ref).toBeCalledTimes(2);
        expect(spy.ref).nthCalledWith(
          2,
          // @todo WTF? Why all the `undefined`s here?
          null,
          undefined,
          undefined,
          undefined,
          undefined,
        );
      });
    });

    describe('Unstable', () => {
      test('Is called on every re-render', () => {
        const spy = makeRefCallbackSpy();

        const r = render(
          <TestComponent
            ref={(v) => {
              spy.ref(v);
            }}
          />,
        );
        expect(spy.ref).toBeCalledTimes(1);

        r.rerender(
          <TestComponent
            ref={(v) => {
              spy.ref(v);
            }}
          />,
        );
        expect(spy.ref).toBeCalledTimes(3);
        expect(spy.ref).nthCalledWith(2, null);
        expect(spy.ref).not.nthCalledWith(3, null);

        r.rerender(<div />);
        expect(spy.ref).toBeCalledTimes(4);
        expect(spy.ref).nthCalledWith(4, null);
      });
    });
  });

  describe('Callback refs with cleanup', () => {
    function TestComponent({ ref }: { ref: RefCallback<HTMLElement> }) {
      return <div ref={ref} />;
    }

    describe('Stable', () => {
      test('Is not called on re-renders', () => {
        const spies = makeRefCallbackWithCleanupSpy();
        const ref = makeSpiedRefCallbackWithCleanup(spies);

        const r = render(<TestComponent ref={ref} />);
        expect(spies).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(<TestComponent ref={ref} />);
        expect(spies).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(<div />);
        expect(spies).toHaveRefCallbackWithCleanupTimes(1, 1);
      });
    });

    describe('Unstable', () => {
      test('Is called on every re-render', () => {
        const spies = makeRefCallbackWithCleanupSpy();

        const r = render(
          <TestComponent ref={makeSpiedRefCallbackWithCleanup(spies)} />,
        );
        expect(spies).toHaveRefCallbackWithCleanupTimes(1, 0);

        r.rerender(
          <TestComponent ref={makeSpiedRefCallbackWithCleanup(spies)} />,
        );
        expect(spies).toHaveRefCallbackWithCleanupTimes(2, 1);

        r.rerender(<div />);
        expect(spies).toHaveRefCallbackWithCleanupTimes(2, 2);
      });
    });
  });

  describe('Object refs', () => {
    function TestComponent({ ref }: { ref: RefObject<HTMLDivElement | null> }) {
      return <div ref={ref} />;
    }

    describe('Stable', () => {
      test('Is not updated on re-renders', () => {
        const spy = makeRefObjectSpy<HTMLDivElement>(null);

        const r = render(<TestComponent ref={spy.ref} />);
        expect(spy.history).toHaveLength(2);

        r.rerender(<TestComponent ref={spy.ref} />);
        expect(spy.history).toHaveLength(2);

        r.rerender(<div />);
        expect(spy.history).toHaveLength(3);
      });
    });

    describe('Unstable', () => {
      test('Is updated on every re-render', () => {
        const spy1 = makeRefObjectSpy<HTMLDivElement>(null);
        const spy2 = makeRefObjectSpy<HTMLDivElement>(null);

        const r = render(<TestComponent ref={spy1.ref} />);
        expect(spy1.history).toHaveLength(2);
        expect(spy2.history).toHaveLength(1);

        r.rerender(<TestComponent ref={spy2.ref} />);
        expect(spy1.history).toHaveLength(3);
        expect(spy2.history).toHaveLength(2);

        r.rerender(<div />);
        expect(spy1.history).toHaveLength(3);
        expect(spy2.history).toHaveLength(3);
      });
    });
  });
});

describe('useMergeRefs', () => {
  function TestComponent({ refs }: { refs: RefCollection<HTMLElement> }) {
    return <div ref={useMergeRefs(refs)} />;
  }

  describe('Callback refs with cleanup', () => {
    test('Single ref', () => {
      const spies = makeRefCallbackWithCleanupSpy();
      const ref = makeSpiedRefCallbackWithCleanup(spies);

      const rendered = render(<TestComponent refs={{ ref }} />);
      expect(spies).toHaveRefCallbackWithCleanupTimes(1, 0);

      rendered.rerender(<TestComponent refs={{ ref }} />);
      expect(spies).toHaveRefCallbackWithCleanupTimes(1, 0);

      rendered.rerender(<div />);
      expect(spies).toHaveRefCallbackWithCleanupTimes(1, 1);
    });

    describe('All stable', () => {
      test('None are called on re-render', () => {
        const spies1 = makeRefCallbackWithCleanupSpy();
        const ref1 = makeSpiedRefCallbackWithCleanup(spies1);
        const spies2 = makeRefCallbackWithCleanupSpy();
        const ref2 = makeSpiedRefCallbackWithCleanup(spies2);

        const rendered = render(<TestComponent refs={{ ref1, ref2 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);

        rendered.rerender(<TestComponent refs={{ ref1, ref2 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);

        rendered.rerender(<div />);
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

        const rendered = render(
          <TestComponent refs={{ ref1, ref2, ref3: undefined }} />,
        );
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(0, 0);

        rendered.rerender(<TestComponent refs={{ ref1, ref2, ref3 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        rendered.rerender(<div />);
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

        const rendered = render(
          <TestComponent refs={{ ref1, ref2, ref3: null }} />,
        );
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(0, 0);

        rendered.rerender(<TestComponent refs={{ ref1, ref2, ref3 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        rendered.rerender(<div />);
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

        const rendered = render(<TestComponent refs={{ ref1, ref2 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(0, 0);

        rendered.rerender(<TestComponent refs={{ ref1, ref2, ref3 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        rendered.rerender(<div />);
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

        const rendered = render(<TestComponent refs={{ ref1, ref2, ref3 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        rendered.rerender(
          <TestComponent refs={{ ref1, ref2, ref3: undefined }} />,
        );
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 1);

        rendered.rerender(<div />);
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

        const rendered = render(<TestComponent refs={{ ref1, ref2, ref3 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        rendered.rerender(<TestComponent refs={{ ref1, ref2, ref3: null }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 1);

        rendered.rerender(<div />);
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

        const rendered = render(<TestComponent refs={{ ref1, ref2, ref3 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        rendered.rerender(<TestComponent refs={{ ref1, ref2 }} />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 1);

        rendered.rerender(<div />);
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

        const rendered = render(
          <TestComponent
            refs={{ ref1, ref2, ref3: makeSpiedRefCallbackWithCleanup(spies3) }}
          />,
        );
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(1, 0);

        rendered.rerender(
          <TestComponent
            refs={{ ref1, ref2, ref3: makeSpiedRefCallbackWithCleanup(spies3) }}
          />,
        );
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 0);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(2, 1);

        rendered.rerender(<div />);
        expect(spies1).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies2).toHaveRefCallbackWithCleanupTimes(1, 1);
        expect(spies3).toHaveRefCallbackWithCleanupTimes(2, 2);
      });
    });
  });

  describe('Object refs', () => {
    test('Single ref', () => {
      const spy = makeRefObjectSpy<HTMLDivElement>(null);

      const Test = ({ ref }: { ref?: Ref<HTMLDivElement> }) => {
        return <div ref={useMergeRefs({ ref })} />;
      };

      const rendered = render(<Test />);
      expect(spy.history).toHaveLength(1);
      expect(spy.history[0]).toEqual(null);

      rendered.rerender(<Test ref={spy.ref} />);
      expect(spy.history).toHaveLength(2);
      expect(spy.history[1]).toBeInstanceOf(HTMLDivElement);

      rendered.rerender(<Test ref={spy.ref} />);
      expect(spy.history).toHaveLength(2);
      expect(spy.history[1]).toBeInstanceOf(HTMLDivElement);

      rendered.rerender(<Test />);
      expect(spy.history).toHaveLength(3);
      expect(spy.history[2]).toEqual(null);
    });

    test('No spurious cleanups', () => {
      const spy = makeRefObjectSpy<number>(1337);

      const Test = ({ show, ref }: { show?: boolean; ref?: Ref<unknown> }) => {
        const mergedRefs = useMergeRefs({ ref });
        return <div>{show ? <div ref={mergedRefs} /> : null}</div>;
      };

      const rendered = render(<Test />);
      expect(spy.history).toHaveLength(1);
      expect(spy.history[0]).toEqual(1337);

      // Here we set a ref but never `show` so it never gets assigned a value
      // If our code is bugge it might assign a value here!
      rendered.rerender(<Test ref={spy.ref} />);
      expect(spy.history).toHaveLength(1);
      expect(spy.history[0]).toEqual(1337);

      rendered.rerender(<Test />);
      expect(spy.history).toHaveLength(1);
      expect(spy.history[0]).toEqual(1337);
    });
  });
});
