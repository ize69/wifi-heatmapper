/*
 * wifi-heatmapper
 * File: src/lib/server-globals.ts
 * Purpose: Global server helpers for SSE, cancellation flag and survey results storage.
 * Generated: 2025-12-18T10:28:20.555Z
 */

// lib/sseGlobal.ts

/**
 * This module keeps (truly) global variables.
 * They need to be available to all server-side code
 * They include:
 *
 * * sendSSEMessage - register the function that sends SSE's
 * * cancelMeasurement (maybe)
 */
import type { SSEMessageType } from "@/app/api/events/route";
import { SurveyResult } from "./types";

const SSE_KEY = "__sseSend__";
const CANCEL_KEY = "__sseFlag__";
const STATUS_KEY = "__status__";
const RESULTS_KEY = "__results__";
// const SSID_KEY = "__ssid__";

/**
 * Register the function that will send SSE messages to the connected client.
 * The registered function is stored on `globalThis` so other server modules
 * can call `sendSSEMessage()` without holding a reference to the response.
 */
/**
 * function registerSSESender — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export function registerSSESender(fn: (msg: SSEMessageType) => void) {
  (globalThis as any)[SSE_KEY] = fn;
}

export function clearSSESender() {
  (globalThis as any)[SSE_KEY] = null;
}

// the SSE_KEY element holds a function to call to send a SSE
/**
 * sendSSEMessage
 * Store the latest status in memory and, if an SSE sender is registered,
 * forward the message to the client. This is safe to call from any server
 * module (runner, routes, etc.).
 */
/**
 * function sendSSEMessage — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export function sendSSEMessage(msg: SSEMessageType) {
  const fn = (globalThis as any)[SSE_KEY] as
    | ((msg: SSEMessageType) => void)
    | null;
  setGlobalStatus(msg); // stash a global copy of the message
  if (fn) {
    fn(msg);
  } else {
    console.warn("No SSE client to send to");
  }
}

// === Boolean flag to cancel the measurement process ===

/**
 * function setCancelFlag — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export function setCancelFlag(value: boolean) {
  (globalThis as any)[CANCEL_KEY] = value;
}

export function getCancelFlag(): boolean {
  return !!(globalThis as any)[CANCEL_KEY];
}

// === Global copy of the current "sendSSEMessage" ===

/**
 * function setGlobalStatus — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export function setGlobalStatus(value: SSEMessageType) {
  (globalThis as any)[STATUS_KEY] = value;
}

export function getGlobalStatus(): SSEMessageType {
  return (globalThis as any)[STATUS_KEY];
}

// === Global copy of SurveyResults ===

/**
 * function setSurveyResults — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export function setSurveyResults(value: SurveyResult) {
  (globalThis as any)[RESULTS_KEY] = value;
}

export function getSurveyResults(): SurveyResult {
  return (globalThis as any)[RESULTS_KEY];
}

// Originally used to hold the desired SSID
// in the `scan-wifi` branch, now abandoned
// // === Global copy of the current SSID ===
//
// export function setSSID(value: WifiResults | null) {
//   (globalThis as any)[SSID_KEY] = value;
// }
//
// export function getSSID(): WifiResults | null {
//   return (globalThis as any)[SSID_KEY];
// }
