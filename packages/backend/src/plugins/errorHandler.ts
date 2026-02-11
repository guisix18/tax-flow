import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { HandleError } from "@/errors/handleError";
import fp from "fastify-plugin";

const errorHandlerPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.setErrorHandler((error: any, request, reply) => {
    // Erros de validação (Zod via Fastify)
    if (error.validation) {
      return reply.status(400).send({
        message: "Validation error",
        errors: error.validation.map((err: any) => ({
          field: err.instancePath?.replace(/^\//, "") || "unknown",
          message: err.message,
        })),
      });
    }

    if (error instanceof HandleError) {
      return reply.status(error.statusCode).send({
        message: error.message,
      });
    }

    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.status(error.statusCode).send({
        message: error.message || "Bad request",
      });
    }

    // Erros inesperados (5xx)
    app.log.error(error);
    return reply.status(500).send({
      message: "Internal server error",
    });
  });
};

export default fp(errorHandlerPlugin);
