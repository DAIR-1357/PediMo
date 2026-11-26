const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Prisma } = require("@prisma/client");
const {
  TARIFAS,
  PARAMETROS,
  decidirTarifa,
  decidirParametros,
  decidirCierreTarifas,
  sembrar,
} = require("../prisma/seed");
const { aMetros } = require("../src/calculos/tarifas");

// --- Funciones de decisión ---

test("decidirTarifa: crear, actualizar o sin cambios", () => {
  const deseada = { hastaKm: "2.00", tarifaCliente: "30.00" };
  assert.equal(decidirTarifa(null, deseada), "crear");
  assert.equal(decidirTarifa({ id: 3, tarifaCliente: new Prisma.Decimal("30") }, deseada), "sin_cambios");
  assert.equal(decidirTarifa({ id: 3, tarifaCliente: new Prisma.Decimal("28.50") }, deseada), "actualizar");
});

test("decidirParametros: crear, reemplazar o sin cambios", () => {
  const vigente = {
    id: 1,
    comisionRestauranteDefault: new Prisma.Decimal("10"),
    comisionEnvioPorcentaje: new Prisma.Decimal("10.00"),
    pagoMinimoRepartidor: new Prisma.Decimal("15.00"),
  };
  assert.equal(decidirParametros(null, PARAMETROS), "crear");
  assert.equal(decidirParametros(vigente, PARAMETROS), "sin_cambios");
  assert.equal(decidirParametros({ ...vigente, pagoMinimoRepartidor: new Prisma.Decimal("16") }, PARAMETROS), "reemplazar");
  assert.equal(decidirParametros({ ...vigente, comisionEnvioPorcentaje: new Prisma.Decimal("12") }, PARAMETROS), "reemplazar");
});

// --- sembrar() contra un cliente en memoria (sin base de datos) ---

function clienteEnMemoria() {
  const tablas = { tarifa: [], parametros: [] };
  const ids = { tarifa: 0, parametros: 0 };
  let transacciones = 0;

  const coincide = (fila, where = {}) =>
    Object.entries(where).every(([campo, valor]) =>
      campo === "hastaKm" ? aMetros(fila.hastaKm) === aMetros(valor) : fila[campo] === valor
    );

  const modelo = (nombre) => ({
    findMany: async ({ where } = {}) => tablas[nombre].filter((f) => coincide(f, where)).map((f) => ({ ...f })),
    findFirst: async ({ where, orderBy } = {}) => {
      let filas = tablas[nombre].filter((f) => coincide(f, where));
      if (orderBy?.vigenteDesde === "desc") filas = [...filas].sort((a, b) => b.vigenteDesde - a.vigenteDesde);
      return filas[0] ? { ...filas[0] } : null;
    },
    create: async ({ data }) => {
      const fila = { id: ++ids[nombre], vigenteHasta: null, ...data };
      tablas[nombre].push(fila);
      return { ...fila };
    },
    update: async ({ where, data }) => {
      const fila = tablas[nombre].find((f) => f.id === where.id);
      if (!fila) throw new Error(`No existe ${nombre} ${where.id}`);
      Object.assign(fila, data);
      return { ...fila };
    },
  });

  const cliente = { tablas, tarifa: modelo("tarifa"), parametros: modelo("parametros") };
  cliente.$transaction = async (fn) => {
    transacciones += 1;
    return fn(cliente);
  };
  cliente.transacciones = () => transacciones;
  return cliente;
}

const vigentes = (filas) => filas.filter((f) => f.vigenteHasta === null);

test("sembrar dos veces no duplica tarifas ni parámetros vigentes", async () => {
  const db = clienteEnMemoria();

  const primera = await sembrar(db, { ahora: new Date("2026-11-01T12:00:00Z") });
  assert.deepEqual(primera, {
    tarifas: { crear: 8, actualizar: 0, sin_cambios: 0 },
    sobrantes: [],
    sobrantesCerradas: 0,
    parametros: "crear",
  });

  const segunda = await sembrar(db, { ahora: new Date("2026-11-02T12:00:00Z") });
  assert.deepEqual(segunda, {
    tarifas: { crear: 0, actualizar: 0, sin_cambios: 8 },
    sobrantes: [],
    sobrantesCerradas: 0,
    parametros: "sin_cambios",
  });

  assert.equal(db.tablas.tarifa.length, 8);
  assert.equal(vigentes(db.tablas.tarifa).length, 8);
  assert.equal(db.tablas.parametros.length, 1);
  assert.equal(db.transacciones(), 2); // cada corrida en una sola transacción
});

