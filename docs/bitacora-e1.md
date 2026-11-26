# Bitácora — Entregable 1 (esquema de base de datos y motor de cálculo)

Referencia: docs/Pedimo_Requerimientos.docx v0.3, secciones 3, 4 y 7.

## 1. Estado

- E1 implementado y validado contra las secciones 3, 4 y 7.
- Migración `entregable1` aplicada (`backend/prisma/migrations/20261126032732_entregable1/`).
- Seed ejecutado: 8 tramos de tarifa y parámetros vigentes (10% / 10% / $15).
- `npm test`: 38 pruebas pasando. `npx prisma validate` sin errores. `npm run dev` responde en `/api/health`.

## 2. Archivos

Creados:
- backend/prisma/seed.js, backend/prisma/migrations/20261126032732_entregable1/migration.sql
- backend/src/configuracion.js
- backend/test/fixtures/parametros.js, backend/test/configuracion.test.js, backend/test/seed.test.js
- docs/bitacora-e1.md

Modificados:
- backend/src/calculos/tarifas.js, comisiones.js, pedido.js (sin valores de respaldo)
- backend/test/calculos/tarifas.test.js, comisiones.test.js, pedido.test.js
- backend/package.json (scripts `seed` y `test` limitado a `test/**/*.test.js`)
- backend/index.js (se quitó una línea suelta)

## 3. Decisiones tomadas

- Montos en centavos enteros en el código; `Decimal` en Prisma. Nunca floats.
- Cálculos como funciones puras en `backend/src/calculos/`; sin valores por defecto: tarifas, porcentajes y pago mínimo se pasan siempre como argumento.
- `cargarParametros(prisma)` en `backend/src/configuracion.js` lee la configuración vigente y lanza error si falta algo.
- Parámetros y tarifas con historial (`vigenteDesde` / `vigenteHasta`). Un cambio de parámetros cierra el registro vigente y crea uno nuevo.
- Seed repetible: no duplica tarifas ni parámetros vigentes. Las tarifas vigentes que no están en la propuesta solo se cierran con `npm run seed -- --cerrar-sobrantes`.
- Comisión de envío negativa permitida en el motor (la plataforma pone la diferencia si la tarifa es menor que el pago mínimo). La validación al guardar tarifas queda para E4.
- Usuario de base de datos `pedimo_app` con CREATEDB solo en desarrollo local (lo requiere la base sombra de `prisma migrate dev`).

## 4. Pendientes para E2 o posteriores

- Modo sin conexión: decidir IndexedDB (Dexie) y diseñar la cola de sincronización.
- Conflictos de edición entre repartidor y administrador: última modificación gana, registrando ambas versiones en Auditoría.
- Validación de tarifa mínima al guardar tarifas (E4).

## 5. Cómo retomar

```
cd backend && npm install
npx prisma validate
npm test            # 38 pruebas
npm run dev         # API en http://localhost:3000, revisar /api/health
npm run seed        # solo si falta configuración; es repetible

cd frontend && npm install
npm run dev         # Vite
```
