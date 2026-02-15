import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail(params: {
  to: string;
  futName: string;
  inviteToken: string;
  playerName: string;
}): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const inviteLink = `${frontendUrl}/invite/${params.inviteToken}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Pelego <onboarding@resend.dev>',
    to: params.to,
    subject: `Você foi convidado para o ${params.futName}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">Olá!</h2>
        <p style="color: #333; line-height: 1.6;">
          Você foi convidado para participar do <strong>${params.futName}</strong>
          como jogador vinculado ao perfil <strong>${params.playerName}</strong>.
        </p>
        <p style="margin: 24px 0;">
          <a href="${inviteLink}"
             style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Aceitar convite
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          O link expira em 7 dias. Se você não solicitou este convite, ignore este email.
        </p>
      </div>
    `,
  });
}
