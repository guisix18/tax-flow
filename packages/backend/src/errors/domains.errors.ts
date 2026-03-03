type CompanyInvalidCnpjError = {
  type: "INVALID_CNPJ_ERROR";
};

type CompanyAlreadyExistsError = {
  type: "COMPANY_ALREADY_EXISTS_ERROR";
};

type CompanyNotFoundError = {
  type: "COMPANY_NOT_FOUND_ERROR";
};

type ServiceOrderNotFoundError = {
  type: "SERVICE_ORDER_NOT_FOUND_ERROR";
};

type ServiceOrderAlreadyExistsError = {
  type: "SERVICE_ORDER_ALREADY_EXISTS_ERROR";
};

type ServiceOrderAlreadyIssuedError = {
  type: "SERVICE_ORDER_ALREADY_ISSUED_ERROR";
};

export type DomainError =
  | CompanyInvalidCnpjError
  | CompanyAlreadyExistsError
  | CompanyNotFoundError
  | ServiceOrderAlreadyExistsError
  | ServiceOrderNotFoundError
  | ServiceOrderAlreadyIssuedError;
