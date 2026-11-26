---
name: revision-pedido
description: Revisar cambios que tocan cálculos de dinero, comisiones, tarifas o pedidos en Pedimo antes de darlos por terminados.
---

# Revisión de cambios de dinero

Checklist obligatorio:

- [ ] No hay floats en montos (buscar Number, parseFloat y decimales en cálculos).
- [ ] Redondeo con dinero.js, medio hacia arriba al centavo.
- [ ] Caso de $300 a 2 km da cliente $330, restaurante $30, repartidor $27, plataforma $3.
- [ ] Pago mínimo de $15 aplicado al repartidor.
- [ ] Ninguna tarifa hardcodeada fuera de la configuración.
- [ ] Pruebas nuevas para el cambio y pruebas anteriores pasan.

Responder solo con: lista marcada y resultado de npm test. Si algo no cumple, corregir antes de reportar.
