/*
 * wifi-heatmapper
 * File: src/app/layout.tsx
 * Top-level Next.js app page or layout.
 * Generated: 2025-12-18T10:28:20.555Z
 */

import type { Metadata } from "next";

import "./globals.css";
import { SettingsProvider } from "@/components/GlobalSettings";
import { initServer } from "../lib/server-init";

/**
 * const metadata — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export const metadata: Metadata = {
  title: "WiFi Heatmapper",
  description: "A tool to measure WiFi signal in a floorplan.",
};

await initServer(); // fire up all the server-side stuff

/**
 * default function RootLayout — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <SettingsProvider>
        <body>{children}</body>
      </SettingsProvider>
    </html>
  );
}
