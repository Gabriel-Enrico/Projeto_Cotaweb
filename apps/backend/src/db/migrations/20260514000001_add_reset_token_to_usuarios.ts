import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("usuarios", (table) => {
    table.string("reset_token", 64).nullable().defaultTo(null);
    table.timestamp("reset_token_expires_at").nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("usuarios", (table) => {
    table.dropColumn("reset_token");
    table.dropColumn("reset_token_expires_at");
  });
}