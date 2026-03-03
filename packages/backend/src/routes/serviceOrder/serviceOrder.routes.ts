import { FastifyInstance } from "fastify";
import z from "zod";
import {
  createServiceOrderSchema,
  getServiceOrderByIdParamsSchema,
  getServiceOrdersFiltersSchema,
  serviceOrdersResponseSchema,
  updateServiceOrderSchema,
} from "./schemas";
import { createServiceOrder } from "@/services/serviceOrder/createServiceOrder";
import { sendResult } from "@/lib/sendResult";
import { getServiceOrders } from "@/services/serviceOrder/getServiceOrders";
import { getServiceOrderById } from "@/services/serviceOrder/getServiceOrderById";
import { updateServiceOrder } from "@/services/serviceOrder/updateServiceOrder";
import { markServiceOrderIssued } from "@/services/serviceOrder/markServiceOrderIssued";

export function serviceOrderRoutes(app: FastifyInstance): void {
  app.post(
    "/service-orders",
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
    "/service-orders",
    {
      schema: {
        querystring: getServiceOrdersFiltersSchema,
        response: {
          200: serviceOrdersResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { page, ipp, ...filters } = request.query as z.infer<
        typeof getServiceOrdersFiltersSchema
      >;

      const result = await getServiceOrders(filters, { page, ipp });

      return sendResult(reply, result);
    },
  );

  app.get(
    "/service-orders/:id",
    {
      schema: {
        params: getServiceOrderByIdParamsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as z.infer<
        typeof getServiceOrderByIdParamsSchema
      >;

      const result = await getServiceOrderById(id);

      return sendResult(reply, result);
    },
  );

  app.patch(
    "/service-orders/:id",
    {
      schema: {
        body: updateServiceOrderSchema,
        params: getServiceOrderByIdParamsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as z.infer<
        typeof getServiceOrderByIdParamsSchema
      >;

      const body = request.body as z.infer<typeof updateServiceOrderSchema>;

      const result = await updateServiceOrder(body, id);

      return sendResult(reply, result, 204);
    },
  );

  app.patch(
    "/service-orders/:id/mark-issued",
    {
      schema: {
        params: getServiceOrderByIdParamsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as z.infer<
        typeof getServiceOrderByIdParamsSchema
      >;

      const reuslt = await markServiceOrderIssued(id);

      return sendResult(reply, reuslt, 204);
    },
  );
}
