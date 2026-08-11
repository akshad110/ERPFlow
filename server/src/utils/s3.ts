import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
};

export const getS3Client = () => {
  return new S3Client({
    region: getRequiredEnv("AWS_REGION"),
    credentials: {
      accessKeyId: getRequiredEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });
};

export const getPublicS3Url = (key: string): string => {
  const bucket = getRequiredEnv("AWS_S3_BUCKET");
  const region = getRequiredEnv("AWS_REGION");
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

export const uploadProductImageToS3 = async (file: {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}): Promise<{ key: string; url: string }> => {
  const bucket = getRequiredEnv("AWS_S3_BUCKET");
  const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
  const key = `products/${crypto.randomUUID()}${extension}`;

  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return {
    key,
    url: getPublicS3Url(key),
  };
};

export const deleteObjectFromS3 = async (imageUrl: string): Promise<void> => {
  try {
    const bucket = getRequiredEnv("AWS_S3_BUCKET");
    const region = getRequiredEnv("AWS_REGION");
    const prefix = `https://${bucket}.s3.${region}.amazonaws.com/`;

    if (!imageUrl.startsWith(prefix)) {
      return;
    }

    const key = imageUrl.slice(prefix.length);
    const client = getS3Client();

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch (error) {
    console.error("Failed to delete S3 object:", error);
  }
};
