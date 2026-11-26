---
name: nuevo-endpoint
description: Crear una ruta nueva de Express en Pedimo con validación, manejo de errores y prueba. Usar cuando se pida un endpoint o API nueva.
---

# Nuevo endpoint

1. Crear el router en backend/src/rutas/<recurso>.js.
2. Validar la entrada antes de tocar la base. Rechazar con 400 y mensaje en español.
3. Montos siempre en centavos. Llamar a las funciones de backend/src/calculos/, no recalcular en la ruta.
4. Errores: responder con { ok: false, error: "mensaje" }. Nunca exponer stack ni datos de conexión.
5. Registrar la ruta en backend/index.js.
6. Escribir una prueba en backend/test/ con un caso válido y uno inválido.
7. Ejecutar cd backend && npm test. No terminar si falla.
8. Resumen de máximo 10 líneas: archivos creados, ruta, resultado de pruebas.
