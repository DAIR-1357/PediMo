// Utilidades de dinero. Todo se maneja en centavos enteros; nunca se multiplican floats.

/**
 * Convierte un valor decimal (string, número o Prisma Decimal) a un entero
 * escalado por 10^decimales, parseándolo como texto.
 * Ejemplo: escalarEntero("22.5", 2) → 2250.
 */
function escalarEntero(valor, decimales, nombre = "valor") {
  let texto;
  if (typeof valor === "string") {
    texto = valor.trim();
  } else if (typeof valor === "number") {
    if (!Number.isFinite(valor)) throw new TypeError(`${nombre} inválido: ${valor}`);
    texto = String(valor);
  } else if (valor !== null && typeof valor === "object" && typeof valor.toFixed === "function") {
    texto = valor.toFixed(); // Prisma Decimal (decimal.js), sin notación exponencial
  } else {
    throw new TypeError(`${nombre} inválido: ${valor}`);
  }

  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(texto);
  if (!match) throw new TypeError(`${nombre} inválido: ${texto}`);

  const [, signo, enteros, fraccionRaw = ""] = match;
  const fraccion = fraccionRaw.replace(/0+$/, "");
  if (fraccion.length > decimales) {
    throw new RangeError(`${nombre} tiene más de ${decimales} decimales: ${texto}`);
  }

  const resultado = Number(enteros + fraccion.padEnd(decimales, "0"));
  if (!Number.isSafeInteger(resultado)) throw new RangeError(`${nombre} fuera de rango: ${texto}`);
  return signo === "-" && resultado !== 0 ? -resultado : resultado;
}

/** "22.50" → 2250. Rechaza más de 2 decimales. */
function aCentavos(valor) {
  return escalarEntero(valor, 2, "Monto");
}

/** 2250 → "22.50". El resultado sirve directamente para un campo Prisma Decimal. */
function aPesos(centavos) {
  if (!Number.isSafeInteger(centavos)) throw new TypeError(`Centavos inválidos: ${centavos}`);
  const signo = centavos < 0 ? "-" : "";
  const abs = Math.abs(centavos);
  return `${signo}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** "10.00" → 1000 puntos base (10%). */
function porcentajeABasePuntos(porcentaje) {
  return escalarEntero(porcentaje, 2, "Porcentaje");
}

/**
 * Aplica un porcentaje (en puntos base) a un monto en centavos,
 * redondeando al centavo, medio hacia arriba (lejos de cero en negativos).
 */
function aplicarPorcentaje(centavos, puntosBase) {
  if (!Number.isSafeInteger(centavos)) throw new TypeError(`Centavos inválidos: ${centavos}`);
  if (!Number.isSafeInteger(puntosBase)) throw new TypeError(`Puntos base inválidos: ${puntosBase}`);
  const producto = Math.abs(centavos) * Math.abs(puntosBase);
  if (!Number.isSafeInteger(producto)) throw new RangeError("Monto fuera de rango");
  const redondeado = Math.floor((producto + 5000) / 10000);
  return Math.sign(centavos) * Math.sign(puntosBase) < 0 ? -redondeado : redondeado;
}

module.exports = { escalarEntero, aCentavos, aPesos, porcentajeABasePuntos, aplicarPorcentaje };
