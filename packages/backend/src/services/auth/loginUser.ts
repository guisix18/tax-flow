import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { RecordWithId, Result } from "@/types/common";
import { UserLoginInput } from "@/types/user";

export async function loginUser(
  data: UserLoginInput,
): Promise<Result<RecordWithId>> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    return {
      success: false,
      error: { type: "INVALID_CREDENTIALS_ERROR" },
      message: "Credenciais inválidas",
    };
  }

  const passwordMatches = await bcrypt.compare(data.password, user.password_hash);

  if (!passwordMatches) {
    return {
      success: false,
      error: { type: "INVALID_CREDENTIALS_ERROR" },
      message: "Credenciais inválidas",
    };
  }

  return {
    success: true,
    data: { id: user.id },
  };
}
