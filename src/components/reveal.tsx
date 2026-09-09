"use client";

import { useEffect, useRef } from "react";

// Scroll-reveal wrapper: fades/slides children in the first time they enter
// the viewport. Renders as plain content when JS is off or motion is reduced.
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
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
  }, []);

  return (
    <div ref={ref} className={className ? `reveal ${className}` : "reveal"} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
