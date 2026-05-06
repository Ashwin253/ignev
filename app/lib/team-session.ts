import { createHmac, timingSafeEqual } from "crypto";

type TeamSessionPayload = {
  mobile: string;
  exp: number;
};

const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function getSecret() {
  return process.env.TEAM_SESSION_SECRET || "";
}

function signPayload(payloadBase64: string) {
  const secret = getSecret();
  if (!secret) {
    throw new Error("Missing TEAM_SESSION_SECRET.");
  }

  return createHmac("sha256", secret).update(payloadBase64).digest("hex");
}

export function createTeamSessionToken(mobile: string) {
  const payload: TeamSessionPayload = {
    mobile,
    exp: Date.now() + SESSION_TTL_MS,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyTeamSessionToken(token?: string | null): TeamSessionPayload | null {
  if (!token) return null;

  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  const expected = signPayload(payloadBase64);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString()) as TeamSessionPayload;
    if (!payload.mobile || !payload.exp || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
