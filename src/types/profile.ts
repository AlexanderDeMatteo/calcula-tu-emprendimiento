import type { AppTab } from '../components/TabNav'
import type { DistMode } from './calculator'

export type BusinessStage = 'idea' | 'informal' | 'formalizado'
export type BusinessModel = 'producto' | 'servicio' | 'mixto'
export type BusinessSector = 'comercio' | 'comida' | 'servicios' | 'produccion' | 'mixto'
export type BusinessSite = 'casa' | 'alquilado' | 'propio' | 'digital' | 'otro'
export type PlantStage = 'semilla' | 'planta_rama' | 'planta' | 'arbol'

export type DepartmentKey =
  | 'ventas'
  | 'caja'
  | 'operacion'
  | 'gente'
  | 'deudas'
  | 'atencion'
  | 'compras'

export type PlantLeaf = {
  id: DepartmentKey
  label: string
  tab: AppTab
}

export type BusinessProfile = {
  complete: boolean
  name: string
  estado: string
  ciudad: string
  sector: BusinessSector
  model: BusinessModel
  stage: BusinessStage
  peopleCount: number
  hasFormalEmployees: boolean
  site: BusinessSite
  hasDebt: boolean
  hasSales: boolean
  monthFocus: DistMode
  departments: DepartmentKey[]
}

export function defaultBusinessProfile(): BusinessProfile {
  return {
    complete: false,
    name: '',
    estado: 'Carabobo',
    ciudad: 'Valencia',
    sector: 'comercio',
    model: 'producto',
    stage: 'idea',
    peopleCount: 1,
    hasFormalEmployees: false,
    site: 'casa',
    hasDebt: false,
    hasSales: false,
    monthFocus: 'crecer',
    departments: [],
  }
}
