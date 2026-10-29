import { S3Client } from "@aws-sdk/client-s3";

function getCredentials() {
  const accessKeyId =
    process.env.STORAGE_ACCESS_KEY_ID ||
    process.env.S3_ACCESS_KEY_ID ||
    process.env.APP_AWS_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID;

  const secretAccessKey =
    process.env.STORAGE_SECRET_ACCESS_KEY ||
    process.env.S3_SECRET_ACCESS_KEY ||
    process.env.APP_AWS_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY;

  const endpoint =
    process.env.STORAGE_ENDPOINT_URL ||
    process.env.S3_ENDPOINT_URL ||
    process.env.APP_AWS_ENDPOINT_URL_S3 ||
    process.env.AWS_ENDPOINT_URL_S3;

  const region =
    process.env.STORAGE_REGION ||
    process.env.S3_REGION ||
    process.env.APP_AWS_REGION ||
    process.env.AWS_REGION ||
    "us-east-1";

  return { accessKeyId, secretAccessKey, endpoint, region };
}

let cachedS3: S3Client | null = null;

export function getS3Client(): S3Client {
  if (cachedS3) return cachedS3;

  const { accessKeyId, secretAccessKey, endpoint, region } = getCredentials();
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing Object Storage environment variables (STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY)"
    );
  }

  cachedS3 = new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    credentials: { accessKeyId, secretAccessKey },
  });

  return cachedS3;
}

export const s3 = new Proxy({} as S3Client, {
  get(_target, prop) {
    const client = getS3Client();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export const ASSETS_BUCKET = process.env.STORAGE_BUCKET || process.env.S3_BUCKET || "assets";
