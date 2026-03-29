import { prisma } from "#src/lib/prisma.js";
import { InferenceClient } from "@huggingface/inference";

const MODEL_MAP = {
  qwen: "Qwen/Qwen2.5-7B-Instruct:together",
  llama: "meta-llama/Meta-Llama-3-8B-Instruct:novita",
  openai: "openai/gpt-oss-20b:together",
};

type ModelChoice = keyof typeof MODEL_MAP;

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
) => {
  try {
    if (!aiModel) {
      throw new Error("AI model is not found");
    }

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
      data: { sessionId: session.id, role: "USER", content },
    });

    // Build chat history (last 20 messages)
    const history = session.messages.slice(-20).map((m) => ({
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content,
    }));

    // Add current message
    history.push({ role: "user", content });

    const client = getClient();
    const result = MODEL_MAP[aiModel];

    if (!result) {
      throw new Error(`Invalid model: ${aiModel}`);
    }

    // 🔥 IMPORTANT: result should include provider like ":together"
    // Example: "Qwen/Qwen2.5-7B-Instruct:together"

    const response = await client.chatCompletion({
      model: result,
      messages: history,
      max_tokens: 512, // optional but usually works
      temperature: 0.7,
    });

    const aiResponse =
      response.choices?.[0]?.message?.content?.trim() || "";

    // Save AI response
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "ASSISTANT",
        content: aiResponse,
      },
    });

    return { sessionId: session.id, content: aiResponse };
  } catch (error: any) {
    console.error("HF chatCompletion error:", error?.response?.data || error.message);
    throw error;
  }
};

export const getSessions = async (userId: string) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    return sessions;
  } catch (error) {
    throw error;
  }
};

export const getSession = async (userId: string, sessionId: string) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!session) throw new Error("Session not found");
    return session;
  } catch (error) {
    throw error;
  }
};

export const deleteSession = async (userId: string, sessionId: string) => {
  try {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) throw new Error("Session not found");

    await prisma.chatMessage.deleteMany({ where: { sessionId } });
    await prisma.chatSession.delete({ where: { id: sessionId } });

    return { success: true, message: "Session deleted successfully" };
  } catch (error) {
    throw error;
  }
};
