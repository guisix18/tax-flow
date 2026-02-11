type CompanyInvalidCnpjError = {
  type: "INVALID_CNPJ_ERROR";
};

type CompanyAlreadyExistsError = {
  type: "COMPANY_ALREADY_EXISTS_ERROR";
};

type CompanyNotFoundError = {
  type: "COMPANY_NOT_FOUND_ERROR";
};

export type DomainError =
  | CompanyInvalidCnpjError
  | CompanyAlreadyExistsError
  | CompanyNotFoundError;
