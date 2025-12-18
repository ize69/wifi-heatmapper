/*
 * wifi-heatmapper
 * File: src/components/SpeedTest.tsx
 * React component for the UI.
 * Generated: 2025-12-18T10:28:20.555Z
 */

// speedTest.ts
import * as speedTest from "speedtest-net";

/**
 * type SpeedTestResult = — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export type SpeedTestResult = {
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
};

/**
 * async function runSpeedTest — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export async function runSpeedTest(): Promise<SpeedTestResult> {
  try {
    const result = await speedTest.default({ acceptLicense: true, acceptGdpr: true });

    return {
      downloadMbps: result.download.bandwidth * 8 / 1_000_000,
      uploadMbps: result.upload.bandwidth * 8 / 1_000_000,
      pingMs: result.ping.latency,
    };
  } catch (err) {
    throw new Error(`Speed test failed: ${err}`);
  }
}
