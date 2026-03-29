import { api } from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  remainingToday: number;
}

interface AuthResponse {
  message: string;
  user: User;
}

interface ProfileResponse {
  user: User;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    signUp: builder.mutation<User, any>({
      query: (body) => ({
        url: "/auth/sign-up",
        method: "POST",
        body,
      }),
      transformResponse: (response: AuthResponse) => response.user,
      invalidatesTags: ["User"],
    }),
    signIn: builder.mutation<User, any>({
      query: (body) => ({
        url: "/auth/sign-in",
        method: "POST",
        body,
      }),
      transformResponse: (response: AuthResponse) => response.user,
      invalidatesTags: ["User"],
    }),
    signOut: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/sign-out",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
    getProfile: builder.query<User, void>({
      query: () => "/auth/profile",
      transformResponse: (response: ProfileResponse) => response.user,
      providesTags: ["User"],
    }),
  }),
});

export const {
  useSignUpMutation,
  useSignInMutation,
  useSignOutMutation,
  useGetProfileQuery,
} = authApi;
