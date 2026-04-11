import type { NextFunction, Request, Response } from "express";
import type { z, ZodTypeAny } from "zod";

type RequestPart = "body" | "query" | "params";

export const validate = <T extends ZodTypeAny>(schema: T, part: RequestPart = "body") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const payload = part === "body" ? req.body : part === "query" ? req.query : req.params;
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid request payload",
        details: parsed.error.issues.map((issue: z.ZodIssue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
      return;
    }

    if (part === "body") {
      req.body = parsed.data;
    } else if (part === "query") {
      res.locals.validatedQuery = parsed.data;
    } else {
      res.locals.validatedParams = parsed.data;
    }

    next();
  };
};

export type InferSchema<T extends ZodTypeAny> = z.infer<T>;