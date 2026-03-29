import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const api_url = process.env.NEXT_PUBLIC_API_URL;

if (!api_url && typeof window !== 'undefined') {
  console.error("Warning: NEXT_PUBLIC_API_URL is missing. API calls may fail.");
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: api_url,
    credentials: "include",
  }),
  tagTypes: ["User", "Problem", "Submission", "Session"],
  endpoints: () => ({}),
});
