// Contrato de búsqueda insensible a mayúsculas y tildes.
//
// Este módulo define los tipos compartidos por el helper de normalización
// (`lib/search.mo`) y por todos los módulos de dominio que buscan texto.
// No contiene lógica: solo la forma del contrato.
module {
  // Texto ya normalizado por `Search.normalize`: minúsculas, sin tildes,
  // sin diéresis y con la ñ reducida a n. Dos cadenas que solo difieren en
  // mayúsculas o acentos producen el MISMO `NormalizedText`.
  public type NormalizedText = Text;

  // Modo de un buscador. Los listados con paginación propia conservan su
  // paginación (`#paged`); los buscadores tipo selector y el buscador global
  // no truncan resultados (`#unbounded`).
  public type SearchMode = {
    #paged;
    #unbounded;
  };
};
