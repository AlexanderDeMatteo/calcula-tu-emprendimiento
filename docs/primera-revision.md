# Primera revisión — Diagnóstico CFO

Fecha: 2026-08-04  
Proyecto: Calculadora Emprendedor VE  
Rol: Economista Senior / CFO / Asesor tributario VE (orientación referencial)  
Fuente: revisión del código y modelo (`src/lib/calc.ts`, defaults, secciones UI)

> **Disclaimer:** orientación referencial. No sustituye a un contador o abogado certificado. Validar tasas, bases y deberes formales con profesional colegiado.

---

## Veredicto global

La app es un **simulador de escenario VE** sólido (BCV + markup + checklist fiscal referencial + utilidad dual). **No es contabilidad ni declaración.**

El riesgo de negocio principal es que el usuario lea **“Rentable”** o **margen “Buena”** como **caja neta real**, sin modelar IGTF operativo, retenciones (retraso de caja), LOTTT completa ni aportes especiales (LOCTI, FONA/SUDEBIP, FND, IGP).

---

## Mapa del modelo (cómo se conecta el dinero)

| Etapa | Origen | Qué produce |
|--------|--------|-------------|
| Tasas BCV | Topbar / dolarapi | Conversión USD/EUR ↔ Bs |
| Inventario | Costo USD × margen → precio | `invBs`, `venBs`, `ganBs` |
| Finanzas | `ganBs` − reinversión % | `ganNet` (“disponible”) |
| Tributos | Nómina + bases EUR | `paraTotal` + `munTotal` + `nacTotal` |
| Capital | Listas editables Bs | `capTotal`, `gasTotal` |
| Vista global | `ganNet − gastos − tributos` | Utilidad antes/después (ref.) |

---

## 0. Tasas BCV (barra superior)

| Aspecto | Estado | Lectura CFO |
|---------|--------|-------------|
| USD / EUR oficiales | Fetch + override manual | Correcto para economía bimonetaria |
| Persistencia | Escenario en dispositivo | Bien para iterar tasa diaria |
| Brecha cambiaria | **No modelada** | Si compras/vendes con paralelo, el margen de inventario **miente** |

**Advertencia:** fijar precios en Bs con tasa BCV y reponer stock a otra tasa **come margen** sin que la app lo muestre.

---

## 1. Inventario (Productos)

| Qué hay | Qué falta / riesgo |
|---------|---------------------|
| Costo solo USD → Bs BCV | Costo mixto Bs / “carga oculta” |
| Margen planificado + efectivo + badge | Badge = markup bruto, **no** margen neto |
| Precio publicado USD/EUR | Sin IGTF/comisión al cobrar en divisas |
| Cant. × precio = ventas escenario | No es stock ni capital de trabajo |

| Semáforo interno | Criterio app | Uso correcto |
|------------------|--------------|--------------|
| Buena | ≥ 35% sobre costo | Markup de lista |
| Ajustada | ≥ 20% | Zona de alerta comercial |
| Baja | &lt; 20% | No cubre shocks VE típicos |

**Advertencia:** no tomes “Buena” como luz verde de utilidad neta.

### Ejemplo con seeds (Supuesto: tasa BCV ≈ 752,09 Bs/USD)

| Producto | Cant. | Costo unit. USD | Margen plan. | Lectura |
|----------|------:|----------------:|-------------:|---------|
| A | 10 | 5,00 | 40% | Markup alto de catálogo |
| B | 25 | 2,50 | 35% | Umbral “Buena” |
| C | 5 | 12,00 | 45% | Markup alto de catálogo |

Los totales de inventario/ventas/ganancia dependen de la tasa del día y del precio publicado (si hay override).

---

## 2. Finanzas (Apéndice I + II)

### Apéndice I — Resumen

| Concepto en UI | Fórmula | Interpretación correcta |
|----------------|---------|-------------------------|
| Monto invertido | Σ costo × cant | Valor de mercancía del escenario |
| Ventas | Σ precio publicado × cant | Ingreso bruto del escenario |
| Ganancia bruta | Ventas − costo mercancía | **Antes** de fijos e impuestos |
| Reinversión % | % de ganancia bruta | Política de reinversión, no gasto contable |
| Ganancia disponible | Bruta − reinversión | Queda para fijos/caja **antes** de tributos del panel |

### Apéndice II — Distribución

| Default % | Etiqueta | Nota CFO |
|-----------|----------|----------|
| 20 | Reinversión | **No sincronizado** con slider del Apéndice I |
| 15 | Inversores | Plan de asignación |
| 16 | Impuestos | **No** es el cálculo SENIAT/municipales |
| 9 | Parafiscales | **No** es IVSS/FAOV real |
| 25 | Nómina | **No** es el gasto de Capital ni el salario parafiscal |
| 15 | Utilidad neta | Sobre **ventas brutas** → puede pintar utilidad irreal |

**Advertencia:** la distribución es **presupuesto de asignación sobre ventas**, no P&amp;L. Si la usas como contabilidad, **sobreestimas utilidad**.

