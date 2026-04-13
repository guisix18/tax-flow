import nodemailer, { type Transporter } from "nodemailer";

export interface MailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP_HOST, SMTP_USER e SMTP_PASS devem estar definidos no .env para envio de e-mail",
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user, pass },
  });

  return cachedTransporter;
}

export async function sendMail(payload: MailPayload): Promise<void> {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}

// exposto para testes poderem resetar o transporter cacheado
export function __resetTransporterForTests(): void {
  cachedTransporter = null;
}
