import growthCatalog from '../assets/plant/growth-stages.json'
import seedArt from '../assets/plant/business-seed.png'
import trunkBranchArt from '../assets/plant/business-growth-trunk-branch.png'
import plantArt from '../assets/plant/business-plant.png'
import treeArt from '../assets/plant/business-tree.png'

export type GrowthStageId =
  | 'semilla'
  | 'brote'
  | 'planta_rama'
  | 'planta_ramas'
  | 'planta'
  | 'arbol'

export type GrowthStage = {
  id: GrowthStageId
  level: number
  label: string
  description: string
  art: string | null
  blend: string | null
  ready: boolean
  criteria: string
}

const ART_BY_FILE: Record<string, string> = {
  'business-seed.png': seedArt,
  'business-growth-trunk-branch.png': trunkBranchArt,
  'business-plant.png': plantArt,
  'business-tree.png': treeArt,
}

export const GROWTH_STAGES: GrowthStage[] = growthCatalog.stages as GrowthStage[]

export function growthStageArt(stage: GrowthStage): string | null {
  if (!stage.art) return null
  return ART_BY_FILE[stage.art] ?? null
}

export function growthStageById(id: GrowthStageId): GrowthStage | undefined {
  return GROWTH_STAGES.find((s) => s.id === id)
}
