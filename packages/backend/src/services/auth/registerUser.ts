import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { RecordWithId, Result } from "@/types/common";
import { UserRegisterInput } from "@/types/user";

export async function registerUser(
  data: UserRegisterInput,
): Promise<Result<RecordWithId>> {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    return {
      success: false,
      error: { type: "USER_ALREADY_EXISTS_ERROR" },
      message: "E-mail já cadastrado",
    };
  }

  const password_hash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password_hash,
    },
  });

  return {
    success: true,
    data: { id: user.id },
  };
}
