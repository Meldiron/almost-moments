"use client";

import {
  createContext,
  startTransition,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter as useNextRouter } from "next/navigation";
import NextLink from "next/link";
import type { ComponentProps } from "react";

// ─── Context to coordinate transition lifecycle ─────────────────

const ViewTransitionsContext = createContext<
  React.MutableRefObject<(() => void) | null>
>(null!);

export function ViewTransitions({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const resolverRef = useRef<(() => void) | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (resolverRef.current) {
      resolverRef.current();
      resolverRef.current = null;
    }
  }, [tick]);

  const contextValue = useMemo(() => {
    return {
      get current() {
        return resolverRef.current;
      },
      set current(fn: (() => void) | null) {
        resolverRef.current = fn;
        if (fn) setTick((n) => n + 1);
      },
    } as React.MutableRefObject<(() => void) | null>;
  }, []);

  return (
    <ViewTransitionsContext.Provider value={contextValue}>
      {children}
    </ViewTransitionsContext.Provider>
  );
}

function useFinishTransitionRef() {
  return use(ViewTransitionsContext);
}

// ─── Transition router hook ─────────────────────────────────────

export function useViewTransitionRouter() {
  const router = useNextRouter();
  const finishRef = useFinishTransitionRef();

  const triggerTransition = useCallback(
    (cb: () => void) => {
      if ("startViewTransition" in document) {
        (
          document as unknown as {
            startViewTransition: (cb: () => Promise<void>) => void;
          }
        ).startViewTransition(
          () =>
            new Promise<void>((resolve) => {
              startTransition(() => {
                cb();
                finishRef.current = resolve;
              });
            }),
        );
      } else {
        cb();
      }
    },
    [finishRef],
  );

  const push = useCallback(
    (href: string) => {
      triggerTransition(() => router.push(href));
    },
    [triggerTransition, router],
  );

  const replace = useCallback(
    (href: string) => {
      triggerTransition(() => router.replace(href));
    },
    [triggerTransition, router],
  );

  return useMemo(() => ({ ...router, push, replace }), [push, replace, router]);
}

// ─── Transition Link component ──────────────────────────────────

function isModifiedEvent(event: React.MouseEvent): boolean {
  const eventTarget = event.currentTarget as HTMLAnchorElement | SVGAElement;
  const target = eventTarget.getAttribute("target");
  return (
    (target != null && target !== "_self") ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (event.nativeEvent && event.nativeEvent.which === 2)
  );
}

function shouldPreserveDefault(
  e: React.MouseEvent<HTMLAnchorElement>,
): boolean {
  const { nodeName } = e.currentTarget;
  if (nodeName.toUpperCase() === "A" && isModifiedEvent(e)) {
    return true;
  }
  return false;
}

export function TransitionLink(props: ComponentProps<typeof NextLink>) {
  const router = useViewTransitionRouter();
  const { href, as, replace, scroll } = props;

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (props.onClick) {
        props.onClick(e);
      }
      if (e.defaultPrevented) return;
      if (!("startViewTransition" in document)) return;
      if (shouldPreserveDefault(e)) return;

      e.preventDefault();
      const navigate = replace ? router.replace : router.push;
      navigate(String(as || href));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.onClick, href, as, replace, scroll, router],
  );

  return <NextLink {...props} onClick={onClick} />;
}
