import { DomainError } from "@/errors/domains.errors";

export interface RecordWithId {
  id: number;
}

export interface PaginationParams {
  page: number;
  ipp: number;
}

export interface PaginatedResult<T> {
  rows: T[];
  pagination: {
    page: number;
    ipp: number;
    total: number;
    total_pages: number;
  };
}

export type Result<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: DomainError;
      message?: string;
    };
