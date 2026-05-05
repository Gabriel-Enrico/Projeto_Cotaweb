import type { Knex } from "knex";
import bcrypt from "bcryptjs";

/**
 * Seed: usuário de teste
 *
 * Pré-requisito: seed 002_cotaweb_dados.ts já ter rodado
 * (o restaurante com CNPJ 12.345.678/0001-99 precisa existir)
 *
 * Credenciais criadas:
 *   admin    → admin@cotaweb.dev   / admin123
 *   operador → op@cotaweb.dev      / op123456
 */
export async function seed(knex: Knex): Promise<void> {
  // Remove apenas os usuários de teste para poder re-rodar sem erro de unique
  await knex("usuarios")
    .whereIn("email", ["admin@cotaweb.dev", "op@cotaweb.dev"])
    .del();

  const restaurante = await knex("restaurantes")
    .where({ cnpj: "12.345.678/0001-99" })
    .first();

  if (!restaurante) {
    console.error(
      "❌ Restaurante não encontrado. Rode o seed 002_cotaweb_dados primeiro."
    );
    return;
  }

  const [adminHash, opHash] = await Promise.all([
    bcrypt.hash("admin123", 12),
    bcrypt.hash("op123456", 12),
  ]);

  await knex("usuarios").insert([
    {
      nome: "Admin Teste",
      email: "admin@cotaweb.dev",
      senha_hash: adminHash,
      restaurante_id: restaurante.id,
      cargo: "admin",
      ativo: true,
    },
    {
      nome: "Operador Teste",
      email: "op@cotaweb.dev",
      senha_hash: opHash,
      restaurante_id: restaurante.id,
      cargo: "operador",
      ativo: true,
    },
  ]);

  console.log("✅ Usuários de teste criados:");
  console.log("   admin@cotaweb.dev   / admin123  (cargo: admin)");
  console.log("   op@cotaweb.dev      / op123456  (cargo: operador)");
  console.log(`   restaurante_id: ${restaurante.id}`);
}