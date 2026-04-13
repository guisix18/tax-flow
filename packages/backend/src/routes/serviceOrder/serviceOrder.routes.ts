import { FastifyInstance } from "fastify";
import z from "zod";
import {
  createServiceOrderSchema,
  getServiceOrderByIdParamsSchema,
  getServiceOrdersFiltersSchema,
  getUpcomingServiceOrdersQuerySchema,
  serviceOrdersResponseSchema,
  updateServiceOrderSchema,
} from "./schemas";
import { createServiceOrder } from "@/services/serviceOrder/createServiceOrder";
import { sendResult } from "@/lib/sendResult";
import { getServiceOrders } from "@/services/serviceOrder/getServiceOrders";
import { getServiceOrderById } from "@/services/serviceOrder/getServiceOrderById";
import { updateServiceOrder } from "@/services/serviceOrder/updateServiceOrder";
import { markServiceOrderIssued } from "@/services/serviceOrder/markServiceOrderIssued";
import { getUpcomingServiceOrders } from "@/services/serviceOrder/getUpcomingServiceOrders";

export function serviceOrderRoutes(app: FastifyInstance): void {
  app.post(
    "/service-orders",
    {
      onRequest: [app.authenticate],
      schema: {
        body: createServiceOrderSchema,
        response: {
          201: z.object({ id: z.number() }),
        },
      },
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof createServiceOrderSchema>;
      const userId = request.user.sub;

      const result = await createServiceOrder(body, userId);

      return sendResult(reply, result, 201);
    },
  );

  app.get(
    "/service-orders",
    {
      onRequest: [app.authenticate],
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
      const userId = request.user.sub;

      const result = await getServiceOrders(filters, { page, ipp }, userId);

      return sendResult(reply, result);
    },
  );

  app.get(
    "/service-orders/upcoming",
    {
      onRequest: [app.authenticate],
      schema: {
        querystring: getUpcomingServiceOrdersQuerySchema,
        response: {
          200: serviceOrdersResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { days, page, ipp } = request.query as z.infer<
        typeof getUpcomingServiceOrdersQuerySchema
      >;
      const userId = request.user.sub;

      const result = await getUpcomingServiceOrders(userId, days, {
        page,
        ipp,
      });

      return sendResult(reply, result);
    },
  );

  app.get(
    "/service-orders/:id",
    {
      onRequest: [app.authenticate],
      schema: {
        params: getServiceOrderByIdParamsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as z.infer<
        typeof getServiceOrderByIdParamsSchema
      >;
      const userId = request.user.sub;

      const result = await getServiceOrderById(id, userId);

      return sendResult(reply, result);
    },
  );

  app.patch(
    "/service-orders/:id",
    {
      onRequest: [app.authenticate],
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
      const userId = request.user.sub;

      const result = await updateServiceOrder(body, id, userId);

      return sendResult(reply, result, 204);
    },
  );

  app.patch(
    "/service-orders/:id/mark-issued",
    {
      onRequest: [app.authenticate],
      schema: {
        params: getServiceOrderByIdParamsSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as z.infer<
        typeof getServiceOrderByIdParamsSchema
      >;
      const userId = request.user.sub;

      const result = await markServiceOrderIssued(id, userId);

      return sendResult(reply, result, 204);
    },
  );
}
