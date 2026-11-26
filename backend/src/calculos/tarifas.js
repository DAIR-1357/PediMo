// Tarifa de envío por tramo de distancia (sección 3 del documento).
// Los tramos vienen de la configuración (tabla Tarifa); aquí no hay valores por defecto.
const { escalarEntero, aCentavos } = require("./dinero");

class ErrorFueraDeCobertura extends Error {
  constructor(maximoKm) {
    super(`El pedido está fuera de la zona de cobertura (máximo ${maximoKm} km)`);
    this.name = "ErrorFueraDeCobertura";
  }
}

/** Distancia en km (string, número o Decimal) → metros enteros. */
function aMetros(distanciaKm) {
  return escalarEntero(distanciaKm, 3, "Distancia");
}

/**
 * Devuelve la tarifa al cliente, en centavos, del tramo donde cae la distancia.
 * Límite superior incluido en cada tramo.
 * @param distanciaKm distancia en km
 * @param tramos lista obligatoria de { hastaKm, tarifaCliente } (como vienen de la tabla Tarifa)
 */
function tarifaPorTramo(distanciaKm, tramos) {
  if (tramos === undefined || tramos === null) {
    throw new TypeError("Falta el parámetro: tarifas por tramo");
  }
  if (!Array.isArray(tramos) || tramos.length === 0) {
    throw new Error("No hay tarifas configuradas");
  }
  const metros = aMetros(distanciaKm);
  if (metros < 0) throw new RangeError(`La distancia no puede ser negativa: ${distanciaKm}`);

  const ordenados = tramos
    .map((t, i) => {
      if (!t || t.hastaKm === undefined || t.tarifaCliente === undefined) {
        throw new TypeError(`Tramo ${i + 1} incompleto: requiere hastaKm y tarifaCliente`);
      }
      const hastaMetros = aMetros(t.hastaKm);
      const tarifa = aCentavos(t.tarifaCliente);
      if (hastaMetros <= 0) throw new RangeError(`Tramo ${i + 1}: hastaKm debe ser mayor que 0`);
      if (tarifa < 0) throw new RangeError(`Tramo ${i + 1}: la tarifa no puede ser negativa`);
      return { hastaMetros, tarifa };
    })
    .sort((a, b) => a.hastaMetros - b.hastaMetros);

  const tramo = ordenados.find((t) => metros <= t.hastaMetros);
  if (!tramo) {
    const maximo = ordenados[ordenados.length - 1].hastaMetros / 1000;
    throw new ErrorFueraDeCobertura(maximo);
  }
  return tramo.tarifa;
}

module.exports = { ErrorFueraDeCobertura, tarifaPorTramo, aMetros };
