import type { Knex } from "knex";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      
    },
    migrations: {
      directory: "./migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./seeds",
      extension: "ts",
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  production: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: "./migrations",
      extension: "js",
    },
    seeds: {
      directory: "./seeds",
      extension: "js",
    },
    pool: {
      min: 2,
      max: 20,
    },
  },
};

export default config;
