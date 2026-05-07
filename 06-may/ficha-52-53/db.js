// =====================================================
//   BASE DE DATOS - SENA FICHA 52-53
//   Ejemplo sencillo de CRUD con MongoDB
// =====================================================

// 1. Importamos la libreria de MongoDB
const { MongoClient } = require("mongodb");

// 2. Credenciales de MongoDB Atlas (MongoDB Cloud)
//    Reemplaza los valores con los datos de tu cuenta de MongoDB Atlas.
//    Estos datos los encuentras en: Atlas -> Database -> Connect -> Drivers
const USUARIO = "andresmontoyadev_db_user"; // Usuario que creaste en Atlas
const CONTRASENA = "SnaxE7TedBmEtFof"; // Contrasena del usuario
const CLUSTER = "sena-ficha-52-53.lfggcwn.mongodb.net"; // Direccion del cluster (sin mongodb+srv://)
const NOMBRE_APP = "sena-ficha-52-53"; // Nombre de la app (lo da Atlas)
const NOMBRE_BASE_DATOS = "sena"; // Nombre de la base de datos

// 3. Armamos la URL de conexion para MongoDB Atlas
//    Formato: mongodb+srv://USUARIO:CONTRASENA@CLUSTER/?appName=NOMBRE_APP
const URL = `mongodb+srv://${USUARIO}:${CONTRASENA}@${CLUSTER}/?appName=${NOMBRE_APP}`;

// 4. Creamos el cliente
const cliente = new MongoClient(URL);

// Variable que guardara la base de datos cuando nos conectemos
let baseDatos;

// =====================================================
//   FUNCION PARA CONECTARSE A LA BASE DE DATOS
// =====================================================
async function conectar() {
  await cliente.connect();
  baseDatos = cliente.db(NOMBRE_BASE_DATOS);
  console.log("Conectado a MongoDB");
}

// =====================================================
//   FUNCION PARA CERRAR LA CONEXION
// =====================================================
async function desconectar() {
  await cliente.close();
  console.log("Conexion cerrada");
}

// =====================================================
//   ESTUDIANTES - CRUD
// =====================================================

// CREAR un estudiante
async function crearEstudiante(estudiante) {
  const resultado = await baseDatos
    .collection("estudiantes")
    .insertOne(estudiante);
  console.log("Estudiante creado con id:", resultado.insertedId);
  return resultado;
}

// LEER todos los estudiantes
async function leerEstudiantes() {
  const lista = await baseDatos.collection("estudiantes").find().toArray();
  console.log("Estudiantes:", lista);
  return lista;
}

// ACTUALIZAR un estudiante por nombre
async function actualizarEstudiante(nombre, datosNuevos) {
  const resultado = await baseDatos
    .collection("estudiantes")
    .updateOne({ nombre: nombre }, { $set: datosNuevos });
  console.log("Estudiantes actualizados:", resultado.modifiedCount);
  return resultado;
}

// ELIMINAR un estudiante por nombre
async function eliminarEstudiante(nombre) {
  const resultado = await baseDatos
    .collection("estudiantes")
    .deleteOne({ nombre: nombre });
  console.log("Estudiantes eliminados:", resultado.deletedCount);
  return resultado;
}

// =====================================================
//   PROFESORES - CRUD
// =====================================================

// CREAR un profesor
async function crearProfesor(profesor) {
  const resultado = await baseDatos
    .collection("profesores")
    .insertOne(profesor);
  console.log("Profesor creado con id:", resultado.insertedId);
  return resultado;
}

// LEER todos los profesores
async function leerProfesores() {
  const lista = await baseDatos.collection("profesores").find().toArray();
  console.log("Profesores:", lista);
  return lista;
}

// ACTUALIZAR un profesor por nombre
async function actualizarProfesor(nombre, datosNuevos) {
  const resultado = await baseDatos
    .collection("profesores")
    .updateOne({ nombre: nombre }, { $set: datosNuevos });
  console.log("Profesores actualizados:", resultado.modifiedCount);
  return resultado;
}

// ELIMINAR un profesor por nombre
async function eliminarProfesor(nombre) {
  const resultado = await baseDatos
    .collection("profesores")
    .deleteOne({ nombre: nombre });
  console.log("Profesores eliminados:", resultado.deletedCount);
  return resultado;
}

// =====================================================
//   CURSOS - CRUD
// =====================================================

// CREAR un curso
async function crearCurso(curso) {
  const resultado = await baseDatos.collection("cursos").insertOne(curso);
  console.log("Curso creado con id:", resultado.insertedId);
  return resultado;
}

// LEER todos los cursos
async function leerCursos() {
  const lista = await baseDatos.collection("cursos").find().toArray();
  console.log("Cursos:", lista);
  return lista;
}

// ACTUALIZAR un curso por nombre
async function actualizarCurso(nombre, datosNuevos) {
  const resultado = await baseDatos
    .collection("cursos")
    .updateOne({ nombre: nombre }, { $set: datosNuevos });
  console.log("Cursos actualizados:", resultado.modifiedCount);
  return resultado;
}

// ELIMINAR un curso por nombre
async function eliminarCurso(nombre) {
  const resultado = await baseDatos
    .collection("cursos")
    .deleteOne({ nombre: nombre });
  console.log("Cursos eliminados:", resultado.deletedCount);
  return resultado;
}

// =====================================================
//   EJEMPLO DE USO
//   Aqui se ejecutan las funciones de arriba.
//   Puedes comentar o descomentar las que quieras probar.
// =====================================================
async function principal() {
  // Nos conectamos
  await conectar();

  // ---- ESTUDIANTES ----
  await crearEstudiante({ nombre: "Juan", edad: 20, ficha: "52" });
  await crearEstudiante({ nombre: "Ricardo", edad: 18, ficha: "54" });
  await crearEstudiante({ nombre: "Maria", edad: 22, ficha: "53" });
  await leerEstudiantes();
  await actualizarEstudiante("Juan", { edad: 21 });
  await actualizarEstudiante("Juan", { nombre: "Carlos" });
  await eliminarEstudiante("Maria");

  // ---- PROFESORES ----
  await crearProfesor({ nombre: "Andres", materia: "Programacion" });
  await crearProfesor({ nombre: "Laura", materia: "Bases de datos" });
  await leerProfesores();
  await actualizarProfesor("Andres", { materia: "JavaScript" });
  await eliminarProfesor("Laura");

  // ---- CURSOS ----
  await crearCurso({ nombre: "Desarrollo Web", duracion: "6 meses" });
  await crearCurso({ nombre: "MongoDB", duracion: "2 meses" });
  await leerCursos();
  await actualizarCurso("MongoDB", { duracion: "3 meses" });
  await eliminarCurso("Desarrollo Web");

  // Cerramos la conexion
  await desconectar();
}

// Ejecutamos la funcion principal
principal();
