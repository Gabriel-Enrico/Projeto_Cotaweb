import { FastifyRequest, FastifyReply } from "fastify";

/**
 * Middleware que restringe o acesso à área administrativa.
 * Apenas usuários com cargo "admin" e sem restaurante_id (superadmin CotaWeb) podem acessar.
 */
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const payload = request.user as any;

  if (!payload) {
    return reply.status(401).send({ error: "Não autenticado." });
  }

  const isAdmin = payload.cargo === "admin";
  const isSuperAdmin = payload.restauranteId === null || payload.restauranteId === undefined;

  if (!isAdmin || !isSuperAdmin) {
    return reply.status(403).send({ error: "Acesso restrito ao administrador da plataforma." });
  }
}
