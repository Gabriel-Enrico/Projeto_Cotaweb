import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ExportService } from "../services/ExportService";
import { validate } from "../utils/validate";

const exportService = new ExportService();
const idParam = z.object({ id: z.coerce.number().int().positive() });

export async function exportRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>("/exportar/cotacao/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;

    try {
      const buffer = await exportService.exportarComparativoCotacao(params.id);
      const filename = `comparativo_cotacao_${params.id}_${new Date().toISOString().split("T")[0]}.xlsx`;

      return reply
        .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .header("Content-Disposition", `attachment; filename="${filename}"`)
        .send(Buffer.from(buffer));
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
}
