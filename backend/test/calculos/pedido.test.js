const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calcularPedido, aPesos, ErrorFueraDeCobertura } = require("../../src/calculos");
const { PARAMETROS } = require("../fixtures/parametros");

test("ejemplo del documento: pedido de $300 a 2 km", () => {
  const r = calcularPedido({ montoComida: "300", distanciaKm: "2", ...PARAMETROS });
  assert.deepEqual(r, {
    montoComida: 30000,
    tarifaCliente: 3000,
    totalCliente: 33000,
    comisionRestaurante: 3000,
    pagoRepartidor: 2700,
    comisionEnvio: 300,
    ingresoPlataforma: 3300,
  });
  assert.equal(aPesos(r.totalCliente), "330.00");
  assert.equal(aPesos(r.ingresoPlataforma), "33.00");
});

test("tramo más corto: hasta 1 km a $20, repartidor $18 y plataforma $2", () => {
  const r = calcularPedido({ montoComida: "100", distanciaKm: "0.8", ...PARAMETROS });
  assert.equal(r.tarifaCliente, 2000);
  assert.equal(r.pagoRepartidor, 1800);
  assert.equal(r.comisionEnvio, 200);
});

test("parámetros configurables", () => {
  const r = calcularPedido({
    montoComida: "300",
    distanciaKm: "2",
    ...PARAMETROS,
    comisionRestaurantePorcentaje: "12",
    pagoMinimo: "28",
  });
  assert.equal(r.comisionRestaurante, 3600);
  assert.equal(r.pagoRepartidor, 2800);
  assert.equal(r.comisionEnvio, 200);
  assert.equal(r.ingresoPlataforma, 3800);
});

test("pedido fuera de cobertura no se calcula", () => {
  assert.throws(
    () => calcularPedido({ montoComida: "300", distanciaKm: "5", ...PARAMETROS }),
    ErrorFueraDeCobertura
  );
});

test("calcularPedido sin algún parámetro de configuración lanza error que lo nombra", () => {
  assert.throws(() => calcularPedido(), /Faltan los datos del pedido/);
  assert.throws(
    () => calcularPedido({ montoComida: "300", distanciaKm: "2" }),
    /Faltan parámetros de configuración: tramos, comisionRestaurantePorcentaje, comisionEnvioPorcentaje, pagoMinimo/
  );
  for (const nombre of Object.keys(PARAMETROS)) {
    const datos = { montoComida: "300", distanciaKm: "2", ...PARAMETROS, [nombre]: undefined };
    assert.throws(() => calcularPedido(datos), new RegExp(`Faltan parámetros de configuración: ${nombre}$`));
  }
});

test("calcularPedido con parámetros inválidos lanza error", () => {
  const base = { montoComida: "300", distanciaKm: "2", ...PARAMETROS };
  assert.throws(() => calcularPedido({ ...base, comisionRestaurantePorcentaje: "101" }), RangeError);
  assert.throws(() => calcularPedido({ ...base, comisionEnvioPorcentaje: "-5" }), RangeError);
  assert.throws(() => calcularPedido({ ...base, pagoMinimo: "-1" }), /no negativo/);
  assert.throws(() => calcularPedido({ ...base, tramos: [] }), /No hay tarifas configuradas/);
});
