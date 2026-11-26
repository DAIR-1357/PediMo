// Cálculo completo de un pedido. Recibe valores decimales (string/Decimal) y devuelve centavos.
// Los parámetros (tramos, porcentajes, pago mínimo) son obligatorios; se obtienen con cargarParametros().
const { aCentavos, porcentajeABasePuntos } = require("./dinero");
const { tarifaPorTramo } = require("./tarifas");
const { comisionRestaurante, pagoRepartidor, comisionEnvio } = require("./comisiones");

const PARAMETROS_REQUERIDOS = ["tramos", "comisionRestaurantePorcentaje", "comisionEnvioPorcentaje", "pagoMinimo"];

/**
 * @param {{ montoComida, distanciaKm, tramos, comisionRestaurantePorcentaje,
 *           comisionEnvioPorcentaje, pagoMinimo }} datos
 * @returns {{ montoComida, tarifaCliente, totalCliente, comisionRestaurante,
 *             pagoRepartidor, comisionEnvio, ingresoPlataforma }} todo en centavos
 */
function calcularPedido(datos) {
  if (datos === undefined || datos === null) throw new TypeError("Faltan los datos del pedido");
  const faltantes = PARAMETROS_REQUERIDOS.filter((p) => datos[p] === undefined || datos[p] === null);
  if (faltantes.length > 0) {
    throw new TypeError(`Faltan parámetros de configuración: ${faltantes.join(", ")}`);
  }
  const { montoComida, distanciaKm, tramos, comisionRestaurantePorcentaje, comisionEnvioPorcentaje, pagoMinimo } =
    datos;

  const comidaCent = aCentavos(montoComida);
  const tarifaCent = tarifaPorTramo(distanciaKm, tramos);
  const opcionesEnvio = {
    comisionEnvioPb: porcentajeABasePuntos(comisionEnvioPorcentaje),
    pagoMinimoCentavos: aCentavos(pagoMinimo),
  };

  const comisionRest = comisionRestaurante(comidaCent, porcentajeABasePuntos(comisionRestaurantePorcentaje));
  const pagoRep = pagoRepartidor(tarifaCent, opcionesEnvio);
  const comisionEnv = comisionEnvio(tarifaCent, opcionesEnvio);

  return {
    montoComida: comidaCent,
    tarifaCliente: tarifaCent,
    totalCliente: comidaCent + tarifaCent,
    comisionRestaurante: comisionRest,
    pagoRepartidor: pagoRep,
    comisionEnvio: comisionEnv,
    ingresoPlataforma: comisionRest + comisionEnv,
  };
}

module.exports = { calcularPedido };
