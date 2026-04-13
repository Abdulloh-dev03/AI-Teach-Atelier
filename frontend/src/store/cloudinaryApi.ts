import { api } from "./api";

interface SignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
}

export const cloudinaryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadImage: builder.mutation<string, File>({
      queryFn: async (file, _queryApi, _extraOptions, baseQuery) => {
        try {
          // 1. Get signature from backend
          const signatureResult = await baseQuery("/cloudinary/signature");
          if (signatureResult.error) return { error: signatureResult.error as any };
          
          const { signature, timestamp, cloudName, apiKey } = signatureResult.data as SignatureResponse;

          // 2. Upload to Cloudinary
          const formData = new FormData();
          formData.append("file", file);
          formData.append("api_key", apiKey);
          formData.append("timestamp", timestamp.toString());
          formData.append("signature", signature);
          formData.append("folder", "chat-images");

          const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
          const response = await fetch(cloudinaryUrl, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            return { error: { status: response.status, data: error } };
          }

          const data = await response.json();
          return { data: data.secure_url };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
    }),
  }),
});

export const { useUploadImageMutation } = cloudinaryApi;