---

## 3. Tributos (parafiscales / municipales / SENIAT)

| Bloque | Base real en app | Defaults | Hueco CFO |
|--------|------------------|----------|-----------|
| Parafiscales | Salario mensual (Bs/USD/EUR) | IVSS 11/4, FAOV 2/1, INCES 2, RPE 2/0.25 | Sin **prestaciones, utilidades, vacaciones LOTTT**; total solo **empleador** |
| Municipales | Ingresos brutos en **EUR** (manual o “usar ventas”) | ISAE 1.5%, pub 0.5%, aseo 0.2%, licencia 20 € | % ISAE varía por municipio/actividad; bomberos no tipificado aparte |
| SENIAT | Misma idea base **EUR** | IVA 16%, ISLR est. **1.5% sobre ingresos**, IGTF 3% off | **ISLR no debería ser % plano sobre ingresos brutos**; IVA aquí es proxy, no débito/crédito ni retenciones; IGTF off por defecto |

| Riesgo de doble conteo | Dónde |
|------------------------|--------|
| Nómina en **Capital/gastos** + parafiscales sobre salario | Misma masa salarial puede restarse dos veces mal o una vez incompleta |
| % “Impuestos/Parafiscales” en **Finanzas II** + paneles Tributos | Usuario cree que ya “pagó” dos veces o que el consolidado está de más |

**Advertencia — deberes formales:** la app no modela máquinas fiscales, libros compra/venta, anticipos ISLR reales ni calendarios de declaración. **Multas por deberes formales no aparecen en el consolidado.**

**Faltan del radar VE (si aplica por tamaño/sector):** LOCTI, FONA/SUDEBIP, FND, IGP.

---

## 4. Capital (inicial + gastos fijos)

| Lista | Seeds | Uso correcto |
|-------|-------|--------------|
| Capital inicial | Inventario, equipos, registro, licencia (montos 0) | Capex / arranque; **independiente** del `invBs` de productos |
| Gastos fijos | Alquiler, servicios, nómina, logística (0) | Opex mensual en Bs |

| Problema | Efecto |
|----------|--------|
| `invBs` (productos) ≠ ítem “Inventario inicial” del capital | Dos “inventarios” mentales; el consolidado usa productos para “capital invertido (inventario)” y `capTotal` solo en nota del PE |
| Nómina en gastos = 0 y salario parafiscal aparte | Fácil olvidar carga laboral completa |
| Todo en Bs fijos | Sin indexación automática a BCV |

---

## 5. Vista global (consolidado)

| Card | Fórmula | Lectura correcta |
|------|---------|------------------|
| Capital invertido (inventario) | `invBs` productos | Costo mercancía del escenario |
| Ventas / Ganancia bruta | De Finanzas | Pre-fijos |
| Gastos fijos | Σ gastos | Opex |
| Utilidad antes de tributos | `ganNet − gasTotal` | Tras reinversión y fijos |
| Tributos (ref.) | para + mun + nac | Solo ítems activos del panel |
| Utilidad después (ref.) | Antes − tributos | **Única** luz “Rentable/Revisar” |
| Punto de equilibrio | `gastos / gananciaBruta × 100` | % de ganancia bruta que absorbe fijos — **no** incluye tributos en el PE |

**Advertencia:** “Rentable” ignora LOTTT completa, IGTF operativo si cobras en divisas, retenciones (retraso de caja) y aportes especiales. Es **rentable en el modelo**, no certificado fiscalmente.

---

## 6. KPIs del shell (siempre visibles)

| KPI | Valor | Riesgo de lectura |
|-----|-------|-------------------|
| Productos | Conteo | OK |
| Ventas + margen % | Margen = ganancia bruta / ventas | Margen sobre ventas ≠ markup sobre costo del inventario |
| Utilidad post-tributos | Click a Vista global | Mejor ancla; sigue siendo referencial |

---

## Matriz de prioridades (blindar rentabilidad)

| Prioridad | Sección | Acción de producto / uso |
|-----------|---------|---------------------------|
| 1 | Inventario | Buffer “carga oculta” + precio piso |
| 2 | Tributos | Etiquetar ISLR como **estimación burda**; no confundir con tarifa legal |
| 3 | Finanzas II | Mantener copy “no contabilidad”; no mezclar con paneles |
| 4 | Capital | Enlazar o avisar: nómina gastos vs salario parafiscal |
| 5 | Vista global | PE que también muestre cobertura de tributos ref. |
| 6 | Radar | LOCTI / deporte / antidrogas solo si el perfil lo exige |

---

## Preguntas para la siguiente revisión

1. **¿Entidad y sector?** (firma personal / Pyme / C.A.; comercio, servicio, producción)  
2. **¿Cómo cobras?** (% VES vs USD/EUR; ¿punto / transferencia en divisas → IGTF?)  
3. **¿Nómina formal?** (sí/no y orden de magnitud salarial mensual)

Con esas respuestas se puede armar un **precio piso por producto** y un **calendario de caja referencial** alineado al flujo real del negocio.
