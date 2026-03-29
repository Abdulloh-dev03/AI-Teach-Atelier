import { Router } from "express";
import { auth } from "#src/middleware/auth.middleware.js";
import { deleteUserSession, getAllSession, getSessionById, sendMessageByUser } from "#src/controllers/chat.controller.js";


const router = Router();

// All chat routes require auth
router.use(auth);

router.post("/", sendMessageByUser);
router.get("/", getAllSession);
router.get("/:sessionId", getSessionById);
router.delete("/:sessionId", deleteUserSession);

export default router;