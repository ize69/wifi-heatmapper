/*
 * wifi-heatmapper
 * File: src/lib/iperfRunner.ts
 * Purpose: Coordinate Wi‑Fi scans and iperf3 measurements for a survey point.
 * Generated: 2025-12-18T10:28:20.555Z
 */

"use server";
import {
  PartialHeatmapSettings,
  IperfResults,
  IperfTestProperty,
  WifiResults,
} from "./types";
//import { scanWifi, blinkWifi } from "./wifiScanner";
import { execAsync, delay } from "./server-utils";
import { getCancelFlag, sendSSEMessage } from "./server-globals";
import { percentageToRssi, toMbps, getDefaultIperfResults } from "./utils";
import { SSEMessageType } from "@/app/api/events/route";
import { createWifiActions } from "./wifiScanner";
import { getLogger } from "./logger";
const logger = getLogger("iperfRunner");

type TestType = "TCP" | "UDP";
type TestDirection = "Up" | "Down";

const wifiActions = await createWifiActions();

/**
 * Ensure that the Wi‑Fi metadata didn't change between scans.
 * Returns true when consistent, false otherwise.
 */
const validateWifiDataConsistency = (
  wifiDataBefore: WifiResults,
  wifiDataAfter: WifiResults,
): boolean => {
  const consistent =
    wifiDataBefore.bssid === wifiDataAfter.bssid &&
    wifiDataBefore.ssid === wifiDataAfter.ssid &&
    wifiDataBefore.band === wifiDataAfter.band &&
    wifiDataBefore.channel === wifiDataAfter.channel;
  if (!consistent) {
    const logString = `${JSON.stringify(wifiDataBefore.bssid)} ${JSON.stringify(wifiDataAfter.bssid)}`;
    logger.debug(logString);
  }
  return consistent;
};

function arrayAverage(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / arr.length);
}

const initialStates = {
  type: "update",
  header: "Measurement beginning",
  strength: "-",
  tcp: "-/- Mbps",
  udp: "-/- Mbps",
};

// The measurement process updates these variables
// which then are converted into update events
let displayStates = {
  type: "update",
  header: "In progress",
  strength: "-",
  tcp: "-/- Mbps",
  udp: "-/- Mbps",
};

/**
 * getUpdatedMessage - combine all the displayState values
 * @returns (SSEMessageType) - the message to send
 */
function getUpdatedMessage(): SSEMessageType {
  let strength = displayStates.strength;
  if (strength != "-") {
    strength += "%";
  }
  return {
    type: displayStates.type,
    header: displayStates.header,
    status: `Signal strength: ${strength}\nTCP: ${displayStates.tcp}\nUDP: ${displayStates.udp}`,
  };
}

function checkForCancel() {
  if (getCancelFlag()) throw new Error("cancelled");
}

/**
 * runSurveyTests() - get the WiFi and iperf readings
 * @param settings
 * @returns the WiFi and iperf results for this location
 */
