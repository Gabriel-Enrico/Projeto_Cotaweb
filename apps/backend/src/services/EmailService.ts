import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class EmailService {
  async notificarAdminRecuperacaoSenha(
    usuarioNome: string,
    usuarioEmail: string
  ): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL não configurado nas variáveis de ambiente.");
    }

    await transporter.sendMail({
      from: `"CotaWeb" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: "⚠️ Solicitação de recuperação de senha — CotaWeb",
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #111; margin-bottom: 8px;">Solicitação de recuperação de senha</h2>
          <p style="color: #555; margin-bottom: 24px;">
            Um usuário solicitou a recuperação de acesso à plataforma CotaWeb.
            Por favor, entre em contato com ele e redefina a senha manualmente pelo painel de administração.
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; background: #fff; border: 1px solid #e5e5e5; font-weight: bold; width: 120px;">Nome</td>
              <td style="padding: 10px; background: #fff; border: 1px solid #e5e5e5;">${usuarioNome}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #fff; border: 1px solid #e5e5e5; font-weight: bold;">E-mail</td>
              <td style="padding: 10px; background: #fff; border: 1px solid #e5e5e5;">${usuarioEmail}</td>
            </tr>
          </table>
          <p style="margin-top: 24px; font-size: 12px; color: #999;">
            Esta mensagem foi gerada automaticamente pelo sistema CotaWeb.
            Não responda a este e-mail.
          </p>
        </div>
      `,
    });
  }
}