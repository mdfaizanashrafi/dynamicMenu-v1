import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

export interface StoredImage {
  /** Absolute URL that can be rendered by clients. */
  url: string;
}

/**
 * Image storage abstraction per ARCHITECTURE.md §28 (images never live in
 * PostgreSQL). The default provider writes to local disk, which suits local
 * development and CI; a future S3/Cloudinary provider implements the same
 * interface without touching call sites.
 */
export interface ImageStorage {
  saveImage(input: { buffer: Buffer; extension: string }): Promise<StoredImage>;
}

export class LocalDiskStorage implements ImageStorage {
  async saveImage({ buffer, extension }: { buffer: Buffer; extension: string }) {
    const dir = path.resolve(env.UPLOAD_DIR);
    await mkdir(dir, { recursive: true });
    const filename = `${randomBytes(8).toString("hex")}-${Date.now()}.${extension}`;
    await writeFile(path.join(dir, filename), buffer);
    return { url: `${env.API_BASE_URL}/uploads/${filename}` };
  }
}

export const imageStorage: ImageStorage = new LocalDiskStorage();
