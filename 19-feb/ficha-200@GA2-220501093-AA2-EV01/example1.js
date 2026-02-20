class Persona {
  constructor({ id, nombre }) {
    this.id = id;
    this.nombre = nombre;
  }
}

class Pelicula {
  constructor({ id, titulo, director }) {
    if (!(director instanceof Persona)) throw new Error("director debe ser Persona");
    this.id = id;
    this.titulo = titulo;

    /** @type {Persona} (1) */
    this.director = director;

    /** @type {Set<Persona>} */
    this.actores = new Set();

    /** @type {Set<Persona>} */
    this.productores = new Set();
  }

  agregarActor(persona) {
    this.actores.add(persona);
  }

  agregarProductor(persona) {
    this.productores.add(persona);
  }

  cambiarDirector(persona) {
    this.director = persona;
  }
}

// ===== Demo =====
const nolan = new Persona({ id: "1", nombre: "Christopher Nolan" });
const leo = new Persona({ id: "2", nombre: "Leonardo DiCaprio" });
const emma = new Persona({ id: "3", nombre: "Emma Thomas" });

const inception = new Pelicula({ id: "P1", titulo: "Inception", director: nolan });
inception.agregarActor(leo);
inception.agregarProductor(emma);

console.log({
  pelicula: inception.titulo,
  director: inception.director.nombre,
  actores: [...inception.actores].map(p => p.nombre),
  productores: [...inception.productores].map(p => p.nombre),
});
