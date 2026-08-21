# Guía rápida — Emprendedor VE

Herramienta offline para estimar costos, precios y caja en bolívares, dólares y euros.
Los tributos son **referenciales**. Valida siempre con un contador certificado.

## Antes del dashboard

Al abrir por primera vez, completarás un onboarding obligatorio. Con esas respuestas la app:

- Crea el perfil real de tu negocio (etapa, equipo, foco del mes).
- Genera tu planta (semilla, planta o árbol) como mapa vivo.
- Activa hojas clicables por función para entrar rápido a cada área.

Si ya tenías un escenario guardado de versiones anteriores, verás el onboarding una sola vez para crear el perfil.

## Flujo en 5 minutos

1. **Tasas** — al abrir, la app intenta traer USD y EUR del BCV (vía dolarapi). También puedes editarlas a mano y pulsar **Aplicar**, o **Actualizar BCV**.
2. **Inventario** — carga costo en USD, **margen planificado %** y cantidad (escenario).
3. **Ventas reales** — registra ventas por **semana** con tasas USD/EUR inicio–fin. El **IPR** avisa si conviene subir precios (presión cambiaria, no inflación oficial). Opcional: desglosa **productos vendidos** (desde Inventario) para ver más vendidos y contribución en Bs.
4. **Finanzas** — **Apéndice I** muestra el puente de caja (bruta → reinversión del plan → gastos → cuotas → tributos → utilidad ref.). Si sale negativo, el escenario no cubre obligaciones. **Apéndice II** es el plan de caja por modo (sobrevivir / crecer / pagar deuda / dueño); Recalcular reparte ventas y alinea la reinversión del I. No es un P&L contable.
5. **Deudas** — saldo y cuota mensual; la cuota baja la utilidad en Vista global y entra al plan de caja.
6. **Tributos / Capital / Vista global** — referencial; valida con contador.

### Modos del plan de caja

| Modo | Qué prioriza del sobrante |
|------|---------------------------|
| Sobrevivir | Más utilidad/caja al dueño |
| Crecer | Más reinversión |
| Pagar deuda | Cuota × 1.25 (ref.) + resto a caja |
| Dueño | Utilidad al dueño con algo de reinversión |

Ver también: [`variables-supervivencia-90-dias.md`](variables-supervivencia-90-dias.md).

## Persistencia

El escenario se guarda en este dispositivo (`localStorage`). **Borrar escenario** restaura los números, pero conserva el perfil del negocio y la planta. No se envían tus números a ningún servidor (solo el GET de tasas).

## Qué no hace esta herramienta

- No es declaración SENIAT / IVSS / alcaldía.
- No sustituye asesoría fiscal o legal.
- No exporta PDF (aún).
