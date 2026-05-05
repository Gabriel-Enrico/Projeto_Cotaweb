import { FastifyInstance } from "fastify";
import { AuthService } from "../services/AuthService";
import { loginSchema, registerSchema } from "../schemas";
import { authMiddleware } from "../utils/authMiddleware";
import { response } from "../utils/response";
import { httpError } from "../db/errors/httpError";

const authService = new AuthService();

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

export async function authRoutes(app: FastifyInstance) {
    // POST /auth/registrar
    app.post("/auth/registrar", async (req, reply) => {
        const data = registerSchema.parse(req.body);

        const result = await authService.registrar(data);

        return reply.status(201).send(result);
    })

    // POST /auth/login
    app.post("/auth/login", async (req, reply) => {
        const data = loginSchema.parse(req.body);

        const usuario = await authService.login(data);

        // ela transforma um objeto JSON (que contém dados do usuário,
        //  como ID e permissões) em uma string criptografada e segura
        const accessToken = app.jwt.sign({
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
    })

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

    return reply.send(
      response.ok({ accessToken }, "Token renovado")
    );
  });

  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie("refreshToken", { path: "/auth/refresh" });

    return reply.status(204).send();
  });

  // 👤 ME (PROTEGIDO)
  app.get(
    "/auth/me",
    {
      onRequest: [authMiddleware], // middleware limpo
    },
    async (request, reply) => {
      const payload = request.user as any;

      const result = await authService.buscarPorId(payload.id);

      return reply.send(
        response.ok(result)
      );
    }
  );
}