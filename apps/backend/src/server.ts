import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";

import { restauranteRoutes } from "./routes/restaurantes";
import { departamentoRoutes } from "./routes/departamentos";
import { fornecedorRoutes } from "./routes/fornecedores";
import { itemRoutes } from "./routes/itens";
import { cotacaoRoutes } from "./routes/cotacoes";
import { exportRoutes } from "./routes/export";
import { authRoutes } from "./routes/auth";
import { authMiddleware } from "./utils/authMiddleware";
import { errorHandler } from "./plugins/errorHandler";

const app = Fastify({ logger: true });

async function bootstrap() {
  await app.register(errorHandler);

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET as string,
  });

  await app.register(jwt, {
    secret: process.env.JWT_REFRESH_SECRET as string,
    namespace: "refreshJwt",
  });

  await app.register(cookie);

  // Rotas públicas
  await app.register(authRoutes);
  app.get("/health", async () => ({ status: "ok", timestamp: new Date() }));

  // Rotas protegidas — todas exigem JWT válido
  await app.register(async (protectedApp) => {
    protectedApp.addHook("onRequest", authMiddleware);

    await protectedApp.register(restauranteRoutes);
    await protectedApp.register(departamentoRoutes);
    await protectedApp.register(fornecedorRoutes);
    await protectedApp.register(itemRoutes);
    await protectedApp.register(cotacaoRoutes);
    await protectedApp.register(exportRoutes);
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`CotaWeb API rodando em http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});