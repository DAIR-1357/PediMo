const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Prisma } = require("@prisma/client");
const { tarifaPorTramo, ErrorFueraDeCobertura } = require("../../src/calculos");
const { TARIFAS } = require("../fixtures/parametros");

test("límites de tramo: el límite superior se incluye", () => {
  assert.equal(tarifaPorTramo("0", TARIFAS), 2000);
  assert.equal(tarifaPorTramo("1", TARIFAS), 2000);
  assert.equal(tarifaPorTramo("1.01", TARIFAS), 2500);
  assert.equal(tarifaPorTramo("1.5", TARIFAS), 2500);
  assert.equal(tarifaPorTramo("2", TARIFAS), 3000); // ejemplo del documento
  assert.equal(tarifaPorTramo("4.5", TARIFAS), 5500);
});

test("cada tramo de la sección 3", () => {
  const esperadas = [2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500];
  TARIFAS.forEach((t, i) => assert.equal(tarifaPorTramo(t.hastaKm, TARIFAS), esperadas[i]));
});

test("más de 4.5 km queda fuera de cobertura", () => {
  assert.throws(() => tarifaPorTramo("4.51", TARIFAS), ErrorFueraDeCobertura);
  assert.throws(() => tarifaPorTramo("10", TARIFAS), /fuera de la zona de cobertura \(máximo 4.5 km\)/);
});

test("distancia negativa o inválida lanza error", () => {
  assert.throws(() => tarifaPorTramo("-1", TARIFAS), RangeError);
  assert.throws(() => tarifaPorTramo("dos", TARIFAS), TypeError);
});

test("sin tarifas configuradas lanza error", () => {
  assert.throws(() => tarifaPorTramo("1", []), /No hay tarifas configuradas/);
});

test("tramos desordenados y en Prisma Decimal dan el mismo resultado", () => {
  const desordenados = [...TARIFAS].reverse().map((t) => ({
    hastaKm: new Prisma.Decimal(t.hastaKm),
    tarifaCliente: new Prisma.Decimal(t.tarifaCliente),
  }));
  assert.equal(tarifaPorTramo("2", desordenados), 3000);
  assert.equal(tarifaPorTramo("0.5", desordenados), 2000);
  assert.equal(tarifaPorTramo(new Prisma.Decimal("3.2"), desordenados), 4500);
});

test("tarifaPorTramo sin tramos o con tramos inválidos lanza error", () => {
  assert.throws(() => tarifaPorTramo("1"), /Falta el parámetro: tarifas por tramo/);
  assert.throws(() => tarifaPorTramo("1", null), /Falta el parámetro: tarifas por tramo/);
  assert.throws(() => tarifaPorTramo("1", [{ hastaKm: "1" }]), /Tramo 1 incompleto/);
  assert.throws(() => tarifaPorTramo("1", [{ hastaKm: "0", tarifaCliente: "20" }]), /mayor que 0/);
  assert.throws(() => tarifaPorTramo("1", [{ hastaKm: "1", tarifaCliente: "-20" }]), /no puede ser negativa/);
});
