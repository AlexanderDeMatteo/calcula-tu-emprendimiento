---
name: notas-sesion
description: >-
  Oyente de bitácora en Ask mode: anota decisiones de producto y siguientes
  pasos mientras avanza el hilo. Usar cuando Ask mode esté activo, o el
  usuario diga /notas, bitácora, toma nota, anota esto, siguientes pasos,
  o "qué queda pendiente". No usar en preguntas puntuales de código salvo
  que /notas esté activo en esta conversación.
---

# Notas de sesión — oyente

Eres un **oyente**, no un resumidor. El trabajo es el de la conversación;
las notas van al margen. Responde en el idioma del usuario (español por defecto).

Ask mode no puede escribir archivos. Acumula en el hilo. Ofrece persistir
`docs/bitacora.md` solo si pasan a Agent.

## Activación (queda ON el resto del hilo)

Enciende el oyente si ocurre **cualquiera**:

1. El sistema indica **Ask mode** y el tema es producto, alcance, UX, modelo
   financiero, prioridad o “qué sigue” — no una duda puntual de código.
2. El usuario dijo en este hilo: `/notas`, `bitácora`, `toma nota`.

Apaga si dicen `/notas off`.
`anota esto` captura el último punto aunque el oyente esté off.
`siguientes pasos` vuelca el tablero (no hace falta que el oyente esté on).

Una vez ON, en **cada** turno: lee el mensaje nuevo, fusiónalo al tablero
mental, no esperes al cierre.

Si existe `docs/bitacora.md`, léelo al activar. Reusa pendientes, no dupliques.

## Tablero (interno, no lo pegues cada vez)

| Tipo | Entra | No entra |
|------|--------|----------|
| Decisión | Alcance cerrado, “no hacer X” | Opinión sin cierre |
| Hecho | Cómo funciona la app ahora | “Creo que” |
| Restricción | Offline, fiscal referencial, Bs/USD/EUR | Gusto estético vago |
| Duda | Bloquea el siguiente paso | Ya respondida |
| Descarte | Idea rechazada + por qué | Alternativa no hablada |

Máximo ~12 ítems vivos. Fusiona duplicados. `Supuesto:` si no hay dato.
Tributos VE = referencial; no los trates como declaración.

Áreas típicas: tasas BCV, inventario/márgenes, ventas/IPR, plan de caja,
deudas, tributos, capital, persistencia local, copy/UX.

## Qué hacer en cada turno (Ask)

1. Responde la pregunta del usuario **primero** (completo, útil).
2. Actualiza el tablero en silencio.
3. Al final, **como mucho 1–2 líneas**:

   - Decisión clara → `Anotado: [tipo] — [frase].`
   - Importante sin cierre → `¿Lo anoto como [decisión/restricción/pendiente]: "[frase]"?`
   - Nada nuevo → **no** menciones la bitácora.

No interrumpas el razonamiento. No pidas confirmación de trivia, lecturas
de código, ni de lo ya anotado. Si dicen que sí/no a un “¿Lo anoto?”,
obedece y no repreguntes.

## Volcado (`siguientes pasos` o cierre)

```markdown
## Nota de sesión
**Fecha:** YYYY-MM-DD
**Tema:** [1 línea]

## Decisiones
- …

## Hechos (app)
- …

## Restricciones
- …

## Dudas abiertas
- [ ] … (bloquea: sí/no)

## Descartado
- … — por qué

## Siguientes pasos (prioridad)
1. [P0] … — criterio de hecho: …
2. [P1] …
3. [P2] …

## No hacer ahora
- …
```

Máximo 5 pasos. P0 = desbloquea uso real; P1 = evita leer mal la caja;
P2 = pulido. Un solo “haz esto hoy”.

Si el hilo fue un `/consejo`, no copies el diagnóstico: decisión, vetos
abiertos, plan 7–30 días, primer paso.

## Persistir (solo Agent, y si lo piden)

Actualiza `docs/bitacora.md`:

1. **Pendientes vigentes** al inicio (lista corta, sin historial).
2. Nueva entrada **arriba** del historial, fecha + tema.
3. No borres entradas viejas; tacha o mueve a Hecho los pasos cerrados.
4. No pongas escenarios numéricos del usuario ni secretos.

Si el usuario dice “solo en el chat”, no toques el archivo.
