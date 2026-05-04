import bcrypt from "bcryptjs";
import db from "../db/connection";
import { LoginInput, RegisterInput } from "../schemas";

export class AuthService {
    async registrar({ nome, email, senha, cnpj }: RegisterInput) {
        const restaurante = await db('restaurantes')
            .where({ cnpj })
            .first();

        if (!restaurante) {
            throw new Error("CNPJ não encontrado. Verifique e tente novamente.");
        }

        const emailExistente = await db("usuarios").where({ email }).first();
        if (emailExistente) {
            throw new Error("Email já cadastrado. Tente fazer login ou use outro email.");
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
            throw new Error("Email ou senha incorretos.");
        }

        const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaOk) {
            throw new Error("Email ou senha incorretos.");
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
            throw new Error("Usuário não encontrado.");
        }

        const restaurante = await db("restaurantes")
            .where({ id: usuario.restaurante_id })
            .first();

        return { usuario, restaurante };
    }
}