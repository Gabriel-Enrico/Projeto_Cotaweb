import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import db from "../db/connection";
import { adminMiddleware } from "../utils/adminMiddleware";
import { validate } from "../utils/validate";

const idParam = z.object({ id: z.coerce.number().int().positive() });

const createRestauranteSchema = z.object({
  nome: z.string().min(2).max(100).trim(),
  telefone: z.string().regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos"),
  email: z.string().email().optional(),
  cnpj: z.string().min(1, "CNPJ é obrigatório").max(18),
  responsavel: z.string().max(100).optional(),
  status: z.enum(["degustacao", "ativo", "suspenso", "cancelado"]).default("degustacao"),
  degustacao_inicio: z.string().optional(), // ISO date string
  usuario_nome: z.string().min(2).max(100).trim(),
  usuario_email: z.string().email().trim(),
});

const updateRestauranteSchema = createRestauranteSchema.partial();

const updateUsuarioSchema = z.object({
  ativo: z.boolean().optional(),
  cargo: z.enum(["admin", "operador"]).optional(),
});

const createUsuarioSchema = z.object({
  nome: z.string().min(2).max(100).trim(),
  email: z.string().email().trim(),
  cargo: z.enum(["admin", "operador"]).default("operador"),
  restaurante_id: z.coerce.number().int().positive(),
  senha: z.string().min(6).optional()
});

