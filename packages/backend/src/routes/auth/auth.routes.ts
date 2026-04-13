import { FastifyInstance } from "fastify";
import z from "zod";
import {
  authResponseSchema,
  loginResponseSchema,
  loginUserSchema,
  registerUserSchema,
} from "./schemas";
import { registerUser } from "@/services/auth/registerUser";
import { loginUser } from "@/services/auth/loginUser";
import { sendResult } from "@/lib/sendResult";

export function authRoutes(app: FastifyInstance): void {
  app.post(
    "/auth/register",
    {
      schema: {
        body: registerUserSchema,
        response: {
          201: authResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof registerUserSchema>;

      const result = await registerUser(body);

      if (!result.success) {
        return sendResult(reply, result);
      }

      const token = app.jwt.sign({ sub: result.data.id });
      return reply.status(201).send({ id: result.data.id, token });
    },
  );

  app.post(
    "/auth/login",
    {
      schema: {
        body: loginUserSchema,
        response: {
          200: loginResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof loginUserSchema>;

      const result = await loginUser(body);

      if (!result.success) {
        return sendResult(reply, result);
      }

      const token = app.jwt.sign({ sub: result.data.id });
      return reply.status(200).send({ token });
    },
  );
}
