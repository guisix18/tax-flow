import { FastifyReply } from "fastify";
import { Result } from "@/types/common";
import { domainErrorToHttp } from "@/errors/domainErrorToHttp";
import { domainErrorMessages } from "@/errors/domainErrorMessages";

export function sendResult<T>(
  reply: FastifyReply,
  result: Result<T>,
  successStatus = 200,
) {
  if (!result.success) {
    const { status } = domainErrorToHttp(result.error);
    const message = result.message ?? domainErrorMessages[result.error.type];
    return reply.status(status).send({ ...result.error, message });
  }

  return reply.status(successStatus).send(result.data);
}
