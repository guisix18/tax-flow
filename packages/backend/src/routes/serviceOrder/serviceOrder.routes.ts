import { FastifyInstance } from "fastify";
import z from "zod";
import {
  createServiceOrderSchema,
  getServiceOrdersFiltersSchema,
} from "./schemas";
import { createServiceOrder } from "@/services/serviceOrder/createServiceOrder";
import { sendResult } from "@/lib/sendResult";
import { getServiceOrders } from "@/services/serviceOrder/getServiceOrders";

export function serviceOrderRoutes(app: FastifyInstance): void {
  app.get("/service-orders", async (_, reply) => {
    return reply.status(200).send({ message: "List of service orders" });
  });

  app.post(
    "/service-order",
    {
      schema: {
        body: createServiceOrderSchema,
        response: {
          201: z.object({ id: z.number() }),
        },
      },
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof createServiceOrderSchema>;

      const result = await createServiceOrder(body);

      return sendResult(reply, result, 201);
    },
  );

  app.get(
    "/service-order",
    {
      schema: {
        querystring: getServiceOrdersFiltersSchema,
      },
    },
    async (request, reply) => {
      const filters = request.query as z.infer<
        typeof getServiceOrdersFiltersSchema
      >;

      const result = await getServiceOrders(filters);

      return sendResult(reply, result);
    },
  );
}
