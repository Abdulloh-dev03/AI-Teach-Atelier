import type { Response, NextFunction } from "express";
import type { AuthRequest } from "#src/types/auth.js";
import { updateProfilePic } from "#src/services/user.service.js";
import { prisma } from "#src/lib/prisma.js";
import logger from "#src/config/logger.js";

/**
 * PUT /api/user/profile-pic
 *
 * Accepts a single image file uploaded via multipart/form-data with the field
 * name "profilePic". Requires `auth` middleware – req.user must be present.
 */
export const uploadProfilePicController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Validate that a file was actually received
    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    const userId = req.user!.id;

    // 2. Fetch the current profilePic URL so we can delete it after the upload
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePic: true },
    });

    // 3. Delegate to service (Cloudinary upload + DB update)
    const newUrl = await updateProfilePic(
      userId,
      req.file.buffer,
      req.file.mimetype,
      currentUser?.profilePic ?? null,
    );

    logger.info(`Profile picture updated for user ${userId}`);

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePic: newUrl,
    });
  } catch (err) {
    logger.error("uploadProfilePicController error:", err);
    next(err);
  }
};
