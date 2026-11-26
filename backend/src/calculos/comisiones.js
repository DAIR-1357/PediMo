// Comisiones y pago al repartidor (sección 4 del documento). Montos en centavos.
// Los porcentajes y el pago mínimo vienen de la configuración (tabla Parametros); aquí no hay valores por defecto.
const { aplicarPorcentaje } = require("./dinero");

function validarCentavos(valor, nombre) {
  if (valor === undefined || valor === null) {
    throw new TypeError(`Falta el parámetro: ${nombre}`);
  }
  if (!Number.isSafeInteger(valor) || valor < 0) {
    throw new TypeError(`${nombre} debe ser un entero de centavos no negativo: ${valor}`);
  }
}

/** Porcentaje en puntos base: 0 a 10000 (0% a 100%). */
function validarPorcentajePb(valor, nombre) {
  if (valor === undefined || valor === null) {
    throw new TypeError(`Falta el parámetro: ${nombre}`);
  }
  if (!Number.isSafeInteger(valor) || valor < 0 || valor > 10000) {
    throw new RangeError(`${nombre} debe estar entre 0% y 100% (0 a 10000 puntos base): ${valor}`);
  }
}

/** Comisión del pedido = monto de la comida × porcentaje pactado. */
function comisionRestaurante(montoComidaCentavos, porcentajePb) {
  validarCentavos(montoComidaCentavos, "Monto de la comida");
  validarPorcentajePb(porcentajePb, "Comisión del restaurante");
  return aplicarPorcentaje(montoComidaCentavos, porcentajePb);
}

/** Repartidor recibe = el mayor entre (tarifa − comisión de envío) y el pago mínimo. */
function pagoRepartidor(tarifaCentavos, opciones) {
  validarCentavos(tarifaCentavos, "Tarifa");
  if (opciones === undefined || opciones === null || typeof opciones !== "object") {
    throw new TypeError("Faltan los parámetros de envío: { comisionEnvioPb, pagoMinimoCentavos }");
  }
  const { comisionEnvioPb, pagoMinimoCentavos } = opciones;
  validarPorcentajePb(comisionEnvioPb, "Comisión de envío");
  validarCentavos(pagoMinimoCentavos, "Pago mínimo al repartidor");
  const noventaPorCiento = tarifaCentavos - aplicarPorcentaje(tarifaCentavos, comisionEnvioPb);
  return Math.max(noventaPorCiento, pagoMinimoCentavos);
}

/**
 * Comisión de envío de la plataforma = tarifa − pago al repartidor.
 * Puede ser negativa si la tarifa es menor que el pago mínimo (la plataforma pone la diferencia).
 */
function comisionEnvio(tarifaCentavos, opciones) {
  return tarifaCentavos - pagoRepartidor(tarifaCentavos, opciones);
}

module.exports = {
  validarPorcentajePb,
  comisionRestaurante,
  pagoRepartidor,
  comisionEnvio,
};
