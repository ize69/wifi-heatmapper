/*
 * wifi-heatmapper
 * File: src/app/page.tsx
 * Top-level Next.js app page or layout.
 * Generated: 2025-12-18T10:28:20.555Z
 */

"use client";

import { SettingsProvider } from "@/components/GlobalSettings";
import TabPanel from "@/components/TabPanel";
/**
 * default function App — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export default function App() {
  return (
    <SettingsProvider>
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-600">
        Wi-Fi Heatmapper
      </h1>
      <TabPanel />
      <footer>
        <center>
          <a href="https://github.com/hnykda/wifi-heatmapper">the Github repo</a>.
        <br />
        </center>

      </footer>
    </SettingsProvider>
  );
}
