import type { DomainError } from "./domains.errors";

export const domainErrorMessages: Record<DomainError["type"], string> = {
  INVALID_CNPJ_ERROR: "CNPJ inválido.",
  COMPANY_ALREADY_EXISTS_ERROR: "Empresa com este CNPJ já cadastrada.",
  COMPANY_NOT_FOUND_ERROR: "Empresa não encontrada.",
  SERVICE_ORDER_NOT_FOUND_ERROR: "Ordem de serviço não encontrada.",
  SERVICE_ORDER_ALREADY_EXISTS_ERROR: "Ordem de serviço já existente.",
  SERVICE_ORDER_ALREADY_ISSUED_ERROR: "Nota fiscal já emitida para esta ordem.",
  USER_ALREADY_EXISTS_ERROR: "E-mail já cadastrado.",
  INVALID_CREDENTIALS_ERROR: "E-mail ou senha incorretos.",
};
