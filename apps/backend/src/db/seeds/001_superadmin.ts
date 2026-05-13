import type { Knex } from "knex";
import bcrypt from "bcryptjs";

/**
 * Seed: Superadmin da plataforma CotaWeb
 *
 * Cria o usuário administrador da plataforma (sem restaurante_id),
 * que tem acesso ao painel admin para gerenciar restaurantes clientes.
 *
 * Credenciais:
 *   email: admin@cotaweb.com
 *   senha: cotaweb@admin
 */
export async function seed(knex: Knex): Promise<void> {
  await knex("usuarios").where({ email: "admin@cotaweb.com" }).del();

  const senhaHash = await bcrypt.hash("cotaweb@admin", 12);

  await knex("usuarios").insert({
    nome: "Admin CotaWeb",
    email: "admin@cotaweb.com",
    senha_hash: senhaHash,
    restaurante_id: null,
    cargo: "admin",
    ativo: true,
  });

  console.log("✅ Superadmin criado:");
  console.log("   email: admin@cotaweb.com");
  console.log("   senha: cotaweb@admin");
  console.log("   cargo: admin | restaurante_id: null (superadmin da plataforma)");
}
