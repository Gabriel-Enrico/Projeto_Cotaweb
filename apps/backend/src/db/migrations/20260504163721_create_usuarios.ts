import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("usuarios", table => {
        table.increments('id');
        table.string('nome', 100).notNullable();
        table.string('email', 100).unique().notNullable();
        table.string('senha_hash', 255).notNullable();
        table
            .integer('restaurante_id')
            .unsigned()
            .references('id')
            .inTable("restaurantes")
            .onDelete("SET NULL")
        table.enum("cargo", ["admin", "operador"]).defaultTo("operador");
        table.boolean("ativo").defaultTo(true);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("usuarios");
}

