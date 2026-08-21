# Bitácora de producto — Calculadora Emprendedor VE

Decisiones y pendientes entre sesiones. Lo vigente está arriba.
Tributos = referencial. No guardar escenarios numéricos del usuario.

## Pendientes vigentes

- Ensamblar ramas/hojas restantes en Blender y exportar capas modulares.
- Conectar capas modulares por estado de hoja en `BusinessPlant.tsx`.
- Hotspots clicables alineados a posiciones reales de hojas en el render.

## Hecho reciente

- Etapa **tronco + 1 rama** exportada e integrada en web (`planta_rama`).
- Pestaña **Crecimiento**: galería de fases desde `growth-stages.json` (preview sin reglas de perfil).

## Historial

### 2026-08-19 — Crecimiento visual natural de la planta

**Diseño cerrado.** La planta crece de forma progresiva según la evolución real del emprendimiento, no por tiempo decorativo.

#### Flujo visual acordado

| Nivel | Estado visual | Significado |
|-------|---------------|-------------|
| 0 | Semilla | Idea en validación, sin ventas estables |
| 1 | Brote / tallo | Primeras ventas o primeros clientes |
| 2 | Tronco + 1 rama | Operación inicial con una función principal activa |
| 3 | Tronco + varias ramas | Aparecen más frentes del negocio |
| 4 | Ramas con hojas | Cada función/departamento visible con estado (`healthy` / `warning` / `critical`) |
| 5 | Árbol | Negocio formalizado y más maduro |

#### Criterio de activación

Cada transición se dispara por **hitos del negocio**, no por tiempo:

- primera venta,
- recurrencia de ingresos,
- estructura de costos,
- más de una función activa,
- formalización.

#### Pipeline 3D (Meshy + Blender)

- Piezas: maceta, tronco (4 anclajes de rama), rama (`0819190125`), hoja (`0819190816`).
- Ensamblaje paso a paso: ramas primero, hojas después.
- Escena de trabajo: `src/assets/plant/business-plant-modular.blend`.
- Rama inferior izquierda calzada; unión suavizada en base (geometría + materiales finales disimulan el resto).

#### Validación antes de implementar en app

1. Preview estático de los 6 estados (una pantalla por nivel).
2. Confirmar que la progresión se entiende sin texto explicativo.
3. Ajustar solo: cuándo nace la primera rama y cuándo aparecen hojas.
4. Conectar reglas a `profile`, `plantStage` y `plantLeaves`.

---

### 2026-08-19 — Onboarding + planta viva

- Decisión: onboarding obligatorio para usuarios nuevos y para escenarios legacy sin perfil.
- Decisión: la planta representa al negocio del usuario, no a la marca.
- Implementación acordada: piezas modulares (semilla, tallo, tronco, ramas, hojas) + navegación por hojas.
- Hecho: onboarding, perfil persistido, `BusinessPlant` en sidebar, reglas base en `plant.ts` (semilla / planta / árbol).
