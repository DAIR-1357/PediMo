const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Prisma } = require("@prisma/client");
const { aCentavos, aPesos, porcentajeABasePuntos, aplicarPorcentaje } = require("../../src/calculos");

test("aCentavos convierte texto, números y Prisma Decimal", () => {
  assert.equal(aCentavos("22.50"), 2250);
  assert.equal(aCentavos("22.5"), 2250);
  assert.equal(aCentavos("300"), 30000);
  assert.equal(aCentavos(49.5), 4950);
  assert.equal(aCentavos(new Prisma.Decimal("300")), 30000);
  assert.equal(aCentavos(new Prisma.Decimal("22.50")), 2250);
});

test("aCentavos rechaza más de 2 decimales y valores inválidos", () => {
  assert.throws(() => aCentavos("1.234"), RangeError);
  assert.throws(() => aCentavos("abc"), TypeError);
  assert.throws(() => aCentavos(NaN), TypeError);
  assert.throws(() => aCentavos(null), TypeError);
});

test("aPesos da texto con dos decimales", () => {
  assert.equal(aPesos(2250), "22.50");
  assert.equal(aPesos(2700), "27.00");
  assert.equal(aPesos(5), "0.05");
  assert.equal(aPesos(-500), "-5.00");
});

test("porcentajeABasePuntos", () => {
  assert.equal(porcentajeABasePuntos("10.00"), 1000);
  assert.equal(porcentajeABasePuntos("12"), 1200);
  assert.equal(porcentajeABasePuntos(new Prisma.Decimal("7.5")), 750);
});

test("aplicarPorcentaje redondea al centavo, medio hacia arriba", () => {
  assert.equal(aplicarPorcentaje(12345, 1000), 1235); // $12.345 → $12.35
  assert.equal(aplicarPorcentaje(12344, 1000), 1234); // $12.344 → $12.34
  assert.equal(aplicarPorcentaje(5, 1000), 1); // $0.005 → $0.01
  assert.equal(aplicarPorcentaje(4, 1000), 0);
});
