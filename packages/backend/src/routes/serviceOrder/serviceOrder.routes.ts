import { FastifyInstance } from "fastify";
import z from "zod";
import {
  createServiceOrderSchema,
  getServiceOrderByIdParamsSchema,
  getServiceOrdersFiltersSchema,
  getUpcomingServiceOrdersQuerySchema,
  sendReminderBodySchema,
  serviceOrderListItemSchema,
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
import { sendServiceOrderReminder } from "@/services/serviceOrder/sendServiceOrderReminder";

export function serviceOrderRoutes(app: FastifyInstance): void {
  app.post(
    "/service-orders",
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ["Ordens de Serviço"],
        summary: "Criar ordem de serviço",
        description: "Registra uma nova ordem de serviço vinculada a uma empresa do usuário.",
        security: [{ bearerAuth: [] }],
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
        tags: ["Ordens de Serviço"],
        summary: "Listar ordens de serviço",
        description: "Retorna lista paginada com filtros por empresa, nome, período e status.",
        security: [{ bearerAuth: [] }],
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
        tags: ["Ordens de Serviço"],
        summary: "Ordens próximas do vencimento",
        description: "Retorna ordens com `due_date` dentro dos próximos N dias (padrão 7). Útil para o dashboard.",
        security: [{ bearerAuth: [] }],
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
        tags: ["Ordens de Serviço"],
        summary: "Buscar ordem por ID",
        description: "Retorna os dados completos de uma ordem de serviço. Retorna 404 se não pertencer ao usuário.",
        security: [{ bearerAuth: [] }],
        params: getServiceOrderByIdParamsSchema,
        response: {
          200: serviceOrderListItemSchema,
        },
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
        tags: ["Ordens de Serviço"],
        summary: "Atualizar ordem de serviço",
        description: "Atualiza nome, valor ou data de vencimento. Todos os campos são opcionais. Retorna 204.",
        security: [{ bearerAuth: [] }],
        body: updateServiceOrderSchema,
        params: getServiceOrderByIdParamsSchema,
        response: { 204: z.void() },
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
        tags: ["Ordens de Serviço"],
        summary: "Marcar nota como emitida",
        description: "Define `note_issued = true`. Após isso, a ordem não recebe mais lembretes automáticos. Retorna 204.",
        security: [{ bearerAuth: [] }],
        params: getServiceOrderByIdParamsSchema,
        response: { 204: z.void() },
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

  app.post(
    "/service-orders/send-reminder",
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ["Ordens de Serviço"],
        summary: "Enviar lembrete manual por e-mail",
        description: "Envia imediatamente um e-mail de lembrete ao dono da ordem. Falha se a nota já foi emitida. Retorna 204.",
        security: [{ bearerAuth: [] }],
        body: sendReminderBodySchema,
        response: { 204: z.void() },
      },
    },
    async (request, reply) => {
      const { id } = request.body as z.infer<typeof sendReminderBodySchema>;
      const userId = request.user.sub;

      const result = await sendServiceOrderReminder(id, userId);

      return sendResult(reply, result, 204);
    },
  );
}
