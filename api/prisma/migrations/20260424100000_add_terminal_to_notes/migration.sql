ALTER TABLE "notes"
ADD COLUMN "terminal" VARCHAR(120) NOT NULL DEFAULT '';

CREATE INDEX "notes_terminal_idx" ON "notes"("terminal");
