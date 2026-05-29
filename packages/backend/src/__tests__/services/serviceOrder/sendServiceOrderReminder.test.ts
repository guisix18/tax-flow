import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendServiceOrderReminder } from "@/services/serviceOrder/sendServiceOrderReminder";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    serviceOrder: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/mailer", () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
}));

const USER_ID = 42;

const baseOrder = {
  id: 10,
  company_id: 1,
  service_name: "Consultoria",
  amount: 150000, // R$ 1500,00 em centavos
  due_date: new Date("2026-05-01T12:00:00Z"),
  service_status: "PENDING" as const,
  note_issued: false,
  notified: false,
  notification_count: 0,
  last_notification_at: null,
  created_at: new Date(),
  updated_at: null,
  company: {
    id: 1,
    name: "Empresa X",
    cnpj: null,
    user_id: USER_ID,
    created_at: new Date(),
    updated_at: null,
    user: {
      id: USER_ID,
      name: "João",
      email: "joao@example.com",
      password_hash: "hash",
      created_at: new Date(),
      updated_at: null,
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendServiceOrderReminder", () => {
  it("envia e-mail para o User dono e atualiza campos de notificação", async () => {
    vi.mocked(prisma.serviceOrder.findFirst).mockResolvedValueOnce(
      baseOrder as never,
    );
    vi.mocked(prisma.serviceOrder.update).mockResolvedValueOnce(
      baseOrder as never,
    );

    const result = await sendServiceOrderReminder(10, USER_ID);

    expect(result.success).toBe(true);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(sendMail).mock.calls[0][0];
    expect(payload.to).toBe("joao@example.com");
    expect(payload.subject).toContain("Consultoria");
    expect(payload.text).toContain("João");
    expect(payload.text).toContain("Empresa X");
    expect(payload.text).toContain("R$"); // formatação BRL

    expect(prisma.serviceOrder.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        notified: true,
        notification_count: { increment: 1 },
        last_notification_at: expect.any(Date),
      },
    });
  });

  it("retorna SERVICE_ORDER_NOT_FOUND_ERROR quando ordem não pertence ao usuário", async () => {
    vi.mocked(prisma.serviceOrder.findFirst).mockResolvedValueOnce(null);

    const result = await sendServiceOrderReminder(10, USER_ID);

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.type).toBe("SERVICE_ORDER_NOT_FOUND_ERROR");
    expect(sendMail).not.toHaveBeenCalled();
    expect(prisma.serviceOrder.update).not.toHaveBeenCalled();
  });

  it("retorna SERVICE_ORDER_ALREADY_ISSUED_ERROR quando nota já foi emitida", async () => {
    vi.mocked(prisma.serviceOrder.findFirst).mockResolvedValueOnce({
      ...baseOrder,
      note_issued: true,
    } as never);

    const result = await sendServiceOrderReminder(10, USER_ID);

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.type).toBe("SERVICE_ORDER_ALREADY_ISSUED_ERROR");
    expect(sendMail).not.toHaveBeenCalled();
    expect(prisma.serviceOrder.update).not.toHaveBeenCalled();
  });

  it("retorna success mesmo se o envio de e-mail falhar (fire-and-forget)", async () => {
    vi.mocked(prisma.serviceOrder.findFirst).mockResolvedValueOnce(
      baseOrder as never,
    );
    vi.mocked(prisma.serviceOrder.update).mockResolvedValueOnce(
      baseOrder as never,
    );
    vi.mocked(sendMail).mockRejectedValueOnce(new Error("Resend fora do ar"));

    const result = await sendServiceOrderReminder(10, USER_ID);

    expect(result.success).toBe(true);
    expect(prisma.serviceOrder.update).toHaveBeenCalled();
  });
});
