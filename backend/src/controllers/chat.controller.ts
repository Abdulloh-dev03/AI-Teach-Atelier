import logger from "#src/config/logger.js";
import {  deleteSession, getSession, getSessions, sendMessage } from "#src/services/chat.service.js";
import type { Response } from "express";
import type { AuthRequest } from "#src/types/auth.js";

export const sendMessageByUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { content, aiModel, sessionId } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }
    if (!aiModel) {
      return res.status(400).json({ error: "AI model is required" });
    }
    const result = await sendMessage(userId, content, aiModel, sessionId);
    logger.info(`Message sent successfully by user ${userId}`);
    return res.status(200).json(result);
  } catch (error) {
    logger.error("Message sent failed", error);
    return res.status(500).json({ error: "Message sent failed" });
  }
};


export const getAllSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const sessions = await getSessions(userId);
    logger.info(`Sessions fetched successfully by user ${userId}`);
    return res.status(200).json({sessions, count: sessions.length});
  } catch (error) {
    logger.error("Sessions fetched failed", error);
    return res.status(500).json({ error: "Sessions fetched failed" });
  }
};


export const getSessionById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const sessionId = req.params.sessionId as string;
    const session = await getSession(userId, sessionId);
    logger.info(`Session fetched successfully by user ${userId}`);
    return res.status(200).json(session);
  } catch (error: any) {
    logger.error("Session fetched failed", error);
    const status = error.message === "Session not found" ? 404 : 500;
    return res.status(status).json({ error: error.message });
  }
};

export const deleteUserSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const sessionId = req.params.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const session = await deleteSession(userId, sessionId);
    logger.info(`Session deleted successfully by user ${userId}`);
    return res.status(200).json(session);
  } catch (error: any) {
    logger.error("Session delete failed", error);
    const status = error.message === "Session not found" ? 404 : 500;
    return res.status(status).json({ error: error.message });
  }
};