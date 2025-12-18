/*
 * wifi-heatmapper
 * File: src/lib/actions.ts
 * Library helper used by server and client code.
 * Generated: 2025-12-18T10:28:20.555Z
 */

/**
 * Server-Side Actions
 */

"use server";
import path from "path";
import fs from "fs/promises";

// import { getLogger } from "./logger";
// const logger = getLogger("actions");

/**
 * const uploadImage = async — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export const uploadImage = async (dbPath: string, formData: FormData) => {
  const file = formData.get("file") as File;
  const fileName = file.name;
  const uploadDir = path.join(process.cwd(), "public", "media");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(
    path.join(uploadDir, fileName),
    Buffer.from(await file.arrayBuffer()),
  );
};

/**
 * async function copyToMediaFolder — exported symbol.
 *
 * TODO: replace this generic description with a concise comment.
 */
export async function copyToMediaFolder(filename: string) {
  const srcPath = path.join(process.cwd(), "public", filename);
  const destPath = path.join(process.cwd(), "public", "media", filename);

  // Ensure media directory exists
  await fs.mkdir(path.dirname(destPath), { recursive: true });

  // Copy file (will overwrite if it exists)
  await fs.copyFile(srcPath, destPath);
}
