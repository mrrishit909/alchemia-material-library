import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "ALCHEMIA", description: "ALCHEMIA: an interactive materials discovery library with virtual tests. Synthetic records, not datasheet values." };
export const viewport: Viewport = { themeColor: "#0E1114", width: "device-width", initialScale: 1 };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
