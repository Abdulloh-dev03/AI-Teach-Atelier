import { Request, Response } from "express";
import cloudinary from "#src/utils/cloudinary.js";


export const getSignature = async (req: Request, res: Response) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: "chat-images",
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    res.json({
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: "chat-images",
    });
  } catch (error) {
    res.status(500).json({ error: "Signature generation failed" });
  }
};