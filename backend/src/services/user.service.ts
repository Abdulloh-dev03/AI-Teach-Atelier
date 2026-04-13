import { prisma } from "#src/lib/prisma.js";
import cloudinary from "#src/utils/cloudinary.js";
import logger from "#src/config/logger.js";

const PROFILE_PIC_FOLDER = "profile-pics";

/**
 * Extracts the Cloudinary public_id from a secure_url so we can delete it.
 * Example URL:
 *   https://res.cloudinary.com/<cloud>/image/upload/v123456/profile-pics/abc.jpg
 * → public_id: "profile-pics/abc"
 */
function extractPublicId(url: string): string | null {
  try {
    // Strip everything up to and including "/upload/"
    const uploadIdx = url.indexOf("/upload/");
    if (uploadIdx === -1) return null;
    const afterUpload = url.slice(uploadIdx + "/upload/".length);
    // Strip optional version segment (v<digits>/)
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    // Strip file extension
    const withoutExt = withoutVersion.replace(/\.[^/.]+$/, "");
    return withoutExt;
  } catch {
    return null;
  }
}

/**
 * Uploads a new profile picture buffer to Cloudinary, removes the old one if
 * present, then persists the new secure_url in the database.
 *
 * @param userId         - The authenticated user's ID (for the DB update)
 * @param fileBuffer     - Raw file bytes from multer memory storage
 * @param mimeType       - Original MIME type (used to set the upload resource_type)
 * @param currentPicUrl  - Existing profilePic URL (used to delete the old image)
 * @returns              - The new profilePic URL stored in the DB
 */
export const updateProfilePic = async (
  userId: string,
  fileBuffer: Buffer,
  mimeType: string,
  currentPicUrl: string | null,
): Promise<string> => {
  // 1. Upload new image to Cloudinary (base64 data URI)
  const base64 = fileBuffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: PROFILE_PIC_FOLDER,
    resource_type: "image",
    // Optimization: resize to max 400×400, compress quality to auto
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });

  logger.info(`Profile pic uploaded to Cloudinary: ${uploadResult.public_id}`);

  // 2. Delete old image from Cloudinary (best-effort – don't fail the upload)
  if (currentPicUrl) {
    const oldPublicId = extractPublicId(currentPicUrl);
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
        logger.info(`Old profile pic deleted: ${oldPublicId}`);
      } catch (err) {
        logger.warn(`Could not delete old profile pic (${oldPublicId}):`, err);
      }
    }
  }

  // 3. Persist new URL in DB
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { profilePic: uploadResult.secure_url },
    select: { profilePic: true },
  });

  return updatedUser.profilePic!;
};
