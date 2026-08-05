"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/features/auth/lib/current-user";
import { parseFaceImageDataUrl } from "@/features/auth/lib/face-image";
import { toExternalImageId } from "@/features/auth/lib/face-identity";
import { deleteFace, indexFace } from "@/lib/rekognition";
import { prisma } from "@/lib/prisma";

export type EnrollFaceActionState = {
  success: boolean;
  message: string;
};

export async function enrollFace(
  _previousState: EnrollFaceActionState,
  formData: FormData,
): Promise<EnrollFaceActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, message: "Tu sesion expiro. Vuelve a iniciar sesion." };
  }

  if (formData.get("consent") !== "on") {
    return {
      success: false,
      message: "Debes aceptar el uso de tu rostro para autenticacion antes de continuar.",
    };
  }

  const parsedImage = parseFaceImageDataUrl(formData.get("image"));
  if (!parsedImage) {
    return { success: false, message: "No se pudo leer la foto capturada. Intenta de nuevo." };
  }

  let indexed;
  try {
    indexed = await indexFace(parsedImage.bytes, toExternalImageId(user.id));
  } catch (error) {
    if (error instanceof Error && error.message === "NO_FACE_DETECTED") {
      return {
        success: false,
        message: "No se detecto un rostro claro en la foto. Intenta con mejor iluminacion.",
      };
    }
    console.error("enrollFace indexFace error:", error);
    return { success: false, message: "No fue posible procesar la foto. Intenta de nuevo." };
  }

  const userId = BigInt(user.id);
  let previousFaceIds: string[] = [];

  try {
    previousFaceIds = (
      await prisma.user_face_enrollments.findMany({
        where: { user_id: userId, status: "active" },
        select: { rekognition_face_id: true },
      })
    ).map((enrollment) => enrollment.rekognition_face_id);

    await prisma.$transaction([
      prisma.user_face_enrollments.updateMany({
        where: { user_id: userId, status: "active" },
        data: { status: "revoked", revoked_at: new Date() },
      }),
      prisma.user_face_enrollments.create({
        data: {
          user_id: userId,
          rekognition_face_id: indexed.faceId,
          status: "active",
        },
      }),
    ]);
  } catch (error) {
    console.error("enrollFace db error:", error);
    await deleteFace(indexed.faceId).catch(() => {});
    return { success: false, message: "No fue posible guardar el enrolamiento." };
  }

  await Promise.allSettled(previousFaceIds.map((faceId) => deleteFace(faceId)));

  revalidatePath("/configuracion");
  return { success: true, message: "Rostro registrado correctamente." };
}
