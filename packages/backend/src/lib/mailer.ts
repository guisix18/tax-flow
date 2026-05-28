import nodemailer, { type Transporter } from "nodemailer";

export interface MailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Gmail SMTP fixo — se um dia trocar de provedor, mover host/port para env vars.
const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(
      "SMTP_USER e SMTP_PASS devem estar definidos no .env para envio de e-mail",
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // 587 = STARTTLS
    auth: { user, pass },
  });

  return cachedTransporter;
}

export async function sendMail(payload: MailPayload): Promise<void> {
  const from = process.env.SMTP_USER;
  const transporter = getTransporter();

  transporter.sendMail({
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
