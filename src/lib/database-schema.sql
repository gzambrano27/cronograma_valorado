-- Tabla para almacenar las tareas de los proyectos.
CREATE TABLE IF NOT EXISTS "externo_tasks" (
    "id" SERIAL PRIMARY KEY,
    "projectid" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "quantity" NUMERIC(14, 2) DEFAULT 0,
    "consumedquantity" NUMERIC(14, 2) DEFAULT 0,
    "cost" NUMERIC(14, 2) DEFAULT 0,
    "value" NUMERIC(14, 2) DEFAULT 0,
    "startdate" TIMESTAMP WITH TIME ZONE,
    "enddate" TIMESTAMP WITH TIME ZONE,
    "status" VARCHAR(50) DEFAULT 'pendiente',
    "displayorder" INTEGER,
    "partner_id" INTEGER,
    CONSTRAINT fk_project
      FOREIGN KEY("projectid")
	  REFERENCES "project_project"("id")
	  ON DELETE CASCADE,
    CONSTRAINT fk_partner
        FOREIGN KEY("partner_id")
        REFERENCES "res_partner"("id")
        ON DELETE SET NULL
);

-- Tabla para el desglose diario de consumo de las tareas.
CREATE TABLE IF NOT EXISTS "externo_task_daily_consumption" (
    "id" SERIAL PRIMARY KEY,
    "taskid" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "planned_quantity" NUMERIC(14, 2) DEFAULT 0,
    "consumed_quantity" NUMERIC(14, 2) DEFAULT 0,
    "verified_quantity" NUMERIC(14, 2) DEFAULT 0,
    "details" TEXT,
    CONSTRAINT fk_task_consumption
      FOREIGN KEY("taskid")
	  REFERENCES "externo_tasks"("id")
	  ON DELETE CASCADE,
    UNIQUE("taskid", "date") -- Asegura que solo haya un registro por tarea y día.
);


-- Comentarios sobre las columnas de "externo_tasks":
-- "id": Identificador único de la tarea.
-- "projectid": Clave foránea al proyecto en "project_project".
-- "name": Nombre de la tarea.
-- "quantity": Cantidad total planificada.
-- "consumedquantity": Cantidad real consumida total (agregada).
-- "value": Valor unitario (PVP).
-- "startdate": Fecha de inicio planificada.
-- "enddate": Fecha de fin planificada.
-- "status": Estado actual ('pendiente', 'en-progreso', 'completado').
-- "displayorder": Campo para el ordenamiento visual.
-- "partner_id": Clave foránea al proveedor en "res_partner".

-- Tabla para almacenar las validaciones de las tareas (evidencia fotográfica).
CREATE TABLE IF NOT EXISTS "externo_task_validations" (
    "id" SERIAL PRIMARY KEY,
    "taskid" INTEGER NOT NULL,
    "userid" INTEGER,
    "date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "imageurl" TEXT NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    CONSTRAINT fk_task
      FOREIGN KEY("taskid")
	  REFERENCES "externo_tasks"("id")
	  ON DELETE CASCADE,
    CONSTRAINT fk_user
      FOREIGN KEY("userid")
      REFERENCES "res_users"("id")
      ON DELETE SET NULL
);

-- Comentarios sobre las columnas de "externo_task_validations":
-- "id": Identificador único de la validación.
-- "taskid": Clave foránea a la tarea en "externo_tasks".
-- "userid": Clave foránea al usuario en "res_users". Se establece en NULL si el usuario se elimina.
-- "date": Fecha y hora del registro.
-- "imageurl": URL de la imagen de evidencia (Data URI base64).
-- "location": Coordenadas de geolocalización.
-- "notes": Descripción textual de la validación.

-- Índices para mejorar el rendimiento de las consultas.
CREATE INDEX IF NOT EXISTS idx_externo_tasks_projectid ON "externo_tasks" ("projectid");
CREATE INDEX IF NOT EXISTS idx_externo_task_validations_taskid ON "externo_task_validations" ("taskid");
CREATE INDEX IF NOT EXISTS idx_externo_task_validations_userid ON "externo_task_validations" ("userid");
CREATE INDEX IF NOT EXISTS idx_externo_tasks_partner_id ON "externo_tasks" ("partner_id");
CREATE INDEX IF NOT EXISTS idx_externo_task_daily_consumption_taskid ON "externo_task_daily_consumption" ("taskid");