/**
 * async function runSurveyTests — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export async function runSurveyTests(
  settings: PartialHeatmapSettings,
): Promise<{
  iperfData: IperfResults | null;
  wifiData: WifiResults | null;
  status: string;
}> {
  /**
   * runSurveyTests
   * Orchestrates a single survey measurement at a point:
   * - performs preflight checks
   * - builds an ordered list of iperf servers (primary, backup)
   * - scans Wi‑Fi and captures signal strengths
   * - runs TCP and UDP iperf tests using runSingleTestWithFallback
   * - sends incremental SSE updates via `sendSSEMessage`
   * Returns wifi data and optional iperf results (null if iperf failed).
   */
  // first check the settings and return cogent error if not good
  const preResults = await wifiActions.preflightSettings(settings);
  if (preResults.reason != "") {
    logger.debug(`preflightSettings returned: ${JSON.stringify(preResults)}`);
    return { iperfData: null, wifiData: null, status: preResults.reason };
  }
  // check if iperf3 server is available
  // this is separate from the other preflight checks because it's reasonable
  // to test the wifi even the iperf3 server is not accessible
  // (say, you have moved to another subnet)
  let noIperfTestReason = "";
  let performIperfTest = true; // assume we will run iperf3 test
  // build the servers list based on reachability (try primary, then backup)
  const servers: string[] = [];
  if (settings.iperfServerAdrs == "localhost") {
    performIperfTest = false;
    noIperfTestReason = "Not performed";
  } else {
    // try primary
    const resp = await wifiActions.checkIperfServer(settings);
    logger.debug(`checkIperfServer(primary) returned: ${JSON.stringify(resp)}`);
    if (resp.reason == "") {
      servers.push(settings.iperfServerAdrs);
      // add backup as fallback if provided (no need to pre-validate)
      if (
        settings.iperfServerBackupAdrs &&
        settings.iperfServerBackupAdrs.trim().toLowerCase() !== "localhost" &&
        settings.iperfServerBackupAdrs !== settings.iperfServerAdrs
      ) {
        servers.push(settings.iperfServerBackupAdrs);
      }
    } else {
      // primary failed; try backup if configured
      if (
        settings.iperfServerBackupAdrs &&
        settings.iperfServerBackupAdrs.trim().toLowerCase() !== "localhost" &&
        settings.iperfServerBackupAdrs !== settings.iperfServerAdrs
      ) {
        const backupSettings = { ...settings, iperfServerAdrs: settings.iperfServerBackupAdrs };
        const resp2 = await wifiActions.checkIperfServer(backupSettings);
        logger.debug(`checkIperfServer(backup) returned: ${JSON.stringify(resp2)}`);
        if (resp2.reason == "") {
          // use backup as primary for tests, and keep original primary as fallback
          servers.push(settings.iperfServerBackupAdrs);
          servers.push(settings.iperfServerAdrs);
        } else {
          performIperfTest = false;
          noIperfTestReason = resp.reason || resp2.reason || "Cannot connect to iperf3 server.";
        }
      } else {
        performIperfTest = false;
        noIperfTestReason = resp.reason || "Cannot connect to iperf3 server.";
      }
    }
  }

  // begin the survey
  try {
    const maxRetries = 3;
    let attempts = 0;
    const attemptsByServer: Record<string, number> = {}; // track how many times we've tried each server
    let iperfSucceeded = false;
    const newIperfData = getDefaultIperfResults();
    let newWifiData: WifiResults | null = null;

    // set the initial states, then send an event to the client
    const startTime = Date.now();
    displayStates = { ...displayStates, ...initialStates };
    sendSSEMessage(getUpdatedMessage()); // immediately send initial values
    displayStates.header = "Measurement in progress...";

    // This is where the "scan-wifi" branch (now abandoned)
    // would scan the local wifi neighborhood to find the best
    // SSID, then switch to it, then make the measurements.
    // This is too hard on macOS (too many credential prompts)
    // to be practical.

    // Scan the wifi neighborhood, retrieve the ssidName from the current
    const ssids = await wifiActions.scanWifi(settings);
    logger.debug(`scanWifi returned: ${JSON.stringify(ssids)}`);

    const thisSSID = ssids.SSIDs.filter((item) => item.currentSSID);
    const ssidName = thisSSID[0].ssid;

    while (attempts < maxRetries) {
      attempts++;
      try {
        // rotate servers so each attempt starts with the next server in list
        const rotation = servers.length > 0 ? (attempts - 1) % servers.length : 0;
        const orderedServers = servers.length > 0
          ? servers.slice(rotation).concat(servers.slice(0, rotation))
          : servers;
        const server = orderedServers[0];
        const duration = settings.testDuration;
        const wifiStrengths: number[] = []; // percentages
        // add the SSID to the header if it's not <redacted>
        let newHeader = "Measuring Wi-Fi";
        if (!ssidName.includes("redacted")) {
          newHeader += ` (${ssidName})`;
        }
        displayStates.header = newHeader;

        const wifiDataBefore = await wifiActions.getWifi(settings);
        logger.debug(`getWifi() returned: ${JSON.stringify(wifiDataBefore)}`);
        console.log(
          `Elapsed time for scan and switch: ${Date.now() - startTime}`,
        );
        wifiStrengths.push(wifiDataBefore.SSIDs[0].signalStrength);
        displayStates.strength = arrayAverage(wifiStrengths).toString();
        checkForCancel();
        sendSSEMessage(getUpdatedMessage());

        // Run the TCP tests (try backup server on failure)
        if (performIperfTest) {
          try {
            newIperfData.tcpDownload = await runSingleTestWithFallback(
              orderedServers,
              duration,
              "Down",
              "TCP",
              attemptsByServer,
              attempts,
              maxRetries,
            );
            newIperfData.tcpUpload = await runSingleTestWithFallback(
              orderedServers,
              duration,
              "Up",
              "TCP",
              attemptsByServer,
              attempts,
              maxRetries,
            );
            displayStates.tcp = `${toMbps(newIperfData.tcpDownload.bitsPerSecond)} / ${toMbps(newIperfData.tcpUpload.bitsPerSecond)} Mbps`;
            iperfSucceeded = true;
          } catch (err: any) {
            logger.warn(`TCP iperf tests failed: ${err}`);
            // mark as not performing further iperf work for this attempt
            iperfSucceeded = false;
            displayStates.tcp = `iperf failed`;
          }
        } else {
          await delay(500);
          displayStates.tcp = noIperfTestReason;
        }
        checkForCancel();
        sendSSEMessage(getUpdatedMessage());

        const wifiDataMiddle = await wifiActions.getWifi(settings);
        wifiStrengths.push(wifiDataMiddle.SSIDs[0].signalStrength);
        displayStates.strength = arrayAverage(wifiStrengths).toString();
        checkForCancel();
        sendSSEMessage(getUpdatedMessage());

        // Run the UDP tests (try backup server on failure)
        if (performIperfTest) {
          try {
            newIperfData.udpDownload = await runSingleTestWithFallback(
              orderedServers,
              duration,
              "Down",
              "UDP",
              attemptsByServer,
              attempts,
              maxRetries,
            );
            newIperfData.udpUpload = await runSingleTestWithFallback(
              orderedServers,
              duration,
              "Up",
              "UDP",
              attemptsByServer,
              attempts,
              maxRetries,
            );
            displayStates.udp = `${toMbps(newIperfData.udpDownload.bitsPerSecond)} / ${toMbps(newIperfData.udpUpload.bitsPerSecond)} Mbps`;
            iperfSucceeded = iperfSucceeded || true;
          } catch (err: any) {
            logger.warn(`UDP iperf tests failed: ${err}`);
            displayStates.udp = `iperf failed`;
          }
        } else {
          await delay(500);
          displayStates.udp = noIperfTestReason;
        }
        checkForCancel();
        sendSSEMessage(getUpdatedMessage());

        const wifiDataAfter = await wifiActions.getWifi(settings);
        wifiStrengths.push(wifiDataAfter.SSIDs[0].signalStrength);
        displayStates.strength = arrayAverage(wifiStrengths).toString();
        checkForCancel();

        // Validate wifi consistency and prepare the wifiData for return.
        if (
          !validateWifiDataConsistency(
            wifiDataBefore.SSIDs[0],
            wifiDataAfter.SSIDs[0],
          )
        ) {
          throw new Error(
            "Wifi configuration changed between scans! Cancelling instead of giving wrong results.",
          );
        }

        const strength = parseInt(displayStates.strength);
        newWifiData = {
          ...wifiDataBefore.SSIDs[0],
          signalStrength: strength, // use the average signalStrength
          rssi: percentageToRssi(strength), // set corresponding RSSI
        };

        // Successful measurement for this attempt; break out to finish up.
        break;
      } catch (error: any) {
        logger.error(`Attempt ${attempts} failed:`, error);
        if (error.message == "cancelled") {
          return {
            iperfData: null,
            wifiData: null,
            status: "test was cancelled",
          };
        }
      }
    }

    // After attempts, check we have wifi data to return
    if (!newWifiData) {
      return { iperfData: iperfSucceeded ? newIperfData! : null, wifiData: null, status: "No valid wifi data after attempts" };
    }

    // Send the final update - type is "done"
    displayStates.type = "done";
    displayStates.header = "Measurement complete";
    sendSSEMessage(getUpdatedMessage());

    // return the values (return iperfData null if iperf tests failed)
    return { iperfData: iperfSucceeded ? newIperfData! : null, wifiData: newWifiData!, status: "" };
  } catch (error) {
    logger.error("Error running measurement tests:", error);
    sendSSEMessage({
      type: "done",
      status: "Error taking measurements",
      header: "Error",
    });

    throw error;
  }
}

