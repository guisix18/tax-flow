import z from "zod";

export const registerUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
});

export const loginUserSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const authResponseSchema = z.object({
  id: z.number(),
  token: z.string(),
});

export const loginResponseSchema = z.object({
  token: z.string(),
});
