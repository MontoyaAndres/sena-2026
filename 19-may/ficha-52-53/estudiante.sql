CREATE TABLE clientes (
    id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    telefono TEXT UNIQUE,
    correo TEXT UNIQUE,
    direccion TEXT,
    fecha_registro DATE NOT NULL
);
   
 CREATE TABLE medicos (
    id_medico INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    especialidad TEXT NOT NULL,
    telefono TEXT UNIQUE,
    correo TEXT UNIQUE,
    salario REAL CHECK (salario > 0)
);

CREATE TABLE pacientes (
    id_paciente INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero TEXT CHECK (genero IN ('Masculino','Femenino')),
    tipo_sangre TEXT,
    id_cliente INTEGER,

    FOREIGN KEY (id_cliente)
    REFERENCES clientes(id_cliente)
);

CREATE TABLE citas (
    id_cita INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_cita DATETIME NOT NULL,
    motivo TEXT,
    id_paciente INTEGER,
    id_medico INTEGER,

    FOREIGN KEY (id_paciente)
    REFERENCES pacientes(id_paciente),

    FOREIGN KEY (id_medico)
    REFERENCES medicos(id_medico)
);

INSERT INTO clientes
(nombre, apellido, telefono, correo, direccion, fecha_registro)
VALUES
('jovanny', 'correa', '3001111111', 'carlos@gmail.com', 'Calle 10', '2026-05-20'),

('Laura', 'soto', '3002222222', 'laura@gmail.com', 'Carrera 20', '2026-05-20'),

('Jorge', 'Ramirez', '3003333333', 'jorge@gmail.com', 'Avenida 30', '2026-05-20'),

('Ana', 'Martinez', '3004444444', 'ana@gmail.com', 'Barrio Centro', '2026-05-20'),

('Luis', 'Torres', '3005555555', 'luis@gmail.com', 'Calle 50', '2026-05-20');

INSERT INTO medicos
(nombre, apellido, especialidad, telefono, correo, salario)
VALUES
('Andres', 'Ruiz', 'Cardiologia', '3111111111', 'andres@clinica.com', 4500000),

('Sofia', 'Martinez', 'Pediatria', '3112222222', 'sofia@clinica.com', 5000000),

('Camilo', 'Rojas', 'Dermatologia', '3113333333', 'camilo@clinica.com', 4800000),

('Valentina', 'Diaz', 'Neurologia', '3114444444', 'valentina@clinica.com', 5500000),

('Miguel', 'Castro', 'Odontologia', '3115555555', 'miguel@clinica.com', 4200000);

INSERT INTO pacientes
(nombre, apellido, fecha_nacimiento, genero, tipo_sangre, id_cliente)
VALUES
('Juan', 'Lopez', '2000-04-10', 'Masculino', 'O+', 1),

('Maria', 'Fernandez', '1998-08-15', 'Femenino', 'A-', 2),

('Pedro', 'Gonzalez', '2001-02-20', 'Masculino', 'B+', 3),

('Luisa', 'Hernandez', '1995-06-11', 'Femenino', 'AB+', 4),

('Daniel', 'Morales', '1999-12-01', 'Masculino', 'O-', 5);

INSERT INTO citas
(fecha_cita, motivo, id_paciente, id_medico)
VALUES
('2026-06-01 08:00:00', 'Control general', 1, 1),

('2026-06-02 09:00:00', 'Consulta pediatrica', 2, 2),

('2026-06-03 10:00:00', 'Revision dermatologica', 3, 3),

('2026-06-04 11:00:00', 'Dolor de cabeza', 4, 4),

('2026-06-05 02:00:00', 'Limpieza dental', 5, 5);

SELECT * FROM pacientes;

SELECT * FROM clientes;

SELECT * FROM medicos;

SELECT * from citas ;
UPDATE pacientes
SET tipo_sangre = 'B-'
WHERE id_paciente = 1;

DELETE FROM citas;
DELETE FROM clientes;
DELETE FROM  pacientes;
DELETE FROM medicos;
