import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config";
import { errorHandler } from "./middlewares/error-handler";
import { notFoundHandler } from "./middlewares/not-found";
import { csrfProtection } from "./middlewares/csrf-protection";
import { enforceHttps } from "./middlewares/enforce-https";
import { authRoutes } from "./routes/auth.routes";
import { ingestRoutes } from "./routes/ingest.routes";
import { provisionRoutes } from "./routes/provision.routes";
import { recordRoutes } from "./routes/record.routes";

const app = express();

app.set("trust proxy", env.TRUST_PROXY);
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

app.use("/api/auth", authRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/provision", provisionRoutes);
app.use("/api/records", csrfProtection, recordRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
export default app;