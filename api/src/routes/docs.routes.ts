import { Router } from "express";

const docsRoutes = Router();

const recordPayloadSchema = {
  type: "object",
  additionalProperties: false,
  required: ["dataHora", "nota", "motorista", "veiculo", "terminal"],
  properties: {
    dataHora: {
      type: "string",
      example: "2026-04-11 14:32:00"
    },
    nota: {
      type: "object",
      additionalProperties: false,
      required: ["numero", "original", "status"],
      properties: {
        numero: { type: "string", example: "12345" },
        original: { type: "string", example: "VALOR ORIGINAL" },
        status: { type: "string", example: "PROCESSADO" }
      }
    },
    motorista: {
      type: "object",
      additionalProperties: false,
      required: ["nome", "celular"],
      properties: {
        nome: { type: "string", example: "Joao" },
        celular: { type: "string", example: "31999999999" }
      }
    },
    veiculo: {
      type: "object",
      additionalProperties: false,
      required: ["placa"],
      properties: {
        placa: { type: "string", example: "ABC1234" }
      }
    },
    terminal: { type: "string", example: "Terminal 1" }
  }
} as const;

const recordResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string", example: "clx1234567890" },
    dataHora: { type: "string", format: "date-time", example: "2026-04-11T17:32:00.000Z" },
    numeroNota: { type: "string", example: "12345" },
    notaOriginal: { type: "string", example: "VALOR ORIGINAL" },
    status: { type: "string", example: "PROCESSADO" },
    motoristaNome: { type: "string", example: "Joao" },
    motoristaCelular: { type: "string", example: "31999999999" },
    placa: { type: "string", example: "ABC1234" },
    terminal: { type: "string", example: "Terminal 1" },
    createdAt: { type: "string", format: "date-time", example: "2026-04-11T17:32:00.000Z" }
  }
} as const;

