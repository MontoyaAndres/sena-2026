import React, { useState } from "react";

import { Button, ButtonCrazy } from "./button";
import { Input } from "./input";

export default function App() {
  const [nombre, setNombre] = useState("");

  const cambiarNombre = (nombre) => {
    setNombre(nombre);
  };

  return (
    <div>
      <h1>Hola {nombre === "Andres" ? "PROFESOR!" : nombre}!</h1>
      <Input
        value={nombre}
        onChange={(event) => cambiarNombre(event.target.value)}
        name={"nombre"}
      />
      <Button
        texto={"Andres"}
        color={"blue"}
        backgroundColor="red"
        tamanoAlto={200}
        tamanoAlto={100}
      />
      <Button
        texto={"Jovanny"}
        color={"red"}
        backgroundColor="pink"
        tamanoAlto={100}
        tamanoAlto={100}
      />
      <Button
        texto={"Daniel"}
        color={"yellow"}
        tamanoAlto={200}
        tamanoAlto={100}
      />
      <Button
        texto={"Samuel"}
        color={"black"}
        tamanoAlto={300}
        tamanoAlto={100}
      />
      <Button texto={"John"} color={"gold"} tamanoAlto={500} tamanoAlto={100} />
      <ButtonCrazy nombre={"Andres"} edad={26} />
    </div>
  );
}
