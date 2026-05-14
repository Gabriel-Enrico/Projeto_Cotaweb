import { FastifyInstance } from "fastify";
import { AuthService } from "../services/AuthService";
import { loginSchema } from "../schemas";
import { authMiddleware } from "../utils/authMiddleware";
import { response } from "../utils/response";
import { httpError } from "../db/errors/httpError";
import { z } from "zod";

const authService = new AuthService();

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

const recuperarSenhaSchema = z.object({
  email: z
    .string({ required_error: "E-mail é obrigatório" })
    .email("E-mail inválido")
    .max(150)
    .trim(),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login
  app.post("/auth/login", async (req, reply) => {
    const data = loginSchema.parse(req.body);

    const usuario = await authService.login(data);

    const accessToken = app.jwt.sign(
      {
        id: usuario.id,
        restauranteId: usuario.restaurante_id,
        cargo: usuario.cargo,
      },
      { expiresIn: ACCESS_EXPIRES }
    );

    const refreshToken = app.jwt.sign(
      { id: usuario.id },
      { expiresIn: "7d" }
    );

    reply.setCookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      path: "/auth/refresh",
      maxAge: REFRESH_EXPIRES_MS / 1000,
    });

    return reply.send(
      response.ok({ accessToken, usuario }, "Login realizado com sucesso!")
    );
  });

  // POST /auth/refresh
  app.post("/auth/refresh", async (request, reply) => {
    const token = request.cookies?.refreshToken;

    if (!token) {
      throw httpError.unauthorized("Sem refresh token");
    }

    const payload = app.jwt.verify(token) as any;

    const { usuario } = await authService.buscarPorId(payload.id);

    const accessToken = app.jwt.sign(
      {
        id: usuario.id,
        restauranteId: usuario.restaurante_id,
        cargo: usuario.cargo,
      },
      { expiresIn: ACCESS_EXPIRES }
    );

    const newRefreshToken = app.jwt.sign(
      { id: usuario.id },
      { expiresIn: "7d" }
    );

    reply.setCookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "strict",
      path: "/auth/refresh",
      maxAge: REFRESH_EXPIRES_MS / 1000,
    });

    return reply.send(response.ok({ accessToken }, "Token renovado"));
  });

  // POST /auth/logout
  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie("refreshToken", { path: "/auth/refresh" });
    return reply.status(204).send();
  });

  // POST /auth/recuperar-senha
  // Rota pública — notifica o admin por e-mail para redefinir a senha
  app.post("/auth/recuperar-senha", async (req, reply) => {
    const { email } = recuperarSenhaSchema.parse(req.body);

    // Executamos sem aguardar para não revelar timing (segurança)
    authService.solicitarRecuperacaoSenha(email).catch((err) => {
      app.log.error({ err }, "Erro ao notificar admin sobre recuperação de senha");
    });

    // Resposta sempre igual, independente de o e-mail existir ou não
    return reply.send(
      response.ok(
        null,
        "Se esse e-mail estiver cadastrado, o administrador será notificado e entrará em contato."
      )
    );
  });

  // GET /auth/me (protegido)
  app.get(
    "/auth/me",
    { onRequest: [authMiddleware] },
    async (request, reply) => {
      const payload = request.user as any;
      const result = await authService.buscarPorId(payload.id);
      return reply.send(response.ok(result));
    }
  );
}