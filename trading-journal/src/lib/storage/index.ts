import { S3Client } from "@aws-sdk/client-s3";

if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_ENDPOINT_URL_S3 ||
  !process.env.AWS_REGION
) {
  throw new Error("Missing Neon Object Storage environment variables");
}

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // required for Neon Object Storage (path-style only)
});

export const ASSETS_BUCKET = "assets";
