-- 1. Crear la nueva tabla para el desglose diario
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

-- 2. Crear un índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_externo_task_daily_consumption_taskid ON "externo_task_daily_consumption" ("taskid");


-- 3. (Opcional pero recomendado) Migrar datos si ya existen en la columna JSONB.
-- Este es un paso complejo y debe ser adaptado. Este script es un ejemplo.
-- Es mejor ejecutarlo manualmente después de revisar los datos.
--
-- DO $$
-- DECLARE
--     task_record RECORD;
--     consumption_item JSONB;
-- BEGIN
--     FOR task_record IN SELECT id, dailyconsumption FROM externo_tasks WHERE dailyconsumption IS NOT NULL AND jsonb_array_length(dailyconsumption) > 0 LOOP
--         FOR consumption_item IN SELECT * FROM jsonb_array_elements(task_record.dailyconsumption) LOOP
--             INSERT INTO externo_task_daily_consumption (taskid, date, planned_quantity, consumed_quantity, verified_quantity, details)
--             VALUES (
--                 task_record.id,
--                 (consumption_item->>'date')::date,
--                 (consumption_item->>'plannedQuantity')::numeric,
--                 (consumption_item->>'consumedQuantity')::numeric,
--                 0, -- Valor por defecto para la nueva columna
--                 '' -- Valor por defecto para la nueva columna
--             )
--             ON CONFLICT (taskid, date) DO NOTHING;
--         END LOOP;
--     END LOOP;
-- END $$;


-- 4. Eliminar la columna `dailyconsumption` de la tabla `externo_tasks`
ALTER TABLE "externo_tasks" DROP COLUMN IF EXISTS "dailyconsumption";
