import type { KeyboardEvent } from 'react'

export type AppTab =
  | 'productos'
  | 'finanzas'
  | 'tributos'
  | 'capital'
  | 'deudas'
  | 'ventas'
  | 'crecimiento'
  | 'resultado'

export const APP_TABS: {
  id: AppTab
  label: string
  title: string
  subtitle: string
  icon: string
}[] = [
  {
    id: 'productos',
    label: 'Inventario',
    title: 'Inventario',
    subtitle: 'Existencias actuales, costos y precio. Reponer = subir la cantidad.',
    icon: '▣',
  },
  {
    id: 'ventas',
    label: 'Ventas reales',
    title: 'Ventas reales',
    subtitle: 'Anota lo que cobraste. La utilidad del mes sale de aquí.',
    icon: '▤',
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    title: 'Finanzas',
    subtitle: 'Resumen de ventas, reinversión y plan de asignación.',
    icon: '◇',
  },
  {
    id: 'capital',
    label: 'Capital',
    title: 'Capital',
    subtitle: 'Capital inicial y gastos fijos mensuales.',
    icon: '⬡',
  },
  {
    id: 'deudas',
    label: 'Deudas',
    title: 'Deudas',
    subtitle: 'Saldos y cuotas mensuales que afectan el plan de caja.',
    icon: '◆',
  },
  {
    id: 'tributos',
    label: 'Tributos',
    title: 'Tributos',
    subtitle: 'Parafiscales, municipales y SENIAT (referencial).',
    icon: '▦',
  },
  {
    id: 'resultado',
    label: 'Vista global',
    title: 'Vista global',
    subtitle: 'Cuadro consolidado y utilidad referencial.',
    icon: '◎',
  },
  {
    id: 'crecimiento',
    label: 'Crecimiento',
    title: 'Crecimiento',
    subtitle:
      'Laboratorio visual de la planta: revisa cada fase antes de conectarla al perfil.',
    icon: '🌿',
  },
]

/** Orden y agrupación del sidebar (flujo operación → finanzas → resumen). */
export const SIDEBAR_GROUPS: { label: string; tabs: AppTab[] }[] = [
  { label: 'Operación', tabs: ['productos', 'ventas'] },
  { label: 'Finanzas', tabs: ['finanzas', 'capital', 'deudas', 'tributos'] },
  { label: 'Resumen', tabs: ['resultado'] },
  { label: 'Laboratorio', tabs: ['crecimiento'] },
]

const TAB_BY_ID = Object.fromEntries(APP_TABS.map((t) => [t.id, t])) as Record<
  AppTab,
  (typeof APP_TABS)[number]
>

export const TAB_STORAGE_KEY = 'calculadora-emprendedor-ve:tab'

export function isAppTab(value: string | null): value is AppTab {
  return APP_TABS.some((t) => t.id === value)
}

export function loadStoredTab(): AppTab {
  try {
    const raw = localStorage.getItem(TAB_STORAGE_KEY)
    if (isAppTab(raw)) return raw
  } catch {
    // ignore
  }
  return 'productos'
}

export function saveStoredTab(tab: AppTab) {
  try {
    localStorage.setItem(TAB_STORAGE_KEY, tab)
  } catch {
    // ignore
  }
}

export function getTabMeta(id: AppTab) {
  return APP_TABS.find((t) => t.id === id) ?? APP_TABS[0]
}

type Props = {
  active: AppTab
  onChange: (tab: AppTab) => void
  onNavigate?: () => void
  onAddProduct?: () => void
}

export function SidebarNav({ active, onChange, onNavigate, onAddProduct }: Props) {
  function select(tab: AppTab) {
    onChange(tab)
    onNavigate?.()
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    const idx = APP_TABS.findIndex((t) => t.id === active)
    if (idx < 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      select(APP_TABS[(idx + 1) % APP_TABS.length].id)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      select(APP_TABS[(idx - 1 + APP_TABS.length) % APP_TABS.length].id)
    } else if (e.key === 'Home') {
      e.preventDefault()
      select(APP_TABS[0].id)
    } else if (e.key === 'End') {
      e.preventDefault()
      select(APP_TABS[APP_TABS.length - 1].id)
    }
  }

  return (
    <nav
      className="sidebar-nav"
      aria-label="Secciones de la calculadora"
      onKeyDown={onKeyDown}
    >
      {SIDEBAR_GROUPS.map((group) => (
        <div key={group.label} className="sidebar-nav-group">
          <p className="sidebar-nav-lbl">{group.label}</p>
          {group.tabs.map((tabId) => {
            const tab = TAB_BY_ID[tabId]
            const selected = tabId === active
            return (
              <button
                key={tabId}
                type="button"
                className={`side-link${selected ? ' active' : ''}`}
                aria-current={selected ? 'page' : undefined}
                onClick={() => select(tabId)}
              >
                <span className="side-ico" aria-hidden>
                  {tab.icon}
                </span>
                <span className="side-label">{tab.label}</span>
              </button>
            )
          })}
          {group.label === 'Operación' && onAddProduct ? (
            <button type="button" className="side-cta side-cta-inline" onClick={onAddProduct}>
              + Agregar producto
            </button>
          ) : null}
        </div>
      ))}
    </nav>
  )
}

/** @deprecated horizontal tabs kept for reference; shell uses SidebarNav */
export function TabNav(props: Props) {
  return <SidebarNav {...props} />
}
