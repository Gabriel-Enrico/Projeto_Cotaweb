import { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../db/errors/AppError";

export async function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {

    if (error instanceof ZodError) {
      const formattedMessage = error.issues.map(i => i.message).join(", ");
      return reply.status(400).send({
        success: false,
        message: formattedMessage,
        details: error.errors,
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        message: error.message,
      });
    }

    console.error(error);

    return reply.status(500).send({
      success: false,
      error: "Erro interno do servidor",
    });
  });
}