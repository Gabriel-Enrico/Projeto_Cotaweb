import Fastify from "fastify";
import cors from "@fastify/cors";
import { restauranteRoutes } from "./routes/restaurantes";
import { departamentoRoutes } from "./routes/departamentos";
import { fornecedorRoutes } from "./routes/fornecedores";
import { itemRoutes } from "./routes/itens";
import { cotacaoRoutes } from "./routes/cotacoes";

import { exportRoutes } from "./routes/export";

const app = Fastify({ logger: true });

async function bootstrap() {
  await app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(restauranteRoutes);
  await app.register(departamentoRoutes);
  await app.register(fornecedorRoutes);
  await app.register(itemRoutes);
  await app.register(cotacaoRoutes);

  await app.register(exportRoutes);

  app.get("/health", async () => ({ status: "ok", timestamp: new Date() }));

  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`CotaWeb API rodando em http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});