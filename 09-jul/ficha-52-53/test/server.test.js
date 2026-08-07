const request = require("supertest");
const assert = require("assert");
const app = require("../server");

describe("Servidor", () => {
  describe("POST /sign-up", () => {
    it("responde 400 si no envio el nombre", async () => {
      const respuesta = await request(app).post("/sign-up").send({});

      assert.strictEqual(respuesta.status, 400);
      assert.strictEqual(respuesta.body.error, "El nombre no esta definido");
    });

    it("responde 400 si el usuario es muy joven", async () => {
      const respuesta = await request(app).post("/sign-up").send({
        nombre: "Andres",
        edad: 15,
        correo: "andres@correo.com",
        contrasena: "123456",
      });

      assert.strictEqual(respuesta.status, 400);
      assert.strictEqual(respuesta.body.error, "Muy joven");
    });
  });

  describe("POST /sign-in", () => {
    it("responde 400 si no envio el correo", async () => {
      const respuesta = await request(app).post("/sign-in").send({});

      assert.strictEqual(respuesta.status, 400);
      assert.strictEqual(respuesta.body.error, "Correo no valido");
    });
  });

  describe("GET /usuarios", () => {
    it("responde 400 si no envio nombre ni correo", async () => {
      const respuesta = await request(app).get("/usuarios");

      assert.strictEqual(respuesta.status, 400);
      assert.strictEqual(
        respuesta.body.error,
        "No has enviado el nombre y el correo",
      );
    });
  });
});
