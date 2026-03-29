import { api } from "./api";

import { Message } from "@/components/chat/types";

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

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<SessionsResponse, void>({
      query: () => "/chat",
      providesTags: ["Session"],
    }),
    getSession: builder.query<Session, string>({
      query: (sessionId) => `/chat/${sessionId}`,
      providesTags: (result, error, sessionId) => [{ type: "Session", id: sessionId }],
    }),
    sendMessage: builder.mutation<{ sessionId: string; content: string }, { content: string; aiModel: string; sessionId?: string }>({
      query: (body) => ({
        url: "/chat",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Session"],
    }),
    deleteSession: builder.mutation<{ success: boolean; message: string }, string>({
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
} = chatApi;