const buildOpenApiDocument = (baseUrl: string) => ({
  openapi: "3.0.3",
  info: {
    title: "RPA Ops Platform API",
    version: "1.0.0",
    description: "Documentacao interativa para testar os endpoints da API."
  },
  servers: [
    {
      url: baseUrl,
      description: "Servidor atual"
    }
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Ingest" },
    { name: "Provision" },
    { name: "Records" },
    { name: "PurchaseOrderRules" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      },
      ingestApiKey: {
        type: "apiKey",
        in: "header",
        name: "x-api-key"
      },
      provisionApiKey: {
        type: "apiKey",
        in: "header",
        name: "x-provision-key"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Unauthorized" }
        }
      },
      LoginRequest: {
        type: "object",
        additionalProperties: false,
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@admin.com" },
          password: { type: "string", example: "123456" }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          user: {
            type: "object",
            properties: {
              id: { type: "string", example: "clx1234567890" },
              email: { type: "string", format: "email", example: "admin@admin.com" }
            }
          }
        }
      },
      MeResponse: {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              userId: { type: "string", example: "clx1234567890" },
              email: { type: "string", format: "email", example: "admin@admin.com" }
            }
          }
        }
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" }
        }
      },
      CreateUserRequest: {
        type: "object",
        additionalProperties: false,
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "novo@example.com" },
          password: { type: "string", minLength: 8, example: "suasenha123" }
        }
      },
      CreateUserResponse: {
        type: "object",
        properties: {
          id: { type: "string", example: "clx1234567890" },
          email: { type: "string", format: "email", example: "novo@example.com" },
          createdAt: { type: "string", format: "date-time", example: "2026-04-11T17:32:00.000Z" }
        }
      },
      RecordPayload: recordPayloadSchema,
      RecordResponse: recordResponseSchema,
      RecordsListResponse: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          perPage: { type: "integer", example: 20 },
          total: { type: "integer", example: 1 },
          items: {
            type: "array",
            items: recordResponseSchema
          }
        }
      },
      UpdateRecordStatusRequest: {
        type: "object",
        additionalProperties: false,
        required: ["status"],
        properties: {
          status: { type: "string", example: "PROCESSADO" },
          numeroOriginal: {
            type: "string",
            example: "NF-ORIGINAL-0001",
            description: "Opcional. Quando enviado, atualiza notaOriginal do registro selecionado"
          }
        }
      },

      PurchaseOrderRule: {
        type: "object",
        properties: {
          id: { type: "string" }, materialId: { type: "string" }, supplierId: { type: "string" },
          purchaseOrderCode: { type: "string" }, purchaseOrderType: { type: "string" }, isActive: { type: "boolean" }
        }
      },
      CsvUploadResponse: {
        type: "object",
        properties: {
          inserted: { type: "integer", example: 10 },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                row: { type: "integer", example: 4 },
                message: { type: "string", example: "Failed to save record" }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check da API",
        responses: {
          "200": {
            description: "API ativa",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" }
              }
            }
          }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Autentica um usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Login efetuado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" }
              }
            }
          },
          "401": {
            description: "Credenciais invalidas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Retorna o usuario autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Usuario autenticado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MeResponse" }
              }
            }
          },
          "401": {
            description: "Nao autenticado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/ingest/records": {
      post: {
        tags: ["Ingest"],
        summary: "Ingestao direta de registro com API key",
        security: [{ ingestApiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RecordPayload" }
            }
          }
        },
        responses: {
          "201": {
            description: "Registro criado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordResponse" }
              }
            }
          },
          "401": {
            description: "API key invalida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/provision/users": {
      post: {
        tags: ["Provision"],
        summary: "Cria usuario com chave de provisionamento",
        security: [{ provisionApiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Usuario criado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateUserResponse" }
              }
            }
          },
          "401": {
            description: "Chave invalida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "409": {
            description: "Email ja em uso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/records": {
      get: {
        tags: ["Records"],
        summary: "Lista registros",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "page", schema: { type: "integer", default: 1 } },
          { in: "query", name: "perPage", schema: { type: "integer", default: 20, maximum: 100 } },
          { in: "query", name: "startDate", schema: { type: "string", example: "2026-04-11T00:00" } },
          { in: "query", name: "endDate", schema: { type: "string", example: "2026-04-11T23:59" } },
          { in: "query", name: "status", schema: { type: "string", example: "PROCESSADO" } },
          { in: "query", name: "motorista", schema: { type: "string", example: "Joao" } },
          { in: "query", name: "placa", schema: { type: "string", example: "ABC1234" } },
          { in: "query", name: "terminal", schema: { type: "string", example: "Terminal 1" } }
        ],
        responses: {
          "200": {
            description: "Lista paginada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordsListResponse" }
              }
            }
          },
          "401": {
            description: "Nao autenticado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      post: {
        tags: ["Records"],
        summary: "Cria registro autenticado",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RecordPayload" }
            }
          }
        },
        responses: {
          "201": {
            description: "Registro criado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordResponse" }
              }
            }
          },
          "401": {
            description: "Nao autenticado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/records/csv": {
      post: {
        tags: ["Records"],
        summary: "Importa registros por CSV",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: {
                    type: "string",
                    format: "binary"
                  }
                }
              }
            }
          }
        },
        responses: {
          "207": {
            description: "Arquivo processado com sucesso parcial ou total",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CsvUploadResponse" }
              }
            }
          },
          "400": {
            description: "Arquivo invalido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/ingest/records/{numeroNota}/status": {
      post: {
        tags: ["Records"],
        summary: "Atualiza o status do registro mais recente pela nota (ingest key)",
        security: [{ ingestApiKey: [] }],
        parameters: [
          {
            in: "path",
            name: "numeroNota",
            required: true,
            schema: { type: "string", example: "12345" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateRecordStatusRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Registro atualizado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordResponse" }
              }
            }
          },
          "404": {
            description: "Registro nao encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      patch: {
        tags: ["Records"],
        summary: "Atualiza o status do registro mais recente pela nota (ingest key)",
        security: [{ ingestApiKey: [] }],
        parameters: [
          {
            in: "path",
            name: "numeroNota",
            required: true,
            schema: { type: "string", example: "12345" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateRecordStatusRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Registro atualizado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordResponse" }
              }
            }
          },
          "404": {
            description: "Registro nao encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    }
  }
});

docsRoutes.get("/openapi.json", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.status(200).json(buildOpenApiDocument(baseUrl));
});

docsRoutes.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body {
        margin: 0;
        background: #f5f7fb;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/docs/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        displayRequestDuration: true,
        persistAuthorization: true
      });
    </script>
  </body>
</html>`);
});

export { docsRoutes };
