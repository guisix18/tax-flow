export interface MailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(payload: MailPayload): Promise<void> {
  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error("MAILJET_API_KEY e MAILJET_SECRET_KEY devem estar definidas no .env");
  }

  const fromEmail = process.env.MAILJET_FROM_EMAIL;
  const fromName = process.env.MAILJET_FROM_NAME ?? "Tax Flow";

  if (!fromEmail) {
    throw new Error("MAILJET_FROM_EMAIL deve estar definida no .env");
  }

  const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");

  const res = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Messages: [
        {
          From: { Email: fromEmail, Name: fromName },
          To: [{ Email: payload.to }],
          Subject: payload.subject,
          TextPart: payload.text,
          HTMLPart: payload.html,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mailjet ${res.status}: ${body}`);
  }
}

export function __resetTransporterForTests(): void {
  // sem estado a resetar — função pura
}
