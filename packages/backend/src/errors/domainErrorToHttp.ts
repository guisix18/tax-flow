import { DomainError } from "./domains.errors";

export function domainErrorToHttp(error: DomainError): {
  status: number;
} {
  switch (error.type) {
    case "INVALID_CNPJ_ERROR":
      return { status: 400 };
    case "COMPANY_ALREADY_EXISTS_ERROR":
      return { status: 409 };
    case "COMPANY_NOT_FOUND_ERROR":
      return { status: 404 };
    case "SERVICE_ORDER_NOT_FOUND_ERROR":
      return { status: 404 };
    case "SERVICE_ORDER_ALREADY_EXISTS_ERROR":
      return { status: 409 };
    case "SERVICE_ORDER_ALREADY_ISSUED_ERROR":
      return { status: 409 };
    case "USER_ALREADY_EXISTS_ERROR":
      return { status: 409 };
    case "INVALID_CREDENTIALS_ERROR":
      return { status: 401 };
  }
}
