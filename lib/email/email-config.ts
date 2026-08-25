import "server-only";

export type ResendEmailConfig = {
  apiKey: string;
  from: string;
  replyTo: string | undefined;
};

function readConfiguredValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function getResendEmailConfig(): ResendEmailConfig | null {
  const apiKey = readConfiguredValue(process.env.RESEND_API_KEY);
  const from = readConfiguredValue(process.env.RESEND_FROM_EMAIL);

  if (!apiKey || !from) return null;

  return {
    apiKey,
    from,
    replyTo: readConfiguredValue(process.env.RESEND_REPLY_TO_EMAIL)
  };
}