/**
 * Execute a single iperf3 test against `server` and return the parsed
 * `IperfTestProperty`.
 * @param server host (or host:port) of iperf3 server
 * @param duration test duration in seconds
 * @param testDir "Up" or "Down"
 * @param testType "TCP" or "UDP"
 * @returns parsed iperf test metrics
 * @throws if iperf3 invocation fails or JSON is malformed
 */
async function runSingleTest(
  server: string,
  duration: number,
  testDir: TestDirection,
  testType: TestType,
): Promise<IperfTestProperty> {
  const logger = getLogger("runSingleTest");

  let port = "";
  if (server.includes(":")) {
    const [host, serverPort] = server.split(":");
    server = host;
    port = serverPort;
  }
  const isUdp = testType == "UDP";
  const isDownload = testDir == "Down";
  const command = `iperf3 -c ${server} ${
    port ? `-p ${port}` : ""
  } -t ${duration} ${isDownload ? "-R" : ""} ${isUdp ? "-u -b 0" : ""} -J`;
  const { stdout } = await execAsync(command);
  const result = JSON.parse(stdout);
  logger.trace("Iperf JSON-parsed result:", result);
  const extracted = extractIperfData(result, isUdp);
  logger.trace("Iperf extracted results:", extracted);
  return extracted;
}

