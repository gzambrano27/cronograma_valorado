
-- Tabla para almacenar las tareas importadas desde MS Project o creadas manualmente.
CREATE TABLE "externo_tasks" (
  "id" SERIAL PRIMARY KEY,
  "projectid" INT,
  "name" VARCHAR(255) NOT NULL,
  "quantity" NUMERIC(14, 4) DEFAULT 0,
  "consumedquantity" NUMERIC(14, 4) DEFAULT 0,
  "value" NUMERIC(14, 2),
  "cost" NUMERIC(14, 2),
  "startdate" TIMESTAMPTZ,
  "enddate" TIMESTAMPTZ,
  "status" VARCHAR(50) DEFAULT 'pendiente',
  "level" INT,
  "parentid" INT,
  "partner_id" INT,
  FOREIGN KEY ("parentid") REFERENCES "externo_tasks"("id") ON DELETE CASCADE,
  FOREIGN KEY ("partner_id") REFERENCES "res_partner"("id") ON DELETE SET NULL
);

-- Tabla para almacenar el desglose de consumo diario de cada tarea.
CREATE TABLE "externo_task_daily_consumption" (
  "id" SERIAL PRIMARY KEY,
  "taskid" INT NOT NULL,
  "date" DATE NOT NULL,
  "planned_quantity" NUMERIC(14, 4) DEFAULT 0,
  "consumed_quantity" NUMERIC(14, 4) DEFAULT 0,
  "verified_quantity" NUMERIC(14, 4) DEFAULT 0,
  "details" TEXT,
  UNIQUE ("taskid", "date"),
  FOREIGN KEY ("taskid") REFERENCES "externo_tasks"("id") ON DELETE CASCADE
);

-- Tabla para almacenar las validaciones (fotos, geolocalización) de las tareas.
CREATE TABLE "externo_task_validations" (
  "id" SERIAL PRIMARY KEY,
  "taskid" INT NOT NULL,
  "date" TIMESTAMPTZ NOT NULL,
  "imageurl" TEXT NOT NULL,
  "location" VARCHAR(255) NOT NULL,
  "userid" INT,
  "notes" TEXT,
  FOREIGN KEY ("taskid") REFERENCES "externo_tasks"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userid") REFERENCES "res_users"("id") ON DELETE SET NULL
);
