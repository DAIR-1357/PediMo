// Carga la configuración vigente (tablas Tarifa y Parametros) en el formato que usan los cálculos.

class ErrorConfiguracion extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "ErrorConfiguracion";
  }
}

function filtroVigencia(fecha) {
  return {
    vigenteDesde: { lte: fecha },
    OR: [{ vigenteHasta: null }, { vigenteHasta: { gt: fecha } }],
  };
}

/**
 * Lee tarifas y parámetros vigentes a la fecha indicada.
 * @returns {Promise<{ tramos: {hastaKm, tarifaCliente}[], comisionRestaurantePorcentaje,
 *                     comisionEnvioPorcentaje, pagoMinimo }>} valores como Prisma Decimal
 * @throws {ErrorConfiguracion} si no hay tarifas o parámetros vigentes
 */
async function cargarParametros(prisma, fecha = new Date()) {
  if (!prisma) throw new TypeError("Falta el cliente de Prisma");

  const [tarifas, parametros] = await Promise.all([
    prisma.tarifa.findMany({
      where: filtroVigencia(fecha),
      orderBy: { hastaKm: "asc" },
      select: { hastaKm: true, tarifaCliente: true },
    }),
    prisma.parametros.findFirst({
      where: filtroVigencia(fecha),
      orderBy: { vigenteDesde: "desc" },
    }),
  ]);

  const faltantes = [];
  if (!tarifas || tarifas.length === 0) faltantes.push("tarifas vigentes (tabla tarifas)");
  if (!parametros) faltantes.push("parámetros vigentes (tabla parametros)");
  if (faltantes.length > 0) {
    throw new ErrorConfiguracion(`Falta configuración: ${faltantes.join(" y ")}. Ejecuta npm run seed.`);
  }

  return {
    tramos: tarifas.map((t) => ({ hastaKm: t.hastaKm, tarifaCliente: t.tarifaCliente })),
    comisionRestaurantePorcentaje: parametros.comisionRestauranteDefault,
    comisionEnvioPorcentaje: parametros.comisionEnvioPorcentaje,
    pagoMinimo: parametros.pagoMinimoRepartidor,
  };
}

module.exports = { cargarParametros, ErrorConfiguracion };
