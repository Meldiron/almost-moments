import { z } from "zod";

export const appwriteIdSchema = z
  .string()
  .nonempty()
  .max(36)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/);

export const galleryIdParamsSchema = z.object({
  galleryId: appwriteIdSchema,
});

export const blurhashSchema = z
  .string()
  .min(6)
  .max(100)
  .regex(/^[0-9A-Za-z#$%*+,\-./:;=?@[\]^_{|}~]+$/);

export const filesBodySchema = z.object({
  assets: z
    .array(
      z.object({
        fileId: appwriteIdSchema,
        blurhash: blurhashSchema,
      }),
    )
    .nonempty()
    .max(1000),
});
