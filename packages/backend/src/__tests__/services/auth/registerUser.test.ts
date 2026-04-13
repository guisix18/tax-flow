import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerUser } from "@/services/auth/registerUser";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

const bcrypt = (await import("bcrypt")).default;

const baseUser = {
  id: 1,
  name: "João",
  email: "joao@example.com",
  password_hash: "hashed",
  created_at: new Date(),
  updated_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("registerUser", () => {
  it("cria usuário com sucesso e retorna id", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(bcrypt.hash).mockResolvedValueOnce("hashed" as never);
    vi.mocked(prisma.user.create).mockResolvedValueOnce(baseUser);

    const result = await registerUser({
      name: "João",
      email: "joao@example.com",
      password: "senha12345",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe(1);
    expect(bcrypt.hash).toHaveBeenCalledWith("senha12345", 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "João",
        email: "joao@example.com",
        password_hash: "hashed",
      },
    });
  });

  it("retorna USER_ALREADY_EXISTS_ERROR quando e-mail já cadastrado", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(baseUser);

    const result = await registerUser({
      name: "Outro",
      email: "joao@example.com",
      password: "senha12345",
    });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.type).toBe("USER_ALREADY_EXISTS_ERROR");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
