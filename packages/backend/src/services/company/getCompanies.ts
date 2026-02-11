import { CompaniesResponse } from "@/types/company";
import { prisma } from "../../lib/prisma";

//Acho que a pessoa não vai cadastrar muito, então tá de boa não tem paginação
export async function getCompanies(): Promise<CompaniesResponse> {
  const companies = await prisma.company.findMany();

  return {
    rows: companies,
  };
}
