const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Prisma } = require("@prisma/client");
const { cargarParametros, ErrorConfiguracion } = require("../src/configuracion");
const { calcularPedido } = require("../src/calculos");
const { TARIFAS } = require("./fixtures/parametros");

// Cliente falso: solo las dos consultas que usa cargarParametros, sin base de datos.
function prismaFalso({ tarifas, parametros }) {
  return {
    tarifa: { findMany: async () => tarifas },
    parametros: { findFirst: async () => parametros },
  };
}

const filaTarifas = TARIFAS.map((t) => ({
  hastaKm: new Prisma.Decimal(t.hastaKm),
  tarifaCliente: new Prisma.Decimal(t.tarifaCliente),
}));
const filaParametros = {
  id: 1,
  comisionEnvioPorcentaje: new Prisma.Decimal("10.00"),
  pagoMinimoRepartidor: new Prisma.Decimal("15.00"),
  comisionRestauranteDefault: new Prisma.Decimal("10.00"),
};

test("cargarParametros devuelve el objeto que usa calcularPedido (ejemplo $300 a 2 km)", async () => {
  const parametros = await cargarParametros(prismaFalso({ tarifas: filaTarifas, parametros: filaParametros }));
  const r = calcularPedido({ montoComida: "300", distanciaKm: "2", ...parametros });
  assert.equal(r.totalCliente, 33000);
  assert.equal(r.comisionRestaurante, 3000);
  assert.equal(r.pagoRepartidor, 2700);
  assert.equal(r.comisionEnvio, 300);
});

test("cargarParametros lanza error que dice qué falta", async () => {
  await assert.rejects(() => cargarParametros(), /Falta el cliente de Prisma/);
  await assert.rejects(
    () => cargarParametros(prismaFalso({ tarifas: [], parametros: filaParametros })),
    (e) => e instanceof ErrorConfiguracion && /tarifas vigentes/.test(e.message) && !/parámetros/.test(e.message)
  );
  await assert.rejects(
    () => cargarParametros(prismaFalso({ tarifas: filaTarifas, parametros: null })),
    (e) => e instanceof ErrorConfiguracion && /parámetros vigentes/.test(e.message) && !/tarifas/.test(e.message)
  );
  await assert.rejects(
    () => cargarParametros(prismaFalso({ tarifas: [], parametros: null })),
    /tarifas vigentes \(tabla tarifas\) y parámetros vigentes \(tabla parametros\)/
  );
});