test("sembrar actualiza la tarifa cambiada sin crear otra", async () => {
  const db = clienteEnMemoria();
  await sembrar(db);
  db.tablas.tarifa.find((t) => t.hastaKm === "2.00").tarifaCliente = "28.00";

  const r = await sembrar(db);
  assert.deepEqual(r.tarifas, { crear: 0, actualizar: 1, sin_cambios: 7 });
  assert.equal(db.tablas.tarifa.length, 8);
  assert.equal(db.tablas.tarifa.find((t) => t.hastaKm === "2.00").tarifaCliente, "30.00");
});

test("sembrar con parámetros distintos cierra el vigente y crea uno nuevo", async () => {
  const db = clienteEnMemoria();
  const antes = new Date("2026-11-01T12:00:00Z");
  const ahora = new Date("2026-11-20T12:00:00Z");
  await sembrar(db, { ahora: antes });

  const nuevos = { ...PARAMETROS, pagoMinimoRepartidor: "18.00" };
  const r = await sembrar(db, { parametros: nuevos, ahora });
  assert.equal(r.parametros, "reemplazar");

  assert.equal(db.tablas.parametros.length, 2);
  const [viejo, nuevo] = db.tablas.parametros;
  assert.equal(viejo.vigenteHasta, ahora);
  assert.equal(viejo.pagoMinimoRepartidor, "15.00");
  assert.equal(nuevo.vigenteHasta, null);
  assert.equal(nuevo.vigenteDesde, ahora);
  assert.equal(nuevo.pagoMinimoRepartidor, "18.00");
  assert.equal(vigentes(db.tablas.parametros).length, 1);
});

test("decidirCierreTarifas devuelve solo las vigentes que no están en la propuesta", () => {
  const vigentes = [
    { id: 1, hastaKm: new Prisma.Decimal("1"), tarifaCliente: new Prisma.Decimal("20") }, // = "1.00"
    { id: 2, hastaKm: "2.00", tarifaCliente: "30.00" },
    { id: 9, hastaKm: "5.00", tarifaCliente: "60.00" },
    { id: 10, hastaKm: new Prisma.Decimal("0.75"), tarifaCliente: new Prisma.Decimal("18") },
  ];
  const antes = JSON.stringify(vigentes);
  assert.deepEqual(
    decidirCierreTarifas(vigentes, TARIFAS).map((t) => t.id),
    [9, 10]
  );
  assert.deepEqual(decidirCierreTarifas([], TARIFAS), []);
  assert.deepEqual(decidirCierreTarifas(vigentes.slice(0, 2), TARIFAS), []);
  assert.equal(JSON.stringify(vigentes), antes); // no modifica la entrada
});

/** Base sembrada con la propuesta más un tramo vigente de 5 km que no está en ella. */
async function baseConSobrante() {
  const db = clienteEnMemoria();
  await sembrar(db, { ahora: new Date("2026-11-01T12:00:00Z") });
  await db.tarifa.create({ data: { hastaKm: "5.00", tarifaCliente: "60.00", vigenteDesde: new Date("2026-11-01") } });
  return db;
}

test("sembrar sin cerrarSobrantes reporta el tramo sobrante pero no cambia nada", async () => {
  const db = await baseConSobrante();
  const antes = structuredClone(db.tablas);

  const r = await sembrar(db, { ahora: new Date("2026-11-20T12:00:00Z") });
  assert.deepEqual(
    r.sobrantes.map((t) => [t.hastaKm, t.tarifaCliente]),
    [["5.00", "60.00"]]
  );
  assert.equal(r.sobrantesCerradas, 0);
  assert.deepEqual(db.tablas, antes);
});

test("sembrar con cerrarSobrantes cierra el tramo sobrante con vigenteHasta = ahora", async () => {
  const db = await baseConSobrante();
  const ahora = new Date("2026-11-20T12:00:00Z");

  const r = await sembrar(db, { ahora, cerrarSobrantes: true });
  assert.equal(r.sobrantes.length, 1);
  assert.equal(r.sobrantesCerradas, 1);

  const sobrante = db.tablas.tarifa.find((t) => t.hastaKm === "5.00");
  assert.equal(sobrante.vigenteHasta, ahora);
  assert.equal(db.tablas.tarifa.length, 9); // no se borra, solo se cierra
  assert.equal(vigentes(db.tablas.tarifa).length, 8);

  // Repetible: la siguiente corrida ya no encuentra sobrantes
  const otra = await sembrar(db, { cerrarSobrantes: true });
  assert.deepEqual(otra.sobrantes, []);
  assert.equal(otra.sobrantesCerradas, 0);
});

test("los valores del seed coinciden con la propuesta de la sección 3", () => {
  assert.equal(TARIFAS.length, 8);
  assert.deepEqual(
    TARIFAS.map((t) => t.tarifaCliente),
    ["20.00", "25.00", "30.00", "35.00", "40.00", "45.00", "50.00", "55.00"]
  );
});
