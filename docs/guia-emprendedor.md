# Guía rápida — Emprendedor VE

Herramienta offline para estimar costos, precios y caja en bolívares, dólares y euros.
Los tributos son **referenciales**. Valida siempre con un contador certificado.

## Flujo en 5 minutos

1. **Tasas** — al abrir, la app intenta traer USD y EUR del BCV (vía dolarapi). También puedes editarlas a mano y pulsar **Aplicar**, o **Actualizar BCV**.
2. **Inventario** — carga costo en USD, **margen planificado %** y cantidad (escenario).
3. **Ventas reales** — registra ventas por **semana** con tasas USD/EUR inicio–fin. El **IPR** avisa si conviene subir precios (presión cambiaria, no inflación oficial). Opcional: desglosa **productos vendidos** (desde Inventario) para ver más vendidos y contribución en Bs.
4. **Finanzas** — ganancia bruta y plan de asignación (no contabilidad).
5. **Tributos / Capital / Vista global** — referencial; valida con contador.

Ver también: [`variables-supervivencia-90-dias.md`](variables-supervivencia-90-dias.md).

## Persistencia

El escenario se guarda en este dispositivo (`localStorage`). **Borrar escenario** restaura los valores iniciales. No se envían tus números a ningún servidor (solo el GET de tasas).

## Qué no hace esta herramienta

- No es declaración SENIAT / IVSS / alcaldía.
- No sustituye asesoría fiscal o legal.
- No exporta PDF (aún).
