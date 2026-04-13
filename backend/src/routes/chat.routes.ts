import { Router } from "express";
import { auth } from "#src/middleware/auth.middleware.js";
import { deleteUserSession, editUserMessageController, getAllSession, getSessionById, regenerateResponseController, sendMessageByUser } from "#src/controllers/chat.controller.js";


const router = Router();

// All chat routes require auth
router.use(auth);

router.post("/", sendMessageByUser);
router.get("/", getAllSession);
router.get("/:sessionId", getSessionById);
router.put("/messages/:messageId", editUserMessageController);
router.post("/sessions/:sessionId/regenerate", regenerateResponseController);
router.delete("/:sessionId", deleteUserSession);

export default router;