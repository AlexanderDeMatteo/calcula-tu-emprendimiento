# Diagnóstico del consejo — Calculadora Emprendedor VE

Fecha: 2026-08-04  
Contexto: herramienta para emprendedores en Venezuela (Bs / USD / EUR, fiscal referencial).  
Método: consejo de 5 agentes (crítico, ciberseguridad, diseño, economista, UX/UI).

```
Engagement:
- [x] 1. Enmarcar
- [x] 2. Diagnosticar (5 agentes)
- [x] 3. Diseñar opciones
- [x] 4. Recomendar
- [x] 5. Activar
```

## Frame

| Pregunta | Respuesta (inferida) |
|----------|----------------------|
| Decisión | ¿El producto sirve al emprendedor venezolano y qué priorizar ahora? |
| Éxito | Que un emprendedor VE pueda fijar precio/margen con tasas Bs/USD/EUR y ver caja real (`Supuesto:` sin backend ni marketing aún). |
| Restricciones | Fiscal referencial; app local; audiencia no-técnica. |
| Ya hecho | Migración React + TypeScript + Vite con secciones completas. |
| Quién decide | Producto / Ledezma. |

---

## Voces del consejo

### Crítico

**Veredicto:** objetar (producto útil, modelo contable incompleto)

**Top fallas:**

1. 🔴 Margen planificado existe en datos (`product.margen`) pero no es editable en `ProductTable` — solo se muestra efectivo. Rompe el job “costo → margen → precio” del emprendedor VE.
2. 🔴 `utilNeta = ganNet - gasTotal` ignora `paraTotal` / `munTotal` / `nacTotal` — el consolidado puede pintar “Rentable” con tributos aparte.
3. 🟡 Dos reinversiones desacopladas (`reinvPct` vs `dist.reinv`); bases fiscales EUR manuales ≠ ventas.
4. 🟡 Sin persistencia: refresh = perder escenario (dolor alto en VE donde se itera tasa a diario).
5. 🟢 Docs con checklist de paridad en `[ ]` miente el estado.

**Condición para avanzar:** editable margen + consolidar (o etiquetar claramente) impuestos en utilidad.

### Ciberseguridad

**Veredicto:** aprobar con mitigaciones

**Activos:** escenarios de negocio, salarios, márgenes (sensibles si se persisten/comparten).

**Hallazgos:**

1. 🟢 JSX sin `dangerouslySetInnerHTML` — mejor que el HTML original.
2. 🟡 Si añaden `localStorage` / PDF / share: datos fiscales en claro en el dispositivo.
3. 🟡 Futura API de tasas: validar origen, HTTPS, no confiar ciegamente en el número.
4. 🟢 Offline-first reduce superficie de red hoy.

**Hardening inmediato:** al persistir, scope por dispositivo + aviso; nunca subir escenarios a un backend sin consentimiento.

### Diseño

**Veredicto:** mantener sistema actual; pulir densidad

**Diagnóstico visual:**

- Navy/gold coherente con marca.
- Tipografía Segoe/system.
- Fondo flat `#f4f5f7`.
- Es dashboard denso (correcto para herramienta, no landing).

**Dirección:** herramienta financiera VE — claridad numérica > hero marketing.

**Cambios prioritarios:**

- Jerarquía del consolidado (resultado primero).
- Aliviar tabla (menos tri-moneda por celda en mobile).
- Reforzar marca LD sin competir con el H1 largo.

### Economista

**Veredicto:** viable con condiciones

**Números clave:**

- Defaults BCV `40.5` / EUR `44.2` — útiles solo si el usuario actualiza (hint 4 pm; sin API).
- Márgenes seed 40/35/45; umbrales ≥35 / ≥20 — alineados al dominio VE.
- Distribución 20+15+16+9+25+15 = 100% sobre **ventas brutas**, no sobre ganancia — puede sobreestimar “utilidad neta” del bucket.
- Municipales/SENIAT sobre ingresos EUR manuales — desconectados del inventario.

**Sensibilidad:** sin editar margen ni sync tasa, el modelo enseña mal pricing.

**Recomendación económica:** priorizar fidelidad del modelo (margen editable + utilidad después de tributos referenciales + “usar ventas como base”) antes que PDF/marketing.

**Disclaimer:** orientación referencial; validar con contador certificado en VE.

### UX/UI

**Veredicto:** fricción alta en la tarea central

**Job to be done:** “Con mi costo en USD y la tasa BCV de hoy, ¿a cuánto vendo en Bs y qué me queda?”

**Fricciones top:**

1. Margen no editable → usuario debe inventar `pvRef` o vivir con defaults.
2. Scroll largo: resultado al final; impuestos piden 3 bases aparte.
3. Tabla `min-width: 1100px` — mobile = scroll horizontal.
4. “Aplicar” tasas es correcto, pero fácil olvidar tras editar.

