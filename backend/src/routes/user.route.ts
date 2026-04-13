import { Router } from "express";
import { auth } from "#src/middleware/auth.middleware.js";
import { uploadProfilePic } from "#src/middleware/upload.middleware.js";
import { uploadProfilePicController } from "#src/controllers/user.controller.js";

const router = Router();

/**
 * PUT /api/user/profile-pic
 * Auth required. Accepts multipart/form-data with field "profilePic".
 * File constraints: images only, max 2 MB.
 */
router.put(
  "/profile-pic",
  auth,
  uploadProfilePic.single("profilePic"),
  uploadProfilePicController,
);

export default router;
