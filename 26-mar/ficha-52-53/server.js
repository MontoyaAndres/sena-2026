const express = require("express");
const path = require("path");
const app = express();

app.use(express.static("public"));

app.get("/estudiantes-sena", (request, response) => {
  return response.send("HOLA COMO ESTAN TODOS!");
});

app.get("/inicio", (request, response) => {
  return response.sendFile(path.join(__dirname, "public/inicio.html"));
});

app.get("/login", (request, response) => {
  return response.sendFile(path.join(__dirname, "public/login.html"));
});

app.get("/registro", (request, response) => {
  return response.sendFile(path.join(__dirname, "public/registro.html"));
});

app.get("/acerca", (request, response) => {
  return response.sendFile(path.join(__dirname, "public/acerca.html"));
});

app.listen(8080, () =>
  console.log("Ya inicio nuestro servidor en el puerto 8080!"),
);
