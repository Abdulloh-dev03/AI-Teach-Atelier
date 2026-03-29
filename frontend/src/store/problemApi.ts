import { api } from "./api";
import { SubmissionResponse, RunCodeRequest } from "./submissionApi";

export interface TestCase {
  id: string;
  input: string;
  expected: string;
  isHidden: boolean;
  problemId: string;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  language: string;
  createdAt: string;
  requestedById: string;
  testCases: TestCase[];
  submissions: Array<{
    status:
      | "ACCEPTED"
      | "WRONG_ANSWER"
      | "RUNTIME_ERROR"
      | "TIME_LIMIT_EXCEEDED";
  }>;
}

export interface Result {
  input: string | null;
  expected: string | null;
  received: string | null;
  stderr: string | null;
  isHidden: boolean;
  status: "Passed" | "Wrong Answer" | "Runtime Error" | "Time Limit Exceeded";
}

export interface GenerateProblemRequest {
  language:
    | "javascript"
    | "typescript"
    | "python"
    | "cpp"
    | "java"
    | "c"
    | "go";
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

export interface GenerateProblemResponse {
  message: string;
  remainingToday: number;
  problem: Problem;
}

export interface SubmitSolutionRequest {
  id: string;
  code: string;
  language: string;
}

export const problemApi = api.injectEndpoints({
  endpoints: (builder) => ({
    generateProblem: builder.mutation<
      GenerateProblemResponse,
      GenerateProblemRequest
    >({
      query: (body) => ({
        url: "/problems/generate",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Problem", "User"],
    }),
    getMyProblems: builder.query<Problem[], void>({
      query: () => "/problems/my",
      providesTags: ["Problem"],
    }),
    getProblemById: builder.query<Problem, string>({
      query: (id) => `/problems/${id}`,
      providesTags: (result, error, id) => [{ type: "Problem", id }],
    }),
    submitSolution: builder.mutation<SubmissionResponse, SubmitSolutionRequest>(
      {
        query: ({ id, ...body }) => ({
          url: `/problems/${id}/submit`,
          method: "POST",
          body,
        }),
        invalidatesTags: (result, error, arg) => [
          { type: "Submission", id: arg.id },
          { type: "Problem", id: arg.id },
        ],
      },
    ),
    deleteProblem: builder.mutation<void, string>({
      query: (id) => ({
        url: `/problems/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Problem", "User"],
    }),
    runCode: builder.mutation<any, RunCodeRequest>({
      query: (body) => ({
        url: "/run", // Corrected endpoint as per executeRoutes.ts
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGenerateProblemMutation,
  useGetMyProblemsQuery,
  useGetProblemByIdQuery,
  useSubmitSolutionMutation,
  useDeleteProblemMutation,
  useRunCodeMutation,
} = problemApi;
