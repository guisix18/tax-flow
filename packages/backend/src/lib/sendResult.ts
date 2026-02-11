import { FastifyReply } from "fastify";
import { Result } from "@/types/common";
import { domainErrorToHttp } from "@/errors/domainErrorToHttp";

export function sendResult<T>(
  reply: FastifyReply,
  result: Result<T>,
  successStatus = 200,
) {
  if (!result.success) {
    const { status } = domainErrorToHttp(result.error);
    return reply.status(status).send(result.error);
  }

  return reply.status(successStatus).send(result.data);
}
