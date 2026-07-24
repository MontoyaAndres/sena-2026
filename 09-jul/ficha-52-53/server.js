require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(cors("*"));
const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.post("/sign-up", async (request, response) => {
  const { nombre, edad, correo, contrasena } = request.body;

  if (!nombre) {
    return response.status(400).json({ error: "El nombre no esta definido" });
  }

  if (!edad) {
    return response.status(400).json({ error: "La edad no esta definida" });
  }

  if (!correo) {
    return response.status(400).json({ error: "El correo no esta definido" });
  }

  if (!contrasena) {
    return response
      .status(400)
      .json({ error: "La contrasena no esta definida" });
  }

  if (edad > 0 && edad < 17) {
    return response.status(400).json({ error: "Muy joven" });
  }

  if (edad > 70) {
    return response.status(400).json({ error: "Edad no apropiada" });
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(contrasena, salt);

  const nuevoUsuario = await pg.query(
    `INSERT INTO public."usuarios" (nombre, edad, correo, contrasena) VALUES ($1, $2, $3, $4) RETURNING *`,
    [nombre, edad, correo, hash],
  );

  if (nuevoUsuario.rows.length > 0) {
    return response.status(201).json({ message: "Usuario creado!" });
  }

  return response.status(500).json({ error: "Algo salio mal" });
});

app.post("/sign-in", async (request, response) => {
  const { correo, contrasena } = request.body;

  if (!correo) {
    return response.status(400).json({ error: "Correo no valido" });
  }

  if (!contrasena) {
    return response.status(400).json({ error: "Contrasena incorrecta" });
  }

  const usuario = await pg.query(
    `SELECT * FROM public."usuarios" WHERE correo = $1`,
    [correo],
  );

  if (usuario.rows.length === 0) {
    return response.status(401).json({ error: "El usuario no existe" });
  }

  const validarContrasena = await bcrypt.compare(
    contrasena,
    usuario.rows[0].contrasena,
  );

  if (!validarContrasena) {
    return response.status(401).json({ error: "Contrasena incorrecta" });
  }

  return response.status(200).json({ message: "Bienvenido!" });
});

app.get("/usuarios", async (request, response) => {
  const { nombre, correo } = request.query;

  if (!nombre && !correo) {
    return response
      .status(400)
      .json({ error: "No has enviado el nombre y el correo" });
  }

  let usuarios;

  if (nombre) {
    usuarios = await pg.query(
      `SELECT * FROM public."usuarios" WHERE nombre = $1`,
      [nombre],
    );
  } else if (correo) {
    usuarios = await pg.query(
      `SELECT * FROM public."usuarios" WHERE correo = $1`,
      [correo],
    );
  } else {
    return response
      .status(400)
      .json({ error: "Has enviado un dato incorrecto" });
  }

  if (!usuarios) {
    return response.status(400).json({ error: "No hay usuarios" });
  }

  if (usuarios.rows.length === 0) {
    return response.status(400).json({ error: "No hay usuarios" });
  }

  usuarios = usuarios.rows.filter((values) => {
    delete values.contrasena;

    return values;
  });

  return response.status(200).json(usuarios || []);
});

app.delete("/usuarios/:id", async (request, response) => {
  const { id } = request.params;

  if (!id) {
    return response.status(400).json({ error: "ID no definida" });
  }

  await pg.query(`DELETE FROM public."usuarios" WHERE id = $1`, [id]);

  return response.status(200).json({ message: "Usuario eliminado!" });
});

app.listen(8080, () => {
  console.log("Servidor iniciado en el puerto 8080");
});
