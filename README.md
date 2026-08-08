# Calculadora Emprendedor Venezuela (React)

Adaptación a React + TypeScript + Vite de la calculadora HTML de Ledezma Digital Agency.

- Documentación funcional: [`docs/calculadora-emprendedor-venezuela.md`](./docs/calculadora-emprendedor-venezuela.md)
- Guía rápida para emprendedores: [`docs/guia-emprendedor.md`](./docs/guia-emprendedor.md)
- Variables supervivencia 90 días: [`docs/variables-supervivencia-90-dias.md`](./docs/variables-supervivencia-90-dias.md)
- Primera revisión CFO: [`docs/primera-revision.md`](./docs/primera-revision.md)
- Diagnóstico del consejo: [`docs/diagnostico.md`](./docs/diagnostico.md)

## Cómo correr

```bash
npm install
npm run dev
```

Build de producción:

```bash
npm run build
```

Tests:

```bash
npm test
```

## Estructura

- `src/hooks/useCalculator.ts` — estado, persistencia y fetch BCV
- `src/lib/calc.ts` — cálculos puros (productos, impuestos, global)
- `src/lib/bcvRates.ts` — parse/fetch tasas USD/EUR
- `src/lib/storage.ts` — `localStorage` del escenario
- `src/lib/format.ts` — formato Bs / USD / EUR
- `src/components/*` — secciones de UI
- `src/styles/theme.css` — tema visual

## Tasas BCV

Al cargar (y con el botón **Actualizar desde BCV**) se consultan USD y EUR oficiales vía [dolarapi.com](https://ve.dolarapi.com) (republica BCV). Si falla, se intenta `bcv.today` como respaldo. Si ambas fallan, puedes editar las tasas manualmente. Verifica en [bcv.org.ve](https://www.bcv.org.ve/) si hay discrepancia.

## Persistencia

El escenario se guarda solo en este dispositivo (`localStorage`). No se envían datos de negocio a la red.

## Nota

Los datos fiscales son referenciales. Consulta siempre a un contador certificado.
