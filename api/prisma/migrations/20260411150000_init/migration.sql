CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_hora TIMESTAMP NOT NULL,
  numero_nota VARCHAR(64) NOT NULL,
  nota_original VARCHAR(255) NOT NULL,
  status VARCHAR(64) NOT NULL,
  motorista_nome VARCHAR(120) NOT NULL,
  motorista_celular VARCHAR(24) NOT NULL,
  placa VARCHAR(16) NOT NULL,
  terminal VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS records_data_hora_idx ON records (data_hora);
CREATE INDEX IF NOT EXISTS records_status_idx ON records (status);
CREATE INDEX IF NOT EXISTS records_motorista_nome_idx ON records (motorista_nome);
CREATE INDEX IF NOT EXISTS records_placa_idx ON records (placa);
CREATE INDEX IF NOT EXISTS records_terminal_idx ON records (terminal);
