import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginUser } from "@/services/auth/loginUser";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
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
  id: 7,
  name: "João",
  email: "joao@example.com",
  password_hash: "hashed",
  created_at: new Date(),
  updated_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loginUser", () => {
  it("retorna id quando credenciais batem", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(baseUser);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

    const result = await loginUser({
      email: "joao@example.com",
      password: "senha12345",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe(7);
  });

  it("retorna INVALID_CREDENTIALS_ERROR quando usuário não existe", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const result = await loginUser({
      email: "naoexiste@example.com",
      password: "qualquer",
    });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.type).toBe("INVALID_CREDENTIALS_ERROR");
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("retorna INVALID_CREDENTIALS_ERROR quando senha não bate", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(baseUser);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

    const result = await loginUser({
      email: "joao@example.com",
      password: "errada",
    });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.type).toBe("INVALID_CREDENTIALS_ERROR");
  });
});
