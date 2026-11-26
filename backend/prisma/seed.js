// Carga inicial de configuración: propuesta de la sección 3 (tarifas) y sección 4 (comisiones).
// Repetible: correrlo varias veces no duplica tarifas ni parámetros vigentes.
const { aCentavos, aPesos, porcentajeABasePuntos } = require("../src/calculos/dinero");
const { aMetros } = require("../src/calculos/tarifas");

const BANDERA_CERRAR_SOBRANTES = "--cerrar-sobrantes";

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

const PARAMETROS = Object.freeze({
  comisionRestauranteDefault: "10.00", // 10%
  comisionEnvioPorcentaje: "10.00", // 10%
  pagoMinimoRepartidor: "15.00", // $15
});

// --- Decisiones (funciones puras, se prueban sin base de datos) ---

/**
 * @param existente tarifa vigente con el mismo hastaKm, o null
 * @returns "crear" | "actualizar" | "sin_cambios"
 */
function decidirTarifa(existente, deseada) {
  if (!existente) return "crear";
  return aCentavos(existente.tarifaCliente) === aCentavos(deseada.tarifaCliente) ? "sin_cambios" : "actualizar";
}

/** Compara los valores como enteros (centavos / puntos base), nunca como floats. */
function parametrosIguales(a, b) {
  return (
    porcentajeABasePuntos(a.comisionRestauranteDefault) === porcentajeABasePuntos(b.comisionRestauranteDefault) &&
    porcentajeABasePuntos(a.comisionEnvioPorcentaje) === porcentajeABasePuntos(b.comisionEnvioPorcentaje) &&
    aCentavos(a.pagoMinimoRepartidor) === aCentavos(b.pagoMinimoRepartidor)
  );
}

/**
 * @param vigente registro de Parametros con vigenteHasta = null, o null
 * @returns "crear" | "reemplazar" (cerrar el vigente y crear uno nuevo) | "sin_cambios"
 */
function decidirParametros(vigente, deseados) {
  if (!vigente) return "crear";
  return parametrosIguales(vigente, deseados) ? "sin_cambios" : "reemplazar";
}

/**
 * Tarifas vigentes cuyo hastaKm no está en la propuesta. No modifica nada.
 * Compara en metros enteros para que "1" y "1.00" (o un Decimal) sean el mismo tramo.
 */
function decidirCierreTarifas(vigentes, propuesta) {
  const enPropuesta = new Set(propuesta.map((t) => aMetros(t.hastaKm)));
  return vigentes.filter((t) => !enPropuesta.has(aMetros(t.hastaKm)));
}

// --- Aplicación (dentro de una transacción) ---

/**
 * @param opciones.cerrarSobrantes true para cerrar (vigenteHasta = ahora) las tarifas que no están en la propuesta
 * @returns resumen { tarifas: {crear, actualizar, sin_cambios}, sobrantes: [{id, hastaKm, tarifaCliente}],
 *                    sobrantesCerradas: número, parametros: accion }
 */
async function sembrar(
  prisma,
  { tarifas = TARIFAS, parametros = PARAMETROS, ahora = new Date(), cerrarSobrantes = false } = {}
) {
  return prisma.$transaction(async (tx) => {
    const resumen = {
      tarifas: { crear: 0, actualizar: 0, sin_cambios: 0 },
      sobrantes: [],
      sobrantesCerradas: 0,
      parametros: null,
    };

    const vigentesAntes = await tx.tarifa.findMany({
      where: { vigenteHasta: null },
      select: { id: true, hastaKm: true, tarifaCliente: true },
    });
    resumen.sobrantes = decidirCierreTarifas(vigentesAntes, tarifas);
    if (cerrarSobrantes) {
      for (const sobrante of resumen.sobrantes) {
        await tx.tarifa.update({ where: { id: sobrante.id }, data: { vigenteHasta: ahora } });
      }
      resumen.sobrantesCerradas = resumen.sobrantes.length;
    }

    for (const tramo of tarifas) {
      const existente = await tx.tarifa.findFirst({
        where: { hastaKm: tramo.hastaKm, vigenteHasta: null },
        select: { id: true, tarifaCliente: true },
      });
      const accion = decidirTarifa(existente, tramo);
      if (accion === "crear") {
        await tx.tarifa.create({ data: { ...tramo, vigenteDesde: ahora } });
      } else if (accion === "actualizar") {
        await tx.tarifa.update({ where: { id: existente.id }, data: { tarifaCliente: tramo.tarifaCliente } });
      }
      resumen.tarifas[accion] += 1;
    }

    const vigente = await tx.parametros.findFirst({
      where: { vigenteHasta: null },
      orderBy: { vigenteDesde: "desc" },
    });
    const accion = decidirParametros(vigente, parametros);
    if (accion === "reemplazar") {
      await tx.parametros.update({ where: { id: vigente.id }, data: { vigenteHasta: ahora } });
    }
    if (accion === "crear" || accion === "reemplazar") {
      await tx.parametros.create({ data: { ...parametros, vigenteDesde: ahora } });
    }
    resumen.parametros = accion;

    return resumen;
  });
}

async function main() {
  require("dotenv").config();
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const cerrarSobrantes = process.argv.includes(BANDERA_CERRAR_SOBRANTES);
    const r = await sembrar(prisma, { cerrarSobrantes });
    console.log(
      `Tarifas: ${r.tarifas.crear} creadas, ${r.tarifas.actualizar} actualizadas, ${r.tarifas.sin_cambios} sin cambios. ` +
        `Parámetros: ${r.parametros}.`
    );
    if (r.sobrantes.length > 0 && !cerrarSobrantes) {
      console.log("Tarifas vigentes que no están en la propuesta:");
      for (const t of r.sobrantes) {
        console.log(`  - hasta ${t.hastaKm} km: $${aPesos(aCentavos(t.tarifaCliente))}`);
      }
      console.log(`Ejecuta npm run seed -- ${BANDERA_CERRAR_SOBRANTES} para cerrarlos`);
    } else if (cerrarSobrantes) {
      console.log(`Tarifas sobrantes cerradas: ${r.sobrantesCerradas}.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Error al cargar la configuración:", error.message);
    process.exit(1);
  });
}

module.exports = {
  TARIFAS,
  PARAMETROS,
  BANDERA_CERRAR_SOBRANTES,
  decidirTarifa,
  decidirParametros,
  decidirCierreTarifas,
  parametrosIguales,
  sembrar,
};
