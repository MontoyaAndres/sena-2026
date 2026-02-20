// ===== Entidades =====
class Actor {
  constructor({ id, nombre }) {
    this.id = id;
    this.nombre = nombre;
  }
}

class Director {
  constructor({ id, nombre }) {
    this.id = id;
    this.nombre = nombre;
  }
}

class Productor {
  constructor({ id, nombre }) {
    this.id = id;
    this.nombre = nombre;
  }
}

class Pelicula {
  constructor({ id, titulo, director }) {
    if (!director) throw new Error("Una película debe tener director (1)");
    this.id = id;
    this.titulo = titulo;

    /** @type {Director} */
    this.director = director;

    /** @type {Set<Actor>} */
    this.actores = new Set();

    /** @type {Set<Productor>} */
    this.productores = new Set();
  }

  // Actor * participa en * Pelicula (N:M)
  agregarActor(actor) {
    this.actores.add(actor);
  }

  // Productor * produce * Pelicula (N:M)
  agregarProductor(productor) {
    this.productores.add(productor);
  }

  cambiarDirector(nuevoDirector) {
    if (!nuevoDirector) throw new Error("director requerido");
    this.director = nuevoDirector;
  }
}

// ===== Demo =====
const dir = new Director({ id: "D1", nombre: "Christopher Nolan" });
const peli = new Pelicula({ id: "P1", titulo: "Inception", director: dir });

const actor1 = new Actor({ id: "A1", nombre: "Leonardo DiCaprio" });
const actor2 = new Actor({ id: "A2", nombre: "Joseph Gordon-Levitt" });

const prod1 = new Productor({ id: "PR1", nombre: "Emma Thomas" });
const prod2 = new Productor({ id: "PR2", nombre: "Warner Bros" });

peli.agregarActor(actor1);
peli.agregarActor(actor2);
peli.agregarProductor(prod1);
peli.agregarProductor(prod2);

console.log({
  pelicula: peli.titulo,
  director: peli.director.nombre,
  actores: [...peli.actores].map(a => a.nombre),
  productores: [...peli.productores].map(p => p.nombre),
});
