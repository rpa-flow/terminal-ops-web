import { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

const parseForwardedFor = (forwardedHeader: string): string | undefined => {
  const firstEntry = forwardedHeader.split(",")[0]?.trim();
  if (!firstEntry) {
    return undefined;
  }

  const match = firstEntry.match(/for=(?:"?\[?([^\]";,]+)\]?"?)/i);
  const value = match?.[1]?.trim();

  if (!value || value.toLowerCase() === "unknown" || value.startsWith("_")) {
    return undefined;
  }

  return value;
};

const isHostedBehindTrustedProxy = Boolean(process.env.VERCEL) || Boolean(process.env.VERCEL_URL);

export const rateLimitKeyGenerator = (req: Request): string => {
  let clientIp: string | undefined;

  if (isHostedBehindTrustedProxy) {
    const fromForwarded = parseForwardedFor(req.header("forwarded") ?? "");
    if (fromForwarded) {
      clientIp = fromForwarded;
    }

    if (!clientIp) {
      const fromXForwardedFor = req.header("x-forwarded-for")?.split(",")[0]?.trim();
      if (fromXForwardedFor) {
        clientIp = fromXForwardedFor;
      }
    }
  }

  clientIp ||= req.ip || req.socket.remoteAddress || "127.0.0.1";
  return ipKeyGenerator(clientIp);
};

export const rateLimitValidationConfig = {
  forwardedHeader: false,
  xForwardedForHeader: false
} as const;
