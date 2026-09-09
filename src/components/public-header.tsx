import Link from "next/link";
import { SafeImage } from "./safe-image";
import { BRAND_IMAGES } from "@/lib/site";

export function PublicHeader() {
  return (
    <header className="public-header">
      <div className="public-header-inner container">
        <Link href="/" className="public-brand" aria-label="Saarthians home">
          <SafeImage src={BRAND_IMAGES.logo} alt="" className="public-brand-logo" eager />
          saarthians<span>.online</span>
        </Link>
        <nav className="public-nav" aria-label="Main navigation">
          <Link href="/about">About</Link>
          <Link href="/programs">Programs</Link>
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <Link href="/login" className="public-nav-cta">Sign in ↗</Link>
      </div>
    </header>
  );
}
