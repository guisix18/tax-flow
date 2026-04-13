import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUpcomingServiceOrders } from "@/services/serviceOrder/getUpcomingServiceOrders";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    serviceOrder: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const USER_ID = 42;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUpcomingServiceOrders", () => {
  it("consulta com filtro por usuário, nota não emitida e janela de dias", async () => {
    vi.mocked(prisma.serviceOrder.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.serviceOrder.count).mockResolvedValueOnce(0);

    const before = Date.now();
    await getUpcomingServiceOrders(USER_ID, 7, { page: 1, ipp: 20 });
    const after = Date.now();

    expect(prisma.serviceOrder.findMany).toHaveBeenCalledTimes(1);
    const call = vi.mocked(prisma.serviceOrder.findMany).mock.calls[0][0]!;
    expect(call.where).toMatchObject({
      note_issued: false,
      company: { user_id: USER_ID },
    });

    // janela de corte = agora + 7 dias (com tolerância para o tempo decorrido entre o before/after)
    const cutoff = (call.where as { due_date: { lte: Date } }).due_date
      .lte as Date;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(cutoff.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 50);
    expect(cutoff.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 50);

    expect(call.orderBy).toEqual({ due_date: "asc" });
    expect(call.skip).toBe(0);
    expect(call.take).toBe(20);
  });

  it("passa o mesmo where para findMany e count", async () => {
    vi.mocked(prisma.serviceOrder.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.serviceOrder.count).mockResolvedValueOnce(0);

    await getUpcomingServiceOrders(USER_ID, 14, { page: 1, ipp: 20 });

    const findManyWhere = vi.mocked(prisma.serviceOrder.findMany).mock
      .calls[0][0]!.where;
    const countWhere = vi.mocked(prisma.serviceOrder.count).mock.calls[0][0]!
      .where;
    expect(findManyWhere).toEqual(countWhere);
  });

  it("retorna paginação coerente", async () => {
    const fakeRow = {
      id: 1,
      company_id: 1,
      service_name: "Consultoria",
      amount: 10000,
      service_status: "PENDING" as const,
      due_date: new Date(),
      note_issued: false,
      notified: false,
      notification_count: 0,
      last_notification_at: null,
      created_at: new Date(),
      updated_at: null,
    };
    vi.mocked(prisma.serviceOrder.findMany).mockResolvedValueOnce([fakeRow]);
    vi.mocked(prisma.serviceOrder.count).mockResolvedValueOnce(5);

    const result = await getUpcomingServiceOrders(USER_ID, 7, {
      page: 2,
      ipp: 2,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.pagination).toEqual({
        page: 2,
        ipp: 2,
        total: 5,
        total_pages: 3,
      });
    }
  });
});
