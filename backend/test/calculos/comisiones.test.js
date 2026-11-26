const { test } = require("node:test");
const assert = require("node:assert/strict");
const { comisionRestaurante, pagoRepartidor, comisionEnvio } = require("../../src/calculos");
const { COMISION_RESTAURANTE_PB, OPCIONES_ENVIO } = require("../fixtures/parametros");

test("comisión del restaurante: 10% de la comida", () => {
  assert.equal(comisionRestaurante(30000, COMISION_RESTAURANTE_PB), 3000); // $300 → $30
  assert.equal(comisionRestaurante(12345, COMISION_RESTAURANTE_PB), 1235); // redondeo medio hacia arriba
});

test("comisión del restaurante configurable: 12% de $300 = $36", () => {
  assert.equal(comisionRestaurante(30000, 1200), 3600);
});

test("tabla de la sección 3: repartidor y plataforma por tramo", () => {
  const tabla = [
    [2000, 1800, 200],
    [2500, 2250, 250],
    [3000, 2700, 300],
    [3500, 3150, 350],
    [4000, 3600, 400],
    [4500, 4050, 450],
    [5000, 4500, 500],
    [5500, 4950, 550],
  ];
  for (const [tarifa, repartidor, plataforma] of tabla) {
    assert.equal(pagoRepartidor(tarifa, OPCIONES_ENVIO), repartidor, `repartidor con tarifa ${tarifa}`);
    assert.equal(comisionEnvio(tarifa, OPCIONES_ENVIO), plataforma, `plataforma con tarifa ${tarifa}`);
  }
});

test("pago mínimo de $15", () => {
  assert.equal(pagoRepartidor(1600, OPCIONES_ENVIO), 1500); // 90% = $14.40 → $15
  assert.equal(comisionEnvio(1600, OPCIONES_ENVIO), 100);
});

test("tarifa menor al mínimo: la comisión de envío queda negativa (la plataforma pone la diferencia)", () => {
  assert.equal(pagoRepartidor(1000, OPCIONES_ENVIO), 1500);
  assert.equal(comisionEnvio(1000, OPCIONES_ENVIO), -500);
});

test("pago mínimo configurable", () => {
  const opciones = { ...OPCIONES_ENVIO, pagoMinimoCentavos: 1800 };
  assert.equal(pagoRepartidor(2000, opciones), 1800);
  assert.equal(pagoRepartidor(2500, opciones), 2250);
});

test("montos inválidos lanzan error", () => {
  assert.throws(() => comisionRestaurante(300.5, COMISION_RESTAURANTE_PB), TypeError);
  assert.throws(() => pagoRepartidor(-100, OPCIONES_ENVIO), TypeError);
});

test("comisionRestaurante sin porcentaje o fuera de 0 a 100% lanza error", () => {
  assert.throws(() => comisionRestaurante(30000), /Falta el parámetro: Comisión del restaurante/);
  assert.throws(() => comisionRestaurante(30000, -1), RangeError);
  assert.throws(() => comisionRestaurante(30000, 10001), RangeError);
  assert.throws(() => comisionRestaurante(30000, 10.5), RangeError);
});

test("pagoRepartidor y comisionEnvio sin parámetros de envío lanzan error", () => {
  for (const fn of [pagoRepartidor, comisionEnvio]) {
    assert.throws(() => fn(3000), /Faltan los parámetros de envío/);
    assert.throws(() => fn(3000, { pagoMinimoCentavos: 1500 }), /Falta el parámetro: Comisión de envío/);
    assert.throws(() => fn(3000, { comisionEnvioPb: 1000 }), /Falta el parámetro: Pago mínimo al repartidor/);
    assert.throws(() => fn(3000, { ...OPCIONES_ENVIO, comisionEnvioPb: 10001 }), RangeError);
    assert.throws(() => fn(3000, { ...OPCIONES_ENVIO, pagoMinimoCentavos: -1 }), /no negativo/);
  }
});
