import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCompany } from "@/services/company/createCompany";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    company: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("cpf-cnpj-validator", () => ({
  cnpj: { isValid: vi.fn() },
}));

// importar depois do mock para pegar a versão mockada
const { cnpj } = await import("cpf-cnpj-validator");

const USER_ID = 42;

const mockCompany = {
  id: 1,
  name: "Empresa Teste",
  cnpj: null,
  user_id: USER_ID,
  created_at: new Date(),
  updated_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createCompany", () => {
  describe("quando CNPJ não é informado", () => {
    it("cria a empresa com sucesso", async () => {
      vi.mocked(prisma.company.create).mockResolvedValueOnce(mockCompany);

      const result = await createCompany({ name: "Empresa Teste" }, USER_ID);

      expect(result.success).toBe(true);
      if (result.success) expect(result.data.id).toBe(1);
    });

    it("não consulta o banco para checar duplicata", async () => {
      vi.mocked(prisma.company.create).mockResolvedValueOnce(mockCompany);

      await createCompany({ name: "Empresa Teste" }, USER_ID);

      expect(prisma.company.findUnique).not.toHaveBeenCalled();
    });

    it("persiste o user_id do usuário autenticado", async () => {
      vi.mocked(prisma.company.create).mockResolvedValueOnce(mockCompany);

      await createCompany({ name: "Empresa Teste" }, USER_ID);

      expect(prisma.company.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ user_id: USER_ID }),
      });
    });
  });

  describe("quando CNPJ é informado", () => {
    it("retorna INVALID_CNPJ_ERROR para CNPJ inválido", async () => {
      vi.mocked(cnpj.isValid).mockReturnValue(false);

      const result = await createCompany(
        { name: "Empresa", cnpj: "invalido" },
        USER_ID,
      );

      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.type).toBe("INVALID_CNPJ_ERROR");
      expect(prisma.company.create).not.toHaveBeenCalled();
    });

    it("retorna COMPANY_ALREADY_EXISTS_ERROR quando CNPJ já cadastrado", async () => {
      vi.mocked(cnpj.isValid).mockReturnValue(true);
      vi.mocked(prisma.company.findUnique).mockResolvedValueOnce(mockCompany);

      const result = await createCompany(
        { name: "Empresa", cnpj: "11.222.333/0001-81" },
        USER_ID,
      );

      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.type).toBe("COMPANY_ALREADY_EXISTS_ERROR");
    });

    it("cria empresa com sucesso quando CNPJ válido e não duplicado", async () => {
      vi.mocked(cnpj.isValid).mockReturnValue(true);
      vi.mocked(prisma.company.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.company.create).mockResolvedValueOnce({
        ...mockCompany,
        cnpj: "11.222.333/0001-81",
      });

      const result = await createCompany(
        { name: "Empresa", cnpj: "11.222.333/0001-81" },
        USER_ID,
      );

      expect(result.success).toBe(true);
      if (result.success) expect(result.data.id).toBe(1);
    });
  });
});
