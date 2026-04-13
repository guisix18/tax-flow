import { Result, RecordWithId } from "@/types/common";
import { Company, CompanyCreateInput } from "@/types/company";
import { prisma } from "@/lib/prisma";
import { cnpj } from "cpf-cnpj-validator";

export async function createCompany(
  data: CompanyCreateInput,
  userId: number,
): Promise<Result<RecordWithId>> {
  let existingCompany: Company | null = null;
  let isCnpjValid: boolean | null = data.cnpj ? cnpj.isValid(data.cnpj) : null;

  if (data.cnpj && !isCnpjValid) {
    return {
      success: false,
      error: { type: "INVALID_CNPJ_ERROR" },
    };
  }

  if (data.cnpj) {
    existingCompany = await prisma.company.findUnique({
      where: {
        cnpj: data.cnpj,
      },
    });
  }

  if (existingCompany) {
    return {
      success: false,
      error: { type: "COMPANY_ALREADY_EXISTS_ERROR" },
    };
  }

  const newCompany = await prisma.company.create({
    data: {
      name: data.name,
      cnpj: isCnpjValid ? data.cnpj : null,
      user_id: userId,
    },
  });

  return {
    success: true,
    data: {
      id: newCompany.id,
    },
  };
}
