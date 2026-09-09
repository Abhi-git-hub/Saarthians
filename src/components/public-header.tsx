"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SafeImage } from "./safe-image";
import { BRAND_IMAGES } from "@/lib/site";

const links: [string, string][] = [
  ["About", "/about"],
  ["Programs", "/programs"],
  ["Portfolio", "/portfolio"],
  ["Resources", "/resources"],
  ["Contact", "/contact"],
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open ]);

  return (
    <header className="public-header">
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
      <div id="public-mobile-menu" className="public-mobile-menu" data-open={open} hidden={!open}>
        <nav aria-label="Mobile navigation">
          {links.map(([label, href], i) => (
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
