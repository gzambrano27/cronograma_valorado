-- Este archivo define el esquema de las tablas personalizadas que la aplicación
-- utiliza en la base de datos de Odoo para almacenar información extendida 
-- sobre los proyectos.

-- Tabla para almacenar las tareas de los proyectos importadas o creadas
-- desde la aplicación. Esta tabla extiende la funcionalidad de los proyectos
-- de Odoo (project.project).

CREATE TABLE IF NOT EXISTS "externo_tasks" (
    "id" SERIAL PRIMARY KEY,
    "projectid" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "quantity" NUMERIC(14, 2) DEFAULT 0,
    "consumedquantity" NUMERIC(14, 2) DEFAULT 0,
    "value" NUMERIC(14, 2) DEFAULT 0,
    "startdate" TIMESTAMP WITH TIME ZONE,
    "enddate" TIMESTAMP WITH TIME ZONE,
    "status" VARCHAR(50) DEFAULT 'pendiente',
    "dailyconsumption" JSONB,
    "displayorder" INTEGER, -- Campo de orden de Odoo
    CONSTRAINT fk_project
      FOREIGN KEY("projectid") 
	  REFERENCES "project_project"("id")
	  ON DELETE CASCADE
);

-- Comentarios sobre las columnas de "externo_tasks":
-- "id": Identificador único de la tarea.
-- "projectid": Referencia al ID del proyecto en la tabla "project_project" de Odoo.
-- "name": Nombre de la tarea.
-- "quantity": Cantidad total planificada para la tarea.
-- "consumedquantity": Cantidad real consumida o completada de la tarea.
-- "value": Valor unitario (PVP) de la tarea.
-- "startdate": Fecha de inicio planificada.
-- "enddate": Fecha de fin planificada.
-- "status": Estado actual de la tarea ('pendiente', 'en-progreso', 'completado').
-- "dailyconsumption": Objeto JSON que almacena el desglose diario del consumo.
-- "displayorder": Campo utilizado por Odoo para el ordenamiento visual.

-- Tabla para almacenar las validaciones de las tareas, que incluyen
-- evidencia fotográfica y geolocalización.

CREATE TABLE IF NOT EXISTS "externo_task_validations" (
    "id" SERIAL PRIMARY KEY,
    "taskid" INTEGER NOT NULL,
    "date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "imageurl" TEXT NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "userid" INTEGER,
    CONSTRAINT fk_task
      FOREIGN KEY("taskid") 
	  REFERENCES "externo_tasks"("id")
	  ON DELETE CASCADE
);

-- Comentarios sobre las columnas de "externo_task_validations":
-- "id": Identificador único de la validación.
-- "taskid": Referencia al ID de la tarea en la tabla "externo_tasks".
-- "date": Fecha y hora en que se registró la validación.
-- "imageurl": URL de la imagen de evidencia (almacenada como Data URI base64).
-- "location": Coordenadas de geolocalización (latitud, longitud).
-- "userid": ID del usuario de Odoo (res_users) que registró la validación.


-- Índices para mejorar el rendimiento de las consultas.
CREATE INDEX IF NOT EXISTS idx_externo_tasks_projectid ON "externo_tasks" ("projectid");
CREATE INDEX IF NOT EXISTS idx_externo_task_validations_taskid ON "externo_task_validations" ("taskid");
