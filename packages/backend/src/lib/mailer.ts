export interface MailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(payload: MailPayload): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY deve estar definida no .env para envio de e-mail");
  }

  const fromEmail = process.env.BREVO_FROM_EMAIL ?? "noreply@taxflow.com";
  const fromName = process.env.BREVO_FROM_NAME ?? "Tax Flow";

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: payload.to }],
      subject: payload.subject,
      textContent: payload.text,
      htmlContent: payload.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo ${res.status}: ${body}`);
  }
}

export function __resetTransporterForTests(): void {
  // sem estado a resetar — função pura
}
