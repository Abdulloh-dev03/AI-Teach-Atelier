import { prisma } from "#src/lib/prisma.js";
import { ChatMessageType } from "#src/types/ai.js";
import { InferenceClient } from "@huggingface/inference";

const MODEL_MAP = {
  kimi: "moonshotai/Kimi-K2.5:fastest",
  qwen: "Qwen/Qwen3.5-35B-A3B:fastest",
  gemma: "google/gemma-4-31B-it:fastest",
};

export type ModelChoice = keyof typeof MODEL_MAP;

const getClient = (): InferenceClient => {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("HF_TOKEN is not set in environment variables");
  return new InferenceClient(token);
};

export const sendMessage = async (
  userId: string,
  content: string,
  aiModel: ModelChoice,
  sessionId?: string,
  imageUrl?: string,
) => {
  try {
    let session;
    if (sessionId) {
      session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!session) throw new Error("Session not found");
    } else {
      session = await prisma.chatSession.create({
        data: { userId, title: content.slice(0, 50) },
        include: { messages: true },
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "USER",
        content,
        imageUrl: imageUrl ?? null,
      },
    });

    // Reconstruct conversation history safely
    const history: ChatMessageType[] = session.messages.slice(-20).map((m) => ({
      role: m.role === "USER" ? "user" : "assistant",
      content: m.imageUrl
        ? [
            { type: "text", text: m.content },
            { type: "image_url", image_url: { url: m.imageUrl } },
          ]
        : [{ type: "text", text: m.content }],
    }));

    history.push({
      role: "user",
      content: imageUrl
        ? [
            { type: "text" as const, text: content },
            { type: "image_url" as const, image_url: { url: imageUrl } },
          ]
        : [{ type: "text" as const, text: content }],
    });

    const client = getClient();
    const model = MODEL_MAP[aiModel];

    // FIX: Drastically increase max_tokens so responses don't get truncated
    const response = await client.chatCompletion({
      model,
      messages: history as any,
      max_tokens: 2048, // Upgraded from 512 to handle deep code breakdowns completely
      temperature: 0.7,
    });

    const aiResponse =
      response?.choices?.[0]?.message?.content?.trim() ??
      "Sorry, I couldn't generate a response.";

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "ASSISTANT",
        content: aiResponse,
      },
    });

    return { sessionId: session.id, content: aiResponse, messageId: assistantMessage.id };
  } catch (error: any) {
    console.error("HF chatCompletion error:", error?.response?.data || error.message);
    throw error;
  }
};

export const regenerateResponse = async (
  userId: string,
  sessionId: string,
  aiModel: ModelChoice,
) => {
  try {
    let session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!session) throw new Error("Session not found");

    const messages = session.messages;
    let lastAssistantIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "ASSISTANT") { lastAssistantIndex = i; break; }
    }

    if (lastAssistantIndex === -1) {
      throw new Error("No AI response to regenerate");
    }

    // Delete old AI response
    await prisma.chatMessage.delete({
      where: { id: messages[lastAssistantIndex].id },
    });

    // Refresh session
    session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) throw new Error("Session not found after refresh");

    const history: ChatMessageType[] = session.messages.map((m) => ({
      role: m.role === "USER" ? "user" : "assistant",
      content: m.imageUrl
        ? [
            { type: "text", text: m.content },
            { type: "image_url", image_url: { url: m.imageUrl } },
          ]
        : [{ type: "text", text: m.content }],
    }));

    const client = getClient();
    const model = MODEL_MAP[aiModel];

    const response = await client.chatCompletion({
      model,
      messages: history as any,
      max_tokens: 2048,
      temperature: 0.7,
    });

    const aiResponse =
      response?.choices?.[0]?.message?.content?.trim() ??
      "Sorry, I couldn't generate a response.";

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "ASSISTANT",
        content: aiResponse,
      },
    });

    return { sessionId: session.id, message: assistantMessage };
  } catch (error: any) {
    console.error("Regenerate error:", error);
    throw error;
  }
};

export const editUserMessage = async (
  userId: string,
  messageId: string,
  newContent: string,
  aiModel: ModelChoice,
) => {
  try {
    const message = await prisma.chatMessage.findFirst({
      where: { id: messageId },
      include: { session: true },
    });

    if (!message || message.session.userId !== userId) {
      throw new Error("Message not found or unauthorized");
    }
    if (message.role !== "USER") {
      throw new Error("Only user messages can be edited");
    }

    // Update user message
    const updatedUserMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { content: newContent },
    });

    // Auto-regenerate AI response using the same logic
    const regenerateResult = await regenerateResponse(userId, message.session.id, aiModel);
    
    return {
      sessionId: message.session.id,
      userMessage: updatedUserMessage,
      message: regenerateResult.message
    };
  } catch (error) {
    throw error;
  }
};

export const getSessions = async (userId: string) => {
  return await prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
};

export const getSession = async (userId: string, sessionId: string) => {
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) throw new Error("Session not found");
  return session;
};

export const deleteSession = async (userId: string, sessionId: string) => {
  const session = await prisma.chatSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw new Error("Session not found");

  await prisma.chatMessage.deleteMany({ where: { sessionId } });
  await prisma.chatSession.delete({ where: { id: sessionId } });

  return { success: true, message: "Session deleted successfully" };
};