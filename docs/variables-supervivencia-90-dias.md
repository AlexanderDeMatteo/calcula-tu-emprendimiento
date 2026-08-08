# Variables de supervivencia — 90 días

Fecha: 2026-08-08  
Producto: Calculadora Emprendedor VE (genérica, cualquier rubro)  
Objetivo: que el negocio no quiebre por **precio desactualizado + caja** en el primer trimestre.

> Orientación referencial. No es inflación INE ni declaración fiscal.

---

## Mensaje de producto

**Te muestra si tu precio de hoy sigue siendo rentable con el dólar/euro de esta semana y tus gastos fijos — antes de que a los 90 días te quedes sin caja.**

---

## Núcleo universal (P0–P1)

| Prioridad | Variable | Para qué |
|-----------|----------|----------|
| P0 | Tasa BCV USD y EUR (serie) | Reposición |
| P0 | Costo → margen → precio publicado | Pricing |
| P0 | Gastos fijos mensuales | Punto de equilibrio |
| P0 | Ventas reales semanales | Hechos vs escenario |
| P1 | IPR / Δ% tasa 7–14 días | Cuándo subir precios |
| P1 | Buffer carga oculta % | Impuestos/comisiones aproximados |
| P1 | Política de cobro (días, mix moneda) | Caja |
| P2 | Tributos referenciales | No autoengañarse |
| P2 | Capital / runway | Semanas de oxígeno |
| P3 | Perfil de rubro (defaults) | Menos fricción |

---

## Pestaña Ventas reales (MVP)

Separada del Inventario (escenario).

| Campo | Descripción |
|-------|-------------|
| Semana | Fecha inicio – fin (7 días) |
| Ventas Bs | Ingresos reales en bolívares |
| Ventas USD (opc.) | Si cobras en divisas |
| Tasa USD inicio / fin | Snapshot BCV de la semana |
| Tasa EUR inicio / fin | Idem |
| Notas | Opcional |
| Productos (opc.) | Líneas desde Inventario: cant. + precio Bs cobrado; snapshot de costo USD |

### Indicadores

| Indicador | Fórmula (idea) | Lectura |
|-----------|----------------|---------|
| Δ% USD semana | `(usdFin − usdIni) / usdIni × 100` | Presión cambiaria USD |
| Δ% EUR semana | Igual con EUR | Presión EUR |
| **IPR** | `max(Δ% USD, Δ% EUR)` | Índice de presión de reposición |
| Alerta | IPR ≥ umbral (default 5%) | Revisar lista de precios |
| Equiv. USD de ventas | `ventasBs / usdFin` (si hay Bs) | Volumen comparable (ref.) |
| Contrib. por producto | `(precioBs − costoUSD × usdFin) × cant` | Antes de fijos/tributos; tasa fin = ref. |
| Rankings | Unidades y contribución Bs agregados | Más vendidos / mayor aporte |

Si hay líneas de producto, **Ventas Bs** de la semana = suma de ingresos de líneas. Sin líneas, el total sigue manual.

**No se llama “predicción de inflación”.** Se llama **presión de costos / cambiaria (ref.)**.

---

## Escenarios de uso (1–2 semanas)

1. Fijar / subir precios  
2. Reponer inventario  
3. Vigencia de cotizaciones  
4. Cobro a plazo / mix VES–USD  
5. Detectar margen “Bonito” que ya no es caja  
6. Ver qué productos mueven unidades vs contribución  

---

## Fuera de alcance MVP

- ML / forecast macro  
- LOCTI, IGP, PDF SENIAT  
- Mezclar ventas reales con filas de Inventario escenario (el catálogo solo alimenta el snapshot al agregar la línea)  
- Stock / descuento automático de inventario  
- Utilidad neta por producto (fijos y tributos siguen en Vista global)  
- Registro diario o tasa BCV por línea