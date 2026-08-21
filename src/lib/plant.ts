import type { AppTab } from '../components/TabNav'
import type {
  BusinessProfile,
  DepartmentKey,
  PlantLeaf,
  PlantStage,
} from '../types/profile'

export const DEPARTMENT_LABELS: Record<DepartmentKey, string> = {
  ventas: 'Ventas',
  caja: 'Caja',
  operacion: 'Operación',
  gente: 'Gente',
  deudas: 'Deudas',
  atencion: 'Atención',
  compras: 'Compras',
}

export const DEPARTMENT_TAB_MAP: Record<DepartmentKey, AppTab> = {
  ventas: 'ventas',
  caja: 'finanzas',
  operacion: 'productos',
  gente: 'tributos',
  deudas: 'deudas',
  atencion: 'ventas',
  compras: 'capital',
}

const DEFAULT_QUICK_LINKS: PlantLeaf[] = [
  { id: 'operacion', label: DEPARTMENT_LABELS.operacion, tab: 'productos' },
  { id: 'ventas', label: DEPARTMENT_LABELS.ventas, tab: 'ventas' },
  { id: 'caja', label: DEPARTMENT_LABELS.caja, tab: 'finanzas' },
]

export function derivePlantStage(profile: BusinessProfile): PlantStage {
  if (profile.stage === 'formalizado') return 'arbol'

  const growing =
    profile.hasSales ||
    profile.stage === 'informal' ||
    profile.departments.length > 0 ||
    profile.peopleCount > 1

  if (!growing) return 'semilla'

  const earlyGrowth =
    profile.hasSales &&
    profile.departments.length <= 1 &&
    profile.peopleCount <= 2 &&
    !profile.hasFormalEmployees

  if (earlyGrowth) return 'planta_rama'

  return 'planta'
}

export function derivePlantLeaves(profile: BusinessProfile): PlantLeaf[] {
  const stage = derivePlantStage(profile)
  if (stage === 'semilla' || stage === 'planta_rama') return []

  const picked = new Set<DepartmentKey>(profile.departments)
  if (profile.hasSales) {
    picked.add('ventas')
    picked.add('caja')
  }
  if (profile.peopleCount > 1 || profile.hasFormalEmployees) picked.add('gente')
  if (profile.hasDebt) picked.add('deudas')
  if (profile.model !== 'servicio') picked.add('operacion')

  return Array.from(picked).map((id) => ({
    id,
    label: DEPARTMENT_LABELS[id],
    tab: DEPARTMENT_TAB_MAP[id],
  }))
}

export function deriveQuickLinks(profile: BusinessProfile): PlantLeaf[] {
  const leaves = derivePlantLeaves(profile)
  return leaves.length > 0 ? leaves : DEFAULT_QUICK_LINKS
}
