import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saarthians — Learn with direction",
  description: "A premium learning experience for focused students and teachers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
