import { api } from "./api";

import { Message } from "@/components/chat/types";

type ApiMessageRole = Message["role"] | "USER" | "ASSISTANT";

interface ApiMessage {
  id?: string;
  role: ApiMessageRole;
  content: string;
  createdAt?: string;
  timestamp?: string;
  imageUrl?: string | null;
  code?: string;
  footer?: string;
}

export interface Session {
  id: string;
  title: string;
  userId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionsResponse {
  sessions: Session[];
  count: number;
}

interface ApiSession {
  id: string;
  title: string | null;
  userId: string;
  messages: ApiMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ApiSessionsResponse {
  sessions: ApiSession[];
  count: number;
}

interface SendMessageRequest {
  content: string;
  aiModel: string;
  sessionId?: string;
  imageUrl?: string;
}

interface SendMessageResponse {
  sessionId: string;
  content: string;
}

const normalizeMessageRole = (role: ApiMessageRole): Message["role"] =>
  role === "USER" || role === "user" ? "user" : "assistant";

const normalizeMessage = (message: ApiMessage): Message => {
  const createdAt = message.createdAt ?? message.timestamp ?? new Date().toISOString();

  return {
    id: message.id,
    role: normalizeMessageRole(message.role),
    content: message.content,
    createdAt,
    timestamp: createdAt,
    imageUrl: message.imageUrl ?? undefined,
    code: message.code,
    footer: message.footer,
  };
};

const normalizeSession = (session: ApiSession): Session => ({
  ...session,
  title: session.title ?? "Untitled Session",
  messages: session.messages.map(normalizeMessage),
});

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<SessionsResponse, void>({
      query: () => "/chat",
      transformResponse: (response: ApiSessionsResponse): SessionsResponse => ({
        ...response,
        sessions: response.sessions.map(normalizeSession),
      }),
      providesTags: ["Session"],
    }),
    getSession: builder.query<Session, string>({
      query: (sessionId) => `/chat/${sessionId}`,
      transformResponse: (response: ApiSession): Session =>
        normalizeSession(response),
      providesTags: (result, error, sessionId) => [
        { type: "Session", id: sessionId },
      ],
    }),
    sendMessage: builder.mutation<SendMessageResponse, SendMessageRequest>({
      query: (body) => ({
        url: "/chat",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { sessionId }) =>
        sessionId ? ["Session", { type: "Session", id: sessionId }] : ["Session"],
      async onQueryStarted(
        { content, sessionId, imageUrl },
        { dispatch, queryFulfilled },
      ) {
        if (!sessionId) {
          return;
        }

        const now = new Date().toISOString();
        const optimisticUserId = `temp-user-${now}`;
        const optimisticAssistantId = `temp-assistant-${now}`;

        const sessionPatch = dispatch(
          chatApi.util.updateQueryData("getSession", sessionId, (draft) => {
            draft.messages.push({
              id: optimisticUserId,
              role: "user",
              content,
              imageUrl,
              createdAt: now,
              timestamp: now,
            });
            draft.messages.push({
              id: optimisticAssistantId,
              role: "assistant",
              content: "",
              createdAt: now,
              timestamp: now,
            });
            draft.updatedAt = now;
          }),
        );

        const sessionsPatch = dispatch(
          chatApi.util.updateQueryData("getSessions", undefined, (draft) => {
            const activeSession = draft.sessions.find(
              (session) => session.id === sessionId,
            );

            if (!activeSession) {
              return;
            }

            activeSession.updatedAt = now;
            if (!activeSession.title?.trim()) {
              activeSession.title = content.slice(0, 50) || "Untitled Session";
            }
          }),
        );

        try {
          const { data } = await queryFulfilled;

          dispatch(
            chatApi.util.updateQueryData("getSession", sessionId, (draft) => {
              const assistantMessage = draft.messages.find(
                (message) => message.id === optimisticAssistantId,
              );

              if (assistantMessage) {
                assistantMessage.content = data.content;
              }
            }),
          );
        } catch {
          sessionPatch.undo();
          sessionsPatch.undo();
        }
      },
    }),
    editMessage: builder.mutation({
      query: ({ messageId, content, aiModel }) => ({
        url: `/chat/messages/${messageId}`,
        method: "PUT",
        body: { content, aiModel },
      }),
      invalidatesTags: ["Session"],
    }),

    regenerate: builder.mutation({
      query: ({ sessionId, aiModel }) => ({
        url: `/chat/sessions/${sessionId}/regenerate`,
        method: "POST",
        body: { aiModel },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
      ],
    }),
    deleteSession: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (sessionId) => ({
        url: `/chat/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Session"],
    }),
  }),
});

export const {
  useGetSessionsQuery,
  useGetSessionQuery,
  useSendMessageMutation,
  useDeleteSessionMutation,
  useEditMessageMutation,
  useRegenerateMutation,
} = chatApi;
