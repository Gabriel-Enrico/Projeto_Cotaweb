import { z } from "zod";

const telefoneRegex = /^\d{10,11}$/;

const idParam = z.object({
  id: z.coerce.number({ invalid_type_error: "ID deve ser um número" }).int().positive("ID deve ser positivo"),
});

export const createFornecedorSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório" })
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(100)
    .trim(),
  telefone: z
    .string({ required_error: "Telefone é obrigatório" })
    .regex(telefoneRegex, "Telefone deve conter apenas números (10 ou 11 dígitos, sem espaços ou traços)"),
});

export const updateFornecedorSchema = createFornecedorSchema.partial();

export const fornecedorIdParamSchema = idParam;

export const createItemSchema = z.object({
  produto: z
    .string({ required_error: "Produto é obrigatório" })
    .min(1, "Produto deve ter ao menos 1 caractere")
    .max(100)
    .trim(),
  quantidade: z
    .number({ required_error: "Quantidade é obrigatória" })
    .positive("Quantidade deve ser positiva")
    .max(999999),
  unidade: z
    .string({ required_error: "Unidade é obrigatória" })
    .min(1)
    .max(30)
    .trim()
    .default("un"),
});

export const updateItemSchema = createItemSchema.partial();

export const itemIdParamSchema = idParam;

export type CreateFornecedorInput = z.infer<typeof createFornecedorSchema>;
export type UpdateFornecedorInput = z.infer<typeof updateFornecedorSchema>;

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
