import z from "zod";

export const registerUserSchema = z.object({
  name: z.string().min(1, { error: "Nome é obrigatório" }),
  email: z.email({ error: "E-mail inválido" }),
  password: z.string().min(8, { error: "Senha deve ter no mínimo 8 caracteres" }),
});

export const loginUserSchema = z.object({
  email: z.email({ error: "E-mail inválido" }),
  password: z.string().min(1, { error: "Senha é obrigatória" }),
});

export const authResponseSchema = z.object({
  id: z.number(),
  token: z.string(),
});

export const loginResponseSchema = z.object({
  token: z.string(),
});
