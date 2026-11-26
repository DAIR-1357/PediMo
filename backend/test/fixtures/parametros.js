// Valores de la propuesta (secciones 3 y 4) para las pruebas. Única fuente de parámetros en test/.
const { porcentajeABasePuntos, aCentavos } = require("../../src/calculos");

const TARIFAS = Object.freeze([
  { hastaKm: "1.00", tarifaCliente: "20.00" },
  { hastaKm: "1.50", tarifaCliente: "25.00" },
  { hastaKm: "2.00", tarifaCliente: "30.00" },
  { hastaKm: "2.50", tarifaCliente: "35.00" },
  { hastaKm: "3.00", tarifaCliente: "40.00" },
  { hastaKm: "3.50", tarifaCliente: "45.00" },
  { hastaKm: "4.00", tarifaCliente: "50.00" },
  { hastaKm: "4.50", tarifaCliente: "55.00" },
]);

/** Mismo formato que devuelve cargarParametros(). */
const PARAMETROS = Object.freeze({
  tramos: TARIFAS,
  comisionRestaurantePorcentaje: "10",
  comisionEnvioPorcentaje: "10",
  pagoMinimo: "15",
});

/** Formas ya convertidas para las funciones de comisiones.js. */
const COMISION_RESTAURANTE_PB = porcentajeABasePuntos(PARAMETROS.comisionRestaurantePorcentaje);
const OPCIONES_ENVIO = Object.freeze({
  comisionEnvioPb: porcentajeABasePuntos(PARAMETROS.comisionEnvioPorcentaje),
  pagoMinimoCentavos: aCentavos(PARAMETROS.pagoMinimo),
});

module.exports = { TARIFAS, PARAMETROS, COMISION_RESTAURANTE_PB, OPCIONES_ENVIO };
