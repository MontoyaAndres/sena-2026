const express = require("express");

try {
  const app = express();
  const PORT = 8005;

  app.use(express.json());

  app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SENA - GA4-220501095-AA3-EV03</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: #f4f4f4; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
          h1 { color: #39a900; margin-bottom: 1rem; }
          p { color: #333; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hola estudiantes del SENA</h1>
          <p>Bienvenidos a la evidencia GA4-220501095-AA3-EV03</p>
        </div>
      </body>
      </html>
    `);
  });
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (error) {
  console.log("server ocupado");
}