export async function adminRoutes(app: FastifyInstance) {
  // Todas as rotas aqui exigem ser superadmin (cargo=admin + sem restaurante_id)
  app.addHook("onRequest", adminMiddleware);

  // GET /admin/restaurantes — lista todos com filtros opcionais
  app.get("/admin/restaurantes", async (req, reply) => {
    const { status, busca } = req.query as { status?: string; busca?: string };

    let query = db("restaurantes").orderBy("created_at", "desc");

    if (status) {
      query = query.where({ status });
    }
    if (busca) {
      query = query.whereILike("nome", `%${busca}%`)
        .orWhereILike("cnpj", `%${busca}%`)
        .orWhereILike("responsavel", `%${busca}%`);
    }

    const restaurantes = await query;

    const ids = restaurantes.map((r: any) => r.id);

    const [fornCount, itensCount, cotCount] = await Promise.all([
      db("fornecedores").whereIn("restaurante_id", ids).groupBy("restaurante_id").select("restaurante_id").count("id as total"),
      db("itens").whereIn("restaurante_id", ids).groupBy("restaurante_id").select("restaurante_id").count("id as total"),
      db("cotacoes").whereIn("restaurante_id", ids).groupBy("restaurante_id").select("restaurante_id").count("id as total"),
    ]);

    const toMap = (rows: any[]) => Object.fromEntries(rows.map((r) => [r.restaurante_id, Number(r.total)]));
    const fMap = toMap(fornCount);
    const iMap = toMap(itensCount);
    const cMap = toMap(cotCount);

    const resultado = restaurantes.map((r: any) => ({
      ...r,
      _onboarding: {
        fornecedores: fMap[r.id] ?? 0,
        itens:        iMap[r.id] ?? 0,
        cotacoes:     cMap[r.id] ?? 0,
      },
    }));

    return reply.send(resultado);
  });

  // GET /admin/restaurantes/:id — detalhe de um restaurante
  app.get<{ Params: { id: string } }>("/admin/restaurantes/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;

    const restaurante = await db("restaurantes").where({ id: params.id }).first();
    if (!restaurante) return reply.status(404).send({ error: "Restaurante não encontrado" });

    return reply.send(restaurante);
  });

  // POST /admin/restaurantes — cria novo restaurante e seu usuário master
  app.post("/admin/restaurantes", async (req, reply) => {
    const body = validate(createRestauranteSchema, req.body, reply);
    if (!body) return;

    const { usuario_nome, usuario_email, ...restData } = body;

    const emailExistente = await db("usuarios").where({ email: usuario_email }).first();
    if (emailExistente) {
      return reply.status(400).send({ error: "Email do usuário master já está em uso por outra conta." });
    }

    const [novo] = await db("restaurantes")
      .insert({
        ...restData,
        degustacao_inicio: restData.degustacao_inicio ?? new Date().toISOString(),
      })
      .returning("*");

    const senha_hash = await bcrypt.hash("cotaweb123", 12);

    await db("usuarios").insert({
      nome: usuario_nome,
      email: usuario_email,
      senha_hash,
      cargo: "admin", // admin do restaurante
      restaurante_id: novo.id,
    });

    return reply.status(201).send(novo);
  });

  // PUT /admin/restaurantes/:id — edita dados e/ou muda status
  app.put<{ Params: { id: string } }>("/admin/restaurantes/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    const body = validate(updateRestauranteSchema, req.body, reply);
    if (!body) return;

    const existente = await db("restaurantes").where({ id: params.id }).first();
    if (!existente) return reply.status(404).send({ error: "Restaurante não encontrado" });

    // Remove user fields before updating restaurante table
    const { usuario_nome, usuario_email, ...restData } = body;

    const [atualizado] = await db("restaurantes")
      .where({ id: params.id })
      .update({ ...restData, updated_at: new Date() })
      .returning("*");

    return reply.send(atualizado);
  });

  // DELETE /admin/restaurantes/:id
  app.delete<{ Params: { id: string } }>("/admin/restaurantes/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;

    const existente = await db("restaurantes").where({ id: params.id }).first();
    if (!existente) return reply.status(404).send({ error: "Restaurante não encontrado" });

    await db("restaurantes").where({ id: params.id }).del();
    return reply.status(204).send();
  });

  // GET /admin/restaurantes/:id/usuarios — usuários de um restaurante
  app.get<{ Params: { id: string } }>("/admin/restaurantes/:id/usuarios", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;

    const usuarios = await db("usuarios")
      .where({ restaurante_id: params.id })
      .select("id", "nome", "email", "cargo", "ativo", "created_at");

    return reply.send(usuarios);
  });

  // POST /admin/usuarios — cria um usuário diretamente para um restaurante
  app.post("/admin/usuarios", async (req, reply) => {
    const body = validate(createUsuarioSchema, req.body, reply);
    if (!body) return;

    const emailExistente = await db("usuarios").where({ email: body.email }).first();
    if (emailExistente) {
      return reply.status(400).send({ error: "Email já está em uso por outra conta." });
    }

    const { senha = "cotaweb123", ...userData } = body;
    const senha_hash = await bcrypt.hash(senha, 12);

    const [novo] = await db("usuarios").insert({
      ...userData,
      senha_hash,
    }).returning(["id", "nome", "email", "cargo", "ativo", "created_at"]);

    return reply.status(201).send(novo);
  });

  // GET /admin/usuarios — lista todos os usuários (exceto superadmins)
  app.get("/admin/usuarios", async (_req, reply) => {
    const usuarios = await db("usuarios")
      .whereNotNull("restaurante_id")
      .join("restaurantes", "usuarios.restaurante_id", "restaurantes.id")
      .select(
        "usuarios.id",
        "usuarios.nome",
        "usuarios.email",
        "usuarios.cargo",
        "usuarios.ativo",
        "usuarios.created_at",
        "restaurantes.nome as restaurante_nome",
        "restaurantes.cnpj as restaurante_cnpj"
      )
      .orderBy("usuarios.created_at", "desc");

    return reply.send(usuarios);
  });

  // PUT /admin/usuarios/:id — ativa/desativa ou muda cargo
  app.put<{ Params: { id: string } }>("/admin/usuarios/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    const body = validate(updateUsuarioSchema, req.body, reply);
    if (!body) return;

    const existente = await db("usuarios").where({ id: params.id }).first();
    if (!existente) return reply.status(404).send({ error: "Usuário não encontrado" });

    const [atualizado] = await db("usuarios")
      .where({ id: params.id })
      .update({ ...body, updated_at: new Date() })
      .returning(["id", "nome", "email", "cargo", "ativo"]);

    return reply.send(atualizado);
  });

  const redefinirSenhaSchema = z.object({
    senha: z.string().min(6),
  });

  // PUT /admin/usuarios/:id/senha — redefinição manual de senha pelo admin
  app.put<{ Params: { id: string } }>("/admin/usuarios/:id/senha", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    const body = validate(redefinirSenhaSchema, req.body, reply);
    if (!body) return;

    const existente = await db("usuarios").where({ id: params.id }).first();
    if (!existente) return reply.status(404).send({ error: "Usuário não encontrado" });

    const senha_hash = await bcrypt.hash(body.senha, 12);

    await db("usuarios")
      .where({ id: params.id })
      .update({ senha_hash, updated_at: new Date() });

    return reply.status(204).send();
  });

  // GET /admin/stats — números gerais do painel
  app.get("/admin/stats", async (_req, reply) => {
    const [totalRestaurantes] = await db("restaurantes").count("id as count");
    const [ativos] = await db("restaurantes").where({ status: "ativo" }).count("id as count");
    const [degustacao] = await db("restaurantes").where({ status: "degustacao" }).count("id as count");
    const [suspensos] = await db("restaurantes").where({ status: "suspenso" }).count("id as count");
    const [totalUsuarios] = await db("usuarios").whereNotNull("restaurante_id").count("id as count");

    return reply.send({
      restaurantes: {
        total: Number(totalRestaurantes.count),
        ativos: Number(ativos.count),
        degustacao: Number(degustacao.count),
        suspensos: Number(suspensos.count),
      },
      usuarios: {
        total: Number(totalUsuarios.count),
      },
    });
  });
}