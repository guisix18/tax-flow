export interface ServiceOrder {
  id: number;
  company_id: number;
  service_name: string;
  amount: number;
  created_at: Date;
  updated_at: Date | null;
  due_date: Date;
  last_notification_at: Date | null;
  notification_count: number;
  note_issued: boolean;
  notified: boolean;
}

export interface ServiceOrderInput {
  company_id: number;
  service_name: string;
  amount: number;
  due_date: Date;
}

export interface ServiceOrdersResponse {
  rows: ServiceOrder[];
}

export interface ServiceOrderFilters {
  company_id?: number;
  service_name?: string;
  start_date?: Date;
  end_date?: Date;
  status?: "PENDING" | "IN_PROGRESS" | "CANCELLED" | "COMPLETED";
}
