-- Este script se ejecuta automaticamente la PRIMERA vez que se crea la base de datos
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  talla VARCHAR(10) NOT NULL,
  color VARCHAR(30) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  marca VARCHAR(50) NOT NULL,
  precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
  creado_en TIMESTAMP DEFAULT NOW()
);

INSERT INTO productos (nombre, talla, color, tipo, marca, precio) VALUES
  ('Camiseta basica', 'M', 'Blanco', 'Camiseta', 'Nike', 59900),
  ('Jean slim fit', '32', 'Azul', 'Pantalon', 'Levis', 189900),
  ('Chaqueta impermeable', 'L', 'Negro', 'Chaqueta', 'Columbia', 349900),
  ('Vestido de verano', 'S', 'Rojo', 'Vestido', 'Zara', 129900),
  ('Sudadera con capota', 'XL', 'Gris', 'Sudadera', 'Adidas', 159900);
