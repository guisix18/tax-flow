import { createCompany } from "@/services/company/createCompany";
import { getCompanies } from "@/services/company/getCompanies";
import { FastifyInstance } from "fastify";
import { companiesResponseSchema, createCompanySchema } from "./schemas";
import z from "zod";
import { sendResult } from "@/lib/sendResult";

export function companyRoutes(app: FastifyInstance): void {
  app.get(
    "/companies",
    {
      schema: {
        response: {
          200: companiesResponseSchema,
        },
      },
    },
    async (_, reply) => {
      const companies = await getCompanies();
      return reply.status(200).send(companies);
    },
  );

  app.post(
    "/company",
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
