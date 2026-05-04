// src/errors/httpError.ts

import { AppError } from "./AppError";

export const httpError = {
  badRequest: (msg = "Requisição inválida") => new AppError(msg, 400),

  unauthorized: (msg = "Não autorizado") => new AppError(msg, 401),

  forbidden: (msg = "Acesso proibido") => new AppError(msg, 403),

  notFound: (msg = "Recurso não encontrado") => new AppError(msg, 404),

  conflict: (msg = "Conflito de dados") => new AppError(msg, 409),

  internal: (msg = "Erro interno do servidor") => new AppError(msg, 500),
};