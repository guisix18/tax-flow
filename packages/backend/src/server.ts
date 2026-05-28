import { fastify, FastifyInstance } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { fastifySwagger } from "@fastify/swagger";
import { fastifyCors } from "@fastify/cors";
import ScalarApiReference from "@scalar/fastify-api-reference";
import { companyRoutes } from "./routes/company/company.routes";
import errorHandler from "./plugins/errorHandler";
import authPlugin from "./plugins/auth";
import { serviceOrderRoutes } from "./routes/serviceOrder/serviceOrder.routes";
import { authRoutes } from "./routes/auth/auth.routes";
import { registerSendRemindersJob } from "./jobs/sendRemindersJob";

const app: FastifyInstance = fastify({
  logger: true,
}).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

async function taxFlowBootstrap() {
  app.register(fastifyCors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  });
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Tax Flow API",
        description: "API para gerenciamento de ordens de serviço e lembretes de emissão de nota fiscal.",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });
  app.register(ScalarApiReference, {
    routePrefix: "/docs",
  });
  app.get("/health", () => ({ status: "ok" }));
  app.register(errorHandler);
  await app.register(authPlugin);
  app.register(authRoutes);
  app.register(companyRoutes);
  app.register(serviceOrderRoutes);

  const fallbackPort = 3333;

  const port = process.env.PORT ? Number(process.env.PORT) : fallbackPort;

  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`Server listening on port ${port}`);
  registerSendRemindersJob();
  app.log.info("Job de lembretes agendado (diário às 08:00)");
}

process.on("unhandledRejection", (reason) => {
  app.log.error({ reason }, "Unhandled rejection");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  app.log.error(err, "Uncaught exception");
  process.exit(1);
});

taxFlowBootstrap().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
