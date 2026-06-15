import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_DEFAULT_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_BUCKET!;
const REGION = process.env.AWS_DEFAULT_REGION!;

export function getPublicImageUrl(s3Key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;
}

export async function getUploadUrl(
  s3Key: string,
  contentType: string,
  expiresIn = 300,
): Promise<string> {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: s3Key, ContentType: contentType });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function uploadObject(
  s3Key: string,
  body: Uint8Array<ArrayBufferLike> | Buffer,
  contentType: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteObject(s3Key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }));
}
