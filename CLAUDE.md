# Pedimo

Reparto de comida para pueblos (Atliaca).
Fuente de verdad: docs/Pedimo_Requerimientos.docx. Consulta solo la sección necesaria.

## Stack y comandos

- Backend: Node.js, Express, Prisma 6 (prisma-client-js), PostgreSQL 16. Carpeta: backend/
- Frontend: React + Vite (PWA). Carpeta: frontend/
- Pruebas backend: cd backend && npm test
- Servidor: cd backend && npm run dev

## Reglas de negocio

- Repartidor paga la comida al restaurante y cobra al cliente el total al entregar.
- Comisión restaurante: 10% del monto de la comida, se paga en corte semanal (domingo, plazo martes).
- Comisión de envío de la plataforma: 10% de la tarifa. Repartidor recibe 90%, mínimo $15.
- Máximo 2 pedidos simultáneos por repartidor.

## Reglas técnicas

- Dinero en centavos enteros o Decimal. Nunca floats para montos.
- Lógica de cálculo en backend/src/calculos/, funciones puras.
- Cambios de esquema con migración: npx prisma migrate dev --name <nombre>.
- No ejecutar prisma migrate reset ni borrar datos sin confirmación.
- Nunca leer ni mostrar .env ni contraseñas.
- Antes de terminar: npm test y npm run dev sin errores.

## Lectura económica

- No leas docs/ completo. Busca la sección con grep.
- No leas archivos generados ni dependencias.

## Idioma

- Mensajes, comentarios y nombres de negocio en español. Código técnico en inglés cuando sea habitual.