/**
 * Try the list of `servers` in order; for each server call `runSingleTest`.
 * Increments `attemptsByServer[server]` on each try and emits SSE updates
 * describing which server and attempt number is being tried. If all servers
 * fail the last error is thrown.
 */
async function runSingleTestWithFallback(
  servers: string[],
  duration: number,
  testDir: TestDirection,
  testType: TestType,
  attemptsByServer: Record<string, number>,
  overallAttempt: number,
  maxAttempts: number,
): Promise<IperfTestProperty> {
  let lastError: any = null;
  for (const s of servers) {
    try {
      // increment per-server attempt counter
      attemptsByServer[s] = (attemptsByServer[s] || 0) + 1;
      // update SSE so the UI shows which server and which attempt we're on
      displayStates.header = `Attempt ${overallAttempt}/${maxAttempts} — trying ${s}`;
      displayStates.tcp = displayStates.tcp; // keep existing values
      displayStates.udp = displayStates.udp;
      sendSSEMessage(getUpdatedMessage());

      return await runSingleTest(s, duration, testDir, testType);
    } catch (err) {
      lastError = err;
      logger.warn(`Iperf test failed for server ${s}, trying next if available: ${err}`);
      displayStates.header = `Attempt ${overallAttempt}/${maxAttempts} — ${s} failed, trying next`;
      sendSSEMessage(getUpdatedMessage());
    }
  }
  // if we fall through, rethrow last error
  throw lastError || new Error("No servers provided for iperf test");
}

/**
 * Convert raw iperf3 JSON output into an `IperfTestProperty`.
 * Handles differences between older and newer iperf3 JSON structures.
 * Throws when no usable `bits_per_second` value can be found.
 */
/**
 * async function extractIperfData — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export async function extractIperfData(
  result: {
    end: {
      sum_received?: { bits_per_second: number };
      sum_sent?: { retransmits?: number };
      sum?: {
        bits_per_second?: number;
        jitter_ms?: number;
        lost_packets?: number;
        packets?: number;
        lost_percent?: number;
        retransmits?: number;
      };
      streams?: Array<{
        udp?: {
          jitter_ms?: number;
          lost_packets?: number;
          packets?: number;
        };
      }>;
    };
    version?: string;
  },
  isUdp: boolean,
): Promise<IperfTestProperty> {
  const end = result.end;

  // Check if we're dealing with newer iPerf (Mac - v3.17+) or older iPerf (Ubuntu - v3.9)
  // Newer versions have sum_received and sum_sent, older versions only have sum
  const isNewVersion = !!end.sum_received;

  /**
   * In newer versions (Mac):
   * - TCP: sum_received contains download/upload bps, sum_sent contains retransmits
   * - UDP: sum_received contains actual received data (~51 Mbps),
   *        sum contains reported test bandwidth (~948 Mbps)
   *
   * In older versions (Ubuntu):
   * - TCP: sum contains both bps and retransmits
   * - UDP: sum contains all metrics (bps, jitter, packet loss)
   */

  // For UDP tests with newer iPerf (Mac), we want to use sum.bits_per_second
  // For TCP tests with newer iPerf, we want to use sum_received.bits_per_second
  // For all tests with older iPerf (Ubuntu), we want to use sum.bits_per_second
  const bitsPerSecond = isNewVersion
    ? isUdp
      ? end.sum?.bits_per_second || 0
      : end.sum_received!.bits_per_second
    : end.sum?.bits_per_second || 0;

  if (!bitsPerSecond) {
    throw new Error(
      "No bits per second found in iperf results. This is fatal.",
    );
  }

  const retransmits = isNewVersion
    ? end.sum_sent?.retransmits || 0
    : end.sum?.retransmits || 0;

  return {
    bitsPerSecond,
    retransmits,

    // UDP metrics - only relevant for UDP tests
    // These fields will be null for TCP tests
    jitterMs: isUdp ? end.sum?.jitter_ms || null : null,
    lostPackets: isUdp ? end.sum?.lost_packets || null : null,
    packetsReceived: isUdp ? end.sum?.packets || null : null,
    signalStrength: 0,
  };
}
