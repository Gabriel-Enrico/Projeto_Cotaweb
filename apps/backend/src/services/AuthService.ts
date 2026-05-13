import bcrypt from "bcryptjs";
import db from "../db/connection";
import { LoginInput, RegisterInput } from "../schemas";
import { httpError } from "../db/errors/httpError";

export class AuthService {
    async registrar({ nome, email, senha, cnpj }: RegisterInput) {
        const restaurante = await db('restaurantes')
            .where({ cnpj })
            .first();

        if (!restaurante) {
            throw httpError.notFound("CNPJ não encontrado. Verifique e tente novamente.");
        }

        const emailExistente = await db("usuarios").where({ email }).first();
        if (emailExistente) {
            throw httpError.badRequest("Email já cadastrado. Tente fazer login ou use outro email.");
        }

        const senha_hash = await bcrypt.hash(senha, 12);

        const [usuario] = await db("usuarios")
            .insert({
                nome,
                email,
                senha_hash,
                restaurante_id: restaurante.id,
            })
            .returning(["id", "nome", "email", "cargo", "restaurante_id"]);

        return { usuario };
    }

    async login({ email, senha }: LoginInput) {
        const usuario = await db("usuarios")
            .where({ email, ativo: true })
            .first();

        if (!usuario) {
            throw httpError.badRequest("Email ou senha incorretos.");
        }

        const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaOk) {
            throw httpError.badRequest("Email ou senha incorretos.");
        }

        return {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            cargo: usuario.cargo,
            restaurante_id: usuario.restaurante_id,
        };
    }

    async buscarPorId(id: number) {
        const usuario = await db("usuarios")
            .where({ id, ativo: true })
            .select("id", "nome", "cargo", "restaurante_id")
            .first();

        if (!usuario) {
            throw httpError.notFound("Usuário não encontrado.");
        }

        const restaurante = await db("restaurantes")
            .where({ id: usuario.restaurante_id })
            .first();

        return { usuario, restaurante };
    }
}