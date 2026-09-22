"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SafeImage } from "./safe-image";
import { BRAND_IMAGES } from "@/lib/site";

const links: [string, string][] = [
  ["Why Saarthians", "/#why"],
  ["Programs", "/programs"],
  ["Reviews", "/#reviews"],
  ["About", "/about"],
  ["Visit", "/#visit"],
];

const mobileLinks: [string, string][] = [
  ...links,
  ["Resources", "/resources"],
  ["Contact", "/contact"],
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close the menu on navigation via render-time derived-state update
  // (the documented alternative to setState inside an effect).
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  return (
    <header className="public-header" data-scrolled={scrolled}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="public-header-inner container">
        <Link href="/" className="public-brand" aria-label="Saarthians home">
          <SafeImage src={BRAND_IMAGES.logo} alt="" className="public-brand-logo" eager />
          saarthians<span>.online</span>
        </Link>
        <nav className="public-nav" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="public-header-actions">
          <Link href="/login" className="public-nav-cta">Sign in ↗</Link>
          <button
            type="button"
            className="public-menu-button"
            aria-expanded={open}
            aria-controls="public-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
      <div id="public-mobile-menu" className="public-mobile-menu" data-open={open} hidden={!open} onClick={() => setOpen(false)}>
        <nav aria-label="Mobile navigation">
          {mobileLinks.map(([label, href], i) => (
            <Link key={href} href={href} style={{ transitionDelay: `${60 + i * 45}ms` }}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="public-mobile-cta">
          <Link href="/login" className="public-button public-button-primary">Sign in →</Link>
          <Link href="/programs" className="public-button public-button-secondary">Explore programs</Link>
        </div>
      </div>
    </header>
  );
}
