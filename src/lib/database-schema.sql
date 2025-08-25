
-- Tabla para almacenar la configuración de la aplicación, como la URL del endpoint.
CREATE TABLE IF NOT EXISTS app_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT
);

-- Tabla para almacenar las tareas de los proyectos.
CREATE TABLE IF NOT EXISTS externo_tasks (
    id SERIAL PRIMARY KEY,
    projectId INT NOT NULL,
    name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    consumedQuantity NUMERIC(10, 2) DEFAULT 0,
    value NUMERIC(10, 2) NOT NULL, -- PVP
    cost NUMERIC(10, 2) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendiente', -- pendiente, en-progreso, completado
    partner_id INT,
    level INT,
    parentId INT REFERENCES externo_tasks(id) ON DELETE CASCADE
);

-- Tabla para almacenar las validaciones de las tareas (imágenes, ubicación, etc.)
CREATE TABLE IF NOT EXISTS externo_task_validations (
    id SERIAL PRIMARY KEY,
    taskId INT NOT NULL REFERENCES externo_tasks(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    imageUrl TEXT NOT NULL, -- Almacenará la imagen en formato base64 Data URI
    location VARCHAR(255) NOT NULL, -- "lat,lng"
    userId INT,
    notes TEXT
);

-- Tabla para el desglose de consumo diario de cada tarea.
CREATE TABLE IF NOT EXISTS externo_task_daily_consumption (
    id SERIAL PRIMARY KEY,
    taskId INT NOT NULL REFERENCES externo_tasks(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    planned_quantity NUMERIC(10, 4) NOT NULL,
    consumed_quantity NUMERIC(10, 4) DEFAULT 0,
    verified_quantity NUMERIC(10, 4) DEFAULT 0,
    details TEXT,
    UNIQUE(taskId, date) -- Asegura que solo haya un registro por tarea y día.
);

-- Ejemplo de inserción para la configuración inicial.
INSERT INTO app_config (key, value) VALUES ('endpointUrl', 'http://localhost:8069')
ON CONFLICT (key) DO NOTHING;
