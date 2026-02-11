export interface Company {
  id: number;
  name: string;
  cnpj: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface CompanyCreateInput {
  name: string;
  cnpj?: string | null;
}

export interface CompaniesResponse {
  rows: Company[];
}
