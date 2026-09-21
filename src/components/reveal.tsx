"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// Scroll-reveal wrapper: fades/slides children in the first time they enter
// the viewport. Renders as plain content when JS is off or motion is reduced.
// The `as` prop keeps HTML valid inside lists (e.g. as="li" directly under
// <ol>/<ul>) instead of nesting a <div> between list elements.
export function Reveal({
  children,
  className,
  delay = 0,
  as,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li";
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const liRef = useRef<HTMLLIElement>(null);
  const cls = className ? `reveal ${className}` : "reveal";
  const sty = { transitionDelay: `${delay}ms` } as CSSProperties;

  useEffect(() => {
    const node: HTMLElement | null = as === "li" ? liRef.current : divRef.current;
    if (!node) return;
    // Arm first (hidden state applies only when JS runs — no-JS keeps content
    // visible), then reveal on intersection.
    node.classList.add("armed");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("in");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [as]);

  if (as === "li") {
    return (
      <li ref={liRef} className={cls} style={sty}>
        {children}
      </li>
    );
  }
  return (
    <div ref={divRef} className={cls} style={sty}>
      {children}
    </div>
  );
}
