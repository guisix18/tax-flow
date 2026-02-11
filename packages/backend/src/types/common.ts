import { DomainError } from "@/errors/domains.errors";

export interface RecordWithId {
  id: number;
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
