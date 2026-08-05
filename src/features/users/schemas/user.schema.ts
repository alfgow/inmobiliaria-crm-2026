import { z } from "zod";

import { USER_ROLES } from "@/features/users/types/user-role";

const nameSchema = z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(100);

const emailSchema = z
  .string()
  .trim()
  .min(1, "El correo es obligatorio.")
  .email("Correo invalido.")
  .max(150)
  .toLowerCase();

const roleSchema = z.enum(USER_ROLES);

// bcrypt trunca (sin avisar) cualquier entrada mayor a 72 bytes.
const passwordSchema = z
  .string()
  .min(8, "La contrasena debe tener al menos 8 caracteres.")
  .max(72, "La contrasena no puede superar 72 caracteres.");

export const createUserInputSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    role: roleSchema,
    isActive: z.boolean(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmPassword"],
  });

export const updateUserInputSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    role: roleSchema,
    isActive: z.boolean(),
    password: z.union([passwordSchema, z.literal("")]).optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmPassword"],
  });

export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
