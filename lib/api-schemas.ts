import { z } from "zod";

export const appwriteIdSchema = z
  .string()
  .nonempty()
  .max(36)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/);

export const galleryIdParamsSchema = z.object({
  galleryId: appwriteIdSchema,
});

export const filesBodySchema = z.object({
  files: z.array(appwriteIdSchema).nonempty().max(1000),
});
