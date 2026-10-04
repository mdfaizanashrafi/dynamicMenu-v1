import type { RequestHandler } from "express";
import multer from "multer";
import { ApiError } from "../utils/api-error.js";

/** Accepted image formats and the extension used when storing the file. */
export const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Multipart handler for a single `file` field. Mimetype and size are
 * validated here; storage happens in the route via the ImageStorage service.
 */
export const uploadImage: RequestHandler = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in IMAGE_EXTENSIONS) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          400,
          "INVALID_FILE_TYPE",
          "Only JPEG, PNG or WebP images are allowed."
        )
      );
    }
  },
}).single("file");

/** Extension for a multer-validated mimetype (throws defensively otherwise). */
export function extensionFor(mimetype: string): string {
  const extension = IMAGE_EXTENSIONS[mimetype];
  if (!extension) {
    // Unreachable: the fileFilter gates mimetypes. Defensive, not trusted.
    throw new ApiError(
      400,
      "INVALID_FILE_TYPE",
      "Only JPEG, PNG or WebP images are allowed."
    );
  }
  return extension;
}
