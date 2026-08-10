import "server-only";

import { PayOS } from "@payos/node";

let payOSClient: PayOS | null | undefined;

export function isPayOSConfigured() {
  return Boolean(
    process.env.PAYOS_CLIENT_ID
    && process.env.PAYOS_API_KEY
    && process.env.PAYOS_CHECKSUM_KEY
  );
}

export function getPayOSClient() {
  if (payOSClient !== undefined) return payOSClient;

  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  if (!isPayOSConfigured() || !clientId || !apiKey || !checksumKey) {
    payOSClient = null;
    return payOSClient;
  }

  payOSClient = new PayOS({ clientId, apiKey, checksumKey });
  return payOSClient;
}
