// <button style="color: red; width: 300px: height: 400px;"></button>

export function Button({
  texto,
  backgroundColor = "white",
  color,
  tamanoAncho,
  tamanoAlto,
}) {
  return (
    <button
      style={{
        color: color,
        width: tamanoAncho,
        height: tamanoAlto,
        backgroundColor: backgroundColor,
      }}
      onClick={() => alert(texto)}
    >
      {texto}
    </button>
  );
}

export function ButtonCrazy({ nombre, edad }) {
  return (
    <div>
      <button
        onClick={() => alert(`El loco es ${nombre} y tiene la edad de ${edad}`)}
      >
        BOTON LOCO
      </button>
    </div>
  );
}
