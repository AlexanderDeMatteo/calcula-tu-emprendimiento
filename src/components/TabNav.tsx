import type { KeyboardEvent } from 'react'

export type AppTab =
  | 'productos'
  | 'finanzas'
  | 'tributos'
  | 'capital'
  | 'ventas'
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
    subtitle: 'Productos, costos, márgenes y precios publicados (escenario).',
    icon: '▣',
  },
  {
    id: 'ventas',
    label: 'Ventas reales',
    title: 'Ventas reales',
    subtitle:
      'Registro semanal del negocio + presión cambiaria USD/EUR (IPR) para ajustar precios.',
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
    id: 'tributos',
    label: 'Tributos',
    title: 'Tributos',
    subtitle: 'Parafiscales, municipales y SENIAT (referencial).',
    icon: '▦',
  },
  {
    id: 'capital',
    label: 'Capital',
    title: 'Capital',
    subtitle: 'Capital inicial y gastos fijos mensuales.',
    icon: '⬡',
  },
  {
    id: 'resultado',
    label: 'Vista global',
    title: 'Vista global',
    subtitle: 'Cuadro consolidado y utilidad referencial.',
    icon: '◎',
  },
]

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
}

export function SidebarNav({ active, onChange, onNavigate }: Props) {
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
      {APP_TABS.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            className={`side-link${selected ? ' active' : ''}`}
            aria-current={selected ? 'page' : undefined}
            onClick={() => select(tab.id)}
          >
            <span className="side-ico" aria-hidden>
              {tab.icon}
            </span>
            <span className="side-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

/** @deprecated horizontal tabs kept for reference; shell uses SidebarNav */
export function TabNav(props: Props) {
  return <SidebarNav {...props} />
}
