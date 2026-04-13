import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    // Route all browser API calls through Next/Vercel rewrites so auth cookies
    // stay same-site and deployment does not depend on a public localhost URL.
    baseUrl: "/api",
    credentials: "include",
  }),
  tagTypes: ["User", "Problem", "Submission", "Session"],
  endpoints: () => ({}),
});
