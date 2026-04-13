import { FastifyInstance, FastifyPluginAsync } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fp from "fastify-plugin";

const authPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não definida no arquivo .env");
  }

  await app.register(fastifyJwt, { secret });

  app.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply
        .status(401)
        .send({ type: "INVALID_CREDENTIALS_ERROR" });
    }
  });
};

export default fp(authPlugin);
