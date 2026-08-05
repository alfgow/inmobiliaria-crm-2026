import {
  DeleteFacesCommand,
  IndexFacesCommand,
  RekognitionClient,
  SearchFacesByImageCommand,
} from "@aws-sdk/client-rekognition";

const rekognition = new RekognitionClient({
  region: process.env.AWS_REKOGNITION_REGION ?? process.env.AWS_DEFAULT_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const COLLECTION_ID = process.env.AWS_REKOGNITION_COLLECTION_ID!;

export interface IndexedFace {
  faceId: string;
  confidence: number;
}

/**
 * Indexa una foto de rostro en la Collection de Rekognition. No persiste la
 * imagen en ningun lado: Rekognition guarda internamente el vector facial,
 * no la imagen original.
 */
export async function indexFace(
  imageBytes: Uint8Array,
  externalImageId: string,
): Promise<IndexedFace> {
  const result = await rekognition.send(
    new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBytes },
      ExternalImageId: externalImageId,
      MaxFaces: 1,
      QualityFilter: "AUTO",
      DetectionAttributes: [],
    }),
  );

  const record = result.FaceRecords?.[0];
  if (!record?.Face?.FaceId) {
    throw new Error("NO_FACE_DETECTED");
  }

  return {
    faceId: record.Face.FaceId,
    confidence: record.Face.Confidence ?? 0,
  };
}

export interface FaceMatch {
  faceId: string;
  externalImageId: string;
  similarity: number;
}

/**
 * Busca la foto capturada contra la Collection. Devuelve null si no hay
 * ningun rostro con similitud >= faceMatchThreshold (o si la imagen no tiene
 * un rostro detectable).
 */
export async function searchFaceByImage(
  imageBytes: Uint8Array,
  faceMatchThreshold = 97,
): Promise<FaceMatch | null> {
  try {
    const result = await rekognition.send(
      new SearchFacesByImageCommand({
        CollectionId: COLLECTION_ID,
        Image: { Bytes: imageBytes },
        MaxFaces: 1,
        FaceMatchThreshold: faceMatchThreshold,
      }),
    );

    const match = result.FaceMatches?.[0];
    if (!match?.Face?.FaceId || !match.Face.ExternalImageId || match.Similarity == null) {
      return null;
    }

    return {
      faceId: match.Face.FaceId,
      externalImageId: match.Face.ExternalImageId,
      similarity: match.Similarity,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "InvalidParameterException") {
      return null;
    }
    throw error;
  }
}

export async function deleteFace(faceId: string): Promise<void> {
  await rekognition.send(
    new DeleteFacesCommand({ CollectionId: COLLECTION_ID, FaceIds: [faceId] }),
  );
}
