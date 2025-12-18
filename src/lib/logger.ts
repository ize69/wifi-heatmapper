/*
 * wifi-heatmapper
 * File: src/lib/logger.ts
 * Library helper used by server and client code.
 * Generated: 2025-12-18T10:28:20.555Z
 */

import { Logger } from "tslog";

const rootLogger = new Logger({
  name: "root",
  // 0: silly, 1: trace, 2: debug, 3: info, 4: warn, 5: error, 6: fatal
  minLevel: parseInt(process.env.LOG_LEVEL || "3"),
  hideLogPositionForProduction: true,
  prettyLogTemplate: "[{{rawIsoStr}}] [{{name}}:{{logLevelName}}] ",
  stylePrettyLogs: false,
});

/**
 * function getLogger — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export function getLogger(name: string) {
  return rootLogger.getSubLogger({ name });
}
