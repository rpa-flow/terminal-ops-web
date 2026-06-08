import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config";
import { rateLimitKeyGenerator, rateLimitValidationConfig } from "./lib/rate-limit";
import { errorHandler } from "./middlewares/error-handler";
import { notFoundHandler } from "./middlewares/not-found";
import { csrfProtection } from "./middlewares/csrf-protection";
import { enforceHttps } from "./middlewares/enforce-https";
import { authRoutes } from "./routes/auth.routes";
import { docsRoutes } from "./routes/docs.routes";
import { ingestRoutes } from "./routes/ingest.routes";
import { provisionRoutes } from "./routes/provision.routes";
import { recordRoutes } from "./routes/record.routes";
import { noteRoutes } from "./routes/note.routes";
import { catalogRoutes } from "./routes/catalog.routes";
import { purchaseOrderRuleRoutes } from "./routes/purchase-order-rule.routes";

const app = express();

const trustProxy = env.TRUST_PROXY === 1 || Boolean(process.env.VERCEL) ? 1 : 0;
app.set("trust proxy", trustProxy);
app.disable("x-powered-by");

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" }
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: false,
    methods: ["GET", "POST", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"]
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    keyGenerator: rateLimitKeyGenerator,
    validate: rateLimitValidationConfig,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Try again later." }
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(enforceHttps);
app.use(
  morgan(env.NODE_ENV === "production" ? "tiny" : "dev", {
    skip: (req) => req.path.includes("/health")
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/docs", docsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/provision", provisionRoutes);
app.use("/api/records", csrfProtection, recordRoutes);
app.use("/api/notes", csrfProtection, noteRoutes);
app.use("/api/catalog", csrfProtection, catalogRoutes);
app.use("/api/purchase-order-rules", csrfProtection, purchaseOrderRuleRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
export default app;
