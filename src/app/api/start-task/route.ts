/*
 * wifi-heatmapper
 * File: src/app/api/start-task/route.ts
 * Purpose: API endpoint to start/stop a measurement and to return pollable results.
 * Generated: 2025-12-18T10:28:20.555Z
 */

/**
 * start-task API - /api/start-task?action=...
 * - GET  of "action=status" returns the current status
 * - POST of "action=start" begins the measurement process
 * - POST of "action=stop" sets the cancel flag to halt the process
 */
import { NextRequest, NextResponse } from "next/server";
import {
  setCancelFlag,
  getGlobalStatus,
  setSurveyResults,
  getSurveyResults,
} from "@/lib/server-globals";
import { runSurveyTests } from "@/lib/iperfRunner";
import { getLogger } from "../../../lib/logger";
const logger = getLogger("start-task");

// handle a "status" request
/**
 * async function GET — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  if (action === "status") {
    return NextResponse.json(getGlobalStatus());
  } else if (action === "results") {
    return NextResponse.json(getSurveyResults());
  }
  // invalid action
  return NextResponse.json(
    { error: `Invalid action "${action}"` },
    { status: 400 },
  );
}

/**
 * async function POST — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export async function POST(req: NextRequest) {
  /**
   * POST /api/start-task?action=start|stop
   * - action=start: accepts `{ settings }` JSON and starts an asynchronous
   *   background measurement. The server immediately returns "OK" and the
   *   running process updates results via `setSurveyResults` and SSE.
   * - action=stop: sets the global cancel flag so a running measurement will stop.
   */
  // Get the `action` parameter - /api/start-task?action=start`
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // action=start: expects an object with a single property: settings
  if (action === "start") {
    const { settings } = await req.json();
    logger.debug(`action=start: ${JSON.stringify(settings)}`);
    setSurveyResults({ state: "pending" });

    // Start off the survey process immediately
    // this IIFE runs independently and uses setSurveyResults for the client
    void (async () => {
      try {
        const { iperfData, wifiData, status } = await runSurveyTests(settings);
        // status that isn't "" means preflight went wrong
        if (status != "") {
          setSurveyResults({
            explanation: status,
            state: "error",
          });
          return;
        }
        if (!wifiData) {
          setSurveyResults({
            state: "error",
            explanation: "wifi data is null",
          });
          return;
        }
        // if iperfData is null, still return wifiData so the point can be plotted
        setSurveyResults({ state: "done", results: { wifiData, iperfData } });
      } catch (err) {
        setSurveyResults({ state: "error", explanation: String(err) });
      }
    })();

    // and immediately retun an OK status
    return NextResponse.json("OK");

    // Stop
  } else if (action === "stop") {
    setCancelFlag(true); // in sseGlobal.ts
    return NextResponse.json({ message: "Task stopped" });
  }

  logger.debug(`Unexpected action received: ${action}`);
  return NextResponse.json(
    { error: `Invalid action "${action}"` },
    { status: 400 },
  );
}
