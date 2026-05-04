import { FastifyRequest, FastifyReply } from "fastify";
import { httpError } from "../db/errors/httpError";

export async function authMiddleware(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await req.jwtVerify();
  } catch {
    throw httpError.unauthorized("Token inválido ou expirado");
  }
}