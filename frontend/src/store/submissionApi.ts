import { api } from "./api";
import { Result } from "./problemApi";

export interface SubmissionResponse {
  submissionId?: string;
  id?: string;
  status: "ACCEPTED" | "WRONG_ANSWER" | "RUNTIME_ERROR" | "TIME_LIMIT_EXCEEDED" | "Passed" | "Wrong Answer";
  verdict?: "ACCEPTED" | "WRONG_ANSWER" | "RUNTIME_ERROR" | "TIME_LIMIT_EXCEEDED" | "COMPILATION_ERROR" | "MEMORY_LIMIT_EXCEEDED" | "OUTPUT_LIMIT_EXCEEDED" | "INTERNAL_ERROR";
  passed: number;
  total: number;
  runtime?: number;
  runtimeMs?: number;
  results?: Result[];
  testResults?: any[];
  details?: Result[]; 
  createdAt?: string;
  problem?: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
  };
  code?: string;
  language: string;
}

export interface PaginatedSubmissions {
  data: SubmissionResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RunCodeRequest {
  code: string;
  language: string;
  testCases: Array<{ input: string; expected: string }>;
}

export const submissionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSubmissions: builder.query<PaginatedSubmissions, { page?: number; limit?: number; problemId?: string } | void>({
      query: (params) => ({
        url: "/submissions",
        params: params || undefined,
      }),
      providesTags: ["Submission"],
    }),
    getSubmissionDetails: builder.query<SubmissionResponse, string>({
      query: (id) => `/submissions/${id}`,
      providesTags: (result, error, id) => [{ type: "Submission", id }],
    }),
  }),
});

export const {
  useGetSubmissionsQuery,
  useGetSubmissionDetailsQuery,
} = submissionApi;