**Flujo recomendado:** Tasas (aplicar) → Productos (costo + **margen %** + precio opcional) → Resultado consolidado sticky → Impuestos con “rellenar desde ventas” → Distribución como % de plan, no verdad contable.

**Prueba de hecho:** en &lt;5 min, producto nuevo con margen 35% y tasa actual → ver utilidad neta creíble.

---

## Opciones

| Opción | Impacto | Esfuerzo | Riesgo | Reversible |
|--------|---------|----------|--------|------------|
| A. Fijar modelo+UX core (margen, consolidado, persistencia, sync bases) | alto | med | bajo | sí |
| B. Features vitrina (PDF, API tasas, rediseño landing) | med | med-alto | alto (deuda de modelo) | sí |
| C. Congelar y solo documentar uso | bajo | bajo | alto (adopción) | sí |

---

## Decisión

Priorizar **Opción A**: cerrar el modelo para el emprendedor venezolano (margen editable, utilidad que no mienta, persistencia local, bases fiscales ligadas a ventas) antes de features de marketing o PDF.

El producto ya tiene el encaje correcto (tri-moneda + checklist fiscal VE); lo que falta es **confianza en el número final**.

## Por qué

- El diferencial VE (BCV/EUR, parafiscales, municipales, SENIAT referencial) ya está; eso es el moat.
- Un margen no editable + utilidad sin impuestos enseña decisiones de precio incorrectas — peor que no tener app.
- `Supuesto:` el usuario típico actualiza tasa a diario y pierde el escenario al refrescar → persistencia local es alto ROI.

## Plan (próximos 7–30 días)

1. **Input margen %** en `ProductTable` + hint “precio publicado override” — criterio de hecho: se puede cambiar 30→40 y ver sugerido.
2. **Consolidado honesto:** restar tributos activos de utilidad *o* renombrar a “antes de impuestos” + tarjeta “después de tributos (ref.)” — criterio de hecho: no dice “Rentable” ignorando IVA/parafiscales.
3. **Botón “Usar ventas como base EUR”** en municipales/SENIAT — criterio de hecho: 1 click llena `ingresosMunEUR` / `ingresosNacEUR`.
4. **`localStorage`** del escenario + “última tasa” — criterio de hecho: F5 conserva datos; aviso de privacidad.
5. **Tests unitarios** de `calc.ts` (producto, impuestos, global) — criterio de hecho: ≥8 casos con tasas 40.5/44.2.
6. Actualizar docs checklist a “hecho” + guía de uso de 1 página para emprendedor.

## Métricas

- **KPI principal:** tiempo a primer escenario creíble &lt; 5 min (prueba con 3 usuarios VE).
- **Señales de alerta:** utilidad “Rentable” con tributos &gt; 20% de ganancia no reflejados; tasa default sin tocar &gt; 7 días en sesión guardada.

## Riesgos y mitigación

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| Usuario toma % SENIAT/municipales como ley | alta | alto | Disclaimer visible + “referencial” en cada panel + CTA contador |
| Consolidar mal los impuestos | media | alto | Tests + etiqueta clara de qué entra en utilidad |
| localStorage con datos sensibles en PC compartido | media | med | Aviso + botón borrar escenario |
| Overbuild API tasas antes de modelo sano | media | med | Diferir API a fase 2 |

## No hacer

- Rediseñar como landing “AI purple” o marketing hero.
- PDF/export antes de corregir margen y utilidad.
- Presentar la distribución de ingresos como contabilidad real (es plan de asignación sobre ventas).
- Prometer cumplimiento SENIAT/IVSS sin contador.

---

## Siguiente paso inmediato

Agregar el campo editable de **margen %** en la tabla de productos (mayor gap vs el job del emprendedor VE).

---

## Evidencia técnica (resumen)

- Stack: React 19 + TypeScript + Vite; app funcional en `src/`.
- Cálculos: `src/lib/calc.ts` (`computeProductRow`, `computeTaxes`, `computeGlobal`).
- Margen no editable: `ProductTable.tsx` muestra `margenEfectivo` read-only.
- Utilidad neta: `utilNeta = financial.ganNet - gasTotal` (sin restar totales fiscales).
- Defaults: `src/data/defaults.ts` (tasas vía hook; dist 100%; productos seed).
- Tema: `src/styles/theme.css` (navy/gold, dashboard denso).
- Disclaimer fiscal: README + footer de la app.

---

## Estado del plan de mejora

| Fase | Entrega | Estado |
|------|---------|--------|
| 1.1 | Margen % editable | Hecho |
| 1.2 | Consolidado dual (antes/después tributos) | Hecho |
| 2.1 | Usar ventas como base EUR | Hecho |
| 2.2 | Copy distribución vs reinversión | Hecho |
| 2.3 | H1 corto, sticky consolidado, mobile sub-ref | Hecho |
| 3 | Fetch tasas BCV USD/EUR | Hecho |
| 4 | localStorage + borrar escenario | Hecho |
| 5 | Tests Vitest + docs | Hecho |
