import { Resend } from "resend";

export interface MailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let client: Resend | null = null;

function getClient(): Resend {
  if (client) return client;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY deve estar definida no .env para envio de e-mail");
  }

  client = new Resend(apiKey);
  return client;
}

export async function sendMail(payload: MailPayload): Promise<void> {
  const from = process.env.RESEND_FROM ?? "Tax Flow <onboarding@resend.dev>";
  const resend = getClient();

  const { error } = await resend.emails.send({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });

  if (error) {
    throw new Error(`Resend: ${error.message}`);
  }
}

export function __resetTransporterForTests(): void {
  client = null;
}
