-- CreateEnum
CREATE TYPE "EstadoAlta" AS ENUM ('ACTIVO', 'SUSPENDIDO', 'BAJA');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'ASIGNADO', 'RECOGIDO', 'ENTREGADO', 'CANCELADO', 'DEVUELTO');

-- CreateEnum
CREATE TYPE "EstadoCorte" AS ENUM ('PENDIENTE', 'PAGADO');

-- CreateEnum
CREATE TYPE "EstadoReclamo" AS ENUM ('ABIERTO', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "restaurantes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "comisionPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "estado" "EstadoAlta" NOT NULL DEFAULT 'ACTIVO',
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos_menu" (
    "id" SERIAL NOT NULL,
    "restauranteId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repartidores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "ine" TEXT NOT NULL,
    "capitalMaximo" DECIMAL(10,2) NOT NULL DEFAULT 500,
    "estado" "EstadoAlta" NOT NULL DEFAULT 'ACTIVO',
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repartidores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "restauranteId" INTEGER NOT NULL,
    "repartidorId" INTEGER,
    "corteId" INTEGER,
    "dia" DATE NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "clienteTelefono" TEXT NOT NULL,
    "clienteDireccion" TEXT NOT NULL,
    "claveEntrega" TEXT NOT NULL,
    "montoComida" DECIMAL(10,2) NOT NULL,
    "distanciaKm" DECIMAL(5,2) NOT NULL,
    "tarifaCliente" DECIMAL(10,2) NOT NULL,
    "pagoRepartidor" DECIMAL(10,2) NOT NULL,
    "comisionEnvio" DECIMAL(10,2) NOT NULL,
    "comisionRestaurante" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_productos" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "pedido_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas" (
    "id" SERIAL NOT NULL,
    "hastaKm" DECIMAL(4,2) NOT NULL,
    "tarifaCliente" DECIMAL(10,2) NOT NULL,
    "vigenteDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenteHasta" TIMESTAMP(3),

    CONSTRAINT "tarifas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametros" (
    "id" SERIAL NOT NULL,
    "comisionEnvioPorcentaje" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "pagoMinimoRepartidor" DECIMAL(10,2) NOT NULL DEFAULT 15,
    "comisionRestauranteDefault" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "vigenteDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenteHasta" TIMESTAMP(3),

    CONSTRAINT "parametros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cortes" (
    "id" SERIAL NOT NULL,
    "restauranteId" INTEGER NOT NULL,
    "periodoInicio" DATE NOT NULL,
    "periodoFin" DATE NOT NULL,
    "montoTotal" DECIMAL(10,2) NOT NULL,
    "descuentos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fechaPago" TIMESTAMP(3),
    "estado" "EstadoCorte" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "cortes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reclamos" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "corteId" INTEGER,
    "motivo" TEXT NOT NULL,
    "evidencia" TEXT NOT NULL,
    "montoDescontar" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoReclamo" NOT NULL DEFAULT 'ABIERTO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reclamos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entregas_efectivo" (
    "id" SERIAL NOT NULL,
    "repartidorId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montoEntregado" DECIMAL(10,2) NOT NULL,
    "montoPendiente" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "entregas_efectivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" SERIAL NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "valorAnterior" JSONB,
    "valorNuevo" JSONB,
    "usuario" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "productos_menu_restauranteId_idx" ON "productos_menu"("restauranteId");

-- CreateIndex
CREATE INDEX "pedidos_restauranteId_dia_idx" ON "pedidos"("restauranteId", "dia");

-- CreateIndex
CREATE INDEX "pedidos_repartidorId_dia_idx" ON "pedidos"("repartidorId", "dia");

-- CreateIndex
CREATE INDEX "pedidos_estado_idx" ON "pedidos"("estado");

-- CreateIndex
CREATE INDEX "pedido_productos_pedidoId_idx" ON "pedido_productos"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "cortes_restauranteId_periodoInicio_key" ON "cortes"("restauranteId", "periodoInicio");

-- CreateIndex
CREATE INDEX "reclamos_pedidoId_idx" ON "reclamos"("pedidoId");

-- CreateIndex
CREATE INDEX "entregas_efectivo_repartidorId_fecha_idx" ON "entregas_efectivo"("repartidorId", "fecha");

-- CreateIndex
CREATE INDEX "auditoria_entidad_entidadId_idx" ON "auditoria"("entidad", "entidadId");

-- AddForeignKey
ALTER TABLE "productos_menu" ADD CONSTRAINT "productos_menu_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_repartidorId_fkey" FOREIGN KEY ("repartidorId") REFERENCES "repartidores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_corteId_fkey" FOREIGN KEY ("corteId") REFERENCES "cortes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_productos" ADD CONSTRAINT "pedido_productos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_productos" ADD CONSTRAINT "pedido_productos_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos_menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cortes" ADD CONSTRAINT "cortes_restauranteId_fkey" FOREIGN KEY ("restauranteId") REFERENCES "restaurantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclamos" ADD CONSTRAINT "reclamos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclamos" ADD CONSTRAINT "reclamos_corteId_fkey" FOREIGN KEY ("corteId") REFERENCES "cortes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas_efectivo" ADD CONSTRAINT "entregas_efectivo_repartidorId_fkey" FOREIGN KEY ("repartidorId") REFERENCES "repartidores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
