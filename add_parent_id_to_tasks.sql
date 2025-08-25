
-- Agrega la columna `level` para almacenar el nivel de anidación de la tarea (3, 4, 5).
ALTER TABLE externo_tasks
ADD COLUMN level INT;

-- Agrega la columna `parentId` que hará referencia al ID de la tarea padre en la misma tabla.
ALTER TABLE externo_tasks
ADD COLUMN parentId INT;

-- Crea una restricción de clave foránea para la columna `parentId`.
-- Esto asegura la integridad de los datos jerárquicos.
-- `ON DELETE CASCADE` significa que si se elimina una tarea padre, todas sus tareas hijas también se eliminarán.
ALTER TABLE externo_tasks
ADD CONSTRAINT fk_parent_task
FOREIGN KEY (parentId)
REFERENCES externo_tasks(id)
ON DELETE CASCADE;

-- Crea un índice en `parentId` para mejorar el rendimiento de las consultas jerárquicas.
CREATE INDEX idx_externo_tasks_parent_id ON externo_tasks(parentId);
