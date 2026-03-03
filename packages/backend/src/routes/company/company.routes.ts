import { createCompany } from "@/services/company/createCompany";
import { getCompanies } from "@/services/company/getCompanies";
import { FastifyInstance } from "fastify";
import {
  companiesResponseSchema,
  createCompanySchema,
  getCompaniesQuerySchema,
} from "./schemas";
import z from "zod";
import { sendResult } from "@/lib/sendResult";

export function companyRoutes(app: FastifyInstance): void {
  app.get(
    "/companies",
    {
      schema: {
        querystring: getCompaniesQuerySchema,
        response: {
          200: companiesResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { page, ipp } = request.query as z.infer<
        typeof getCompaniesQuerySchema
      >;

      const result = await getCompanies({ page, ipp });

      return sendResult(reply, result);
    },
  );

  app.post(
    "/companies",
    {
      schema: {
        body: createCompanySchema,
        response: {
          201: z.object({ id: z.number() }),
        },
      },
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof createCompanySchema>;

      const result = await createCompany(body);

      return sendResult(reply, result, 201);
    },
  );
}
