---
name: cambio-esquema
description: Modificar prisma/schema.prisma de Pedimo con migración segura. Usar cuando se agregue o cambie una tabla, campo o relación.
---

# Cambio de esquema

1. Leer solo el modelo que se va a cambiar, no el archivo completo.
2. Hacer el cambio mínimo. No renombrar ni borrar campos existentes sin confirmación.
3. Validar: cd backend && npx prisma validate && npx prisma format.
4. Crear la migración: npx prisma migrate dev --name <descripcion_corta>.
5. Revisar el SQL en backend/prisma/migrations/ del cambio nuevo. Confirmar que no hay DROP de datos.
6. Ejecutar npm test.
7. Si el cambio afecta pedidos, confirmar que los montos guardados no dependen de tarifas vigentes (snapshot).
8. Resumen de máximo 10 líneas: campos cambiados, nombre de la migración, resultado.
