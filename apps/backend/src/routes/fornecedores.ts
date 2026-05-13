import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { FornecedorService } from "../services/FornecedorService";
import { validate } from "../utils/validate";

const svc = new FornecedorService();

const idParam = z.object({ id: z.coerce.number().int().positive() });
const restauranteParam = z.object({ restauranteId: z.coerce.number().int().positive() });
const telefoneRegex = /^\d{10,11}$/;

const createSchema = z.object({
  restaurante_id: z.number().int().positive(),
  nome: z.string().min(2).max(100).trim(),
  telefone: z.string().regex(telefoneRegex, "Telefone deve ter 10 ou 11 dígitos"),
  email: z.string().email().optional(),
  cnpj: z.string().max(18).optional(),
  contato_nome: z.string().max(100).optional(),
});

const updateSchema = createSchema.omit({ restaurante_id: true }).partial().extend({
  ativo: z.boolean().optional(),
});

export async function fornecedorRoutes(app: FastifyInstance) {
  
  app.get<{ Params: { restauranteId: string } }>(
    "/restaurantes/:restauranteId/fornecedores",
    async (req, reply) => {
      const params = validate(restauranteParam, req.params, reply);
      if (!params) return;
      return reply.send(await svc.listarPorRestaurante(params.restauranteId));
    }
  );

  app.get<{ Params: { id: string } }>("/fornecedores/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    const f = await svc.buscarPorId(params.id);
    if (!f) return reply.status(404).send({ error: "Fornecedor não encontrado" });
    return reply.send(f);
  });

  app.post("/fornecedores", async (req, reply) => {
    const body = validate(createSchema, req.body, reply);
    if (!body) return;
    return reply.status(201).send(await svc.criar(body));
  });

  // POST /fornecedores/importar — importação em lote via texto colado
  const importSchema = z.object({
    restaurante_id: z.number().int().positive(),
    fornecedores: z.array(
      z.object({
        nome: z.string().min(2).max(100).trim(),
        telefone: z.string().regex(telefoneRegex, "Telefone deve ter 10 ou 11 dígitos"),
        departamento: z.string().max(100).optional(), // apenas para referência, não é FK aqui
        email: z.string().email().optional(),
        contato_nome: z.string().max(100).optional(),
      })
    ).min(1, "Nenhum fornecedor para importar"),
  });

  app.post("/fornecedores/importar", async (req, reply) => {
    const body = validate(importSchema, req.body, reply);
    if (!body) return;

    let criados = 0;
    let ignorados = 0;

    for (const f of body.fornecedores) {
      // Verifica se já existe fornecedor com mesmo telefone neste restaurante
      const existente = await svc.buscarPorTelefone(body.restaurante_id, f.telefone);
      if (existente) {
        ignorados++;
        continue;
      }
      await svc.criar({ ...f, restaurante_id: body.restaurante_id });
      criados++;
    }

    return reply.status(201).send({
      message: `Importação concluída: ${criados} criado(s), ${ignorados} ignorado(s) (duplicatas).`,
      criados,
      ignorados,
    });
  });

  app.put<{ Params: { id: string } }>("/fornecedores/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    const body = validate(updateSchema, req.body, reply);
    if (!body) return;
    try {
      return reply.send(await svc.atualizar(params.id, body));
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  app.delete<{ Params: { id: string } }>("/fornecedores/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    try {
      await svc.deletar(params.id);
      return reply.status(204).send();
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
}