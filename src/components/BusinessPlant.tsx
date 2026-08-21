import type { AppTab } from './TabNav'
import type { PlantLeaf, PlantStage } from '../types/profile'
import seedArt from '../assets/plant/business-seed.png'
import plantRamaArt from '../assets/plant/business-growth-trunk-branch.png'
import plantArt from '../assets/plant/business-plant.png'
import treeArt from '../assets/plant/business-tree.png'

type Props = {
  businessName: string
  stage: PlantStage
  leaves: PlantLeaf[]
  quickLinks: PlantLeaf[]
  onNavigate: (tab: AppTab) => void
}

const STAGE_ART: Record<PlantStage, string> = {
  semilla: seedArt,
  planta_rama: plantRamaArt,
  planta: plantArt,
  arbol: treeArt,
}

const STAGE_LABEL: Record<PlantStage, string> = {
  semilla: 'Semilla de negocio',
  planta_rama: 'Tronco con primera rama',
  planta: 'Planta de negocio',
  arbol: 'Árbol de negocio',
}

const STAGE_ALT: Record<PlantStage, (title: string) => string> = {
  semilla: (title) => `Semilla de ${title}`,
  planta_rama: (title) => `Tronco con rama de ${title}`,
  planta: (title) => `Planta de ${title}`,
  arbol: (title) => `Árbol de ${title}`,
}

const PLANT_LEAF_HOTSPOTS = [
  { left: 50, top: 43 },
  { left: 36, top: 51 },
  { left: 64, top: 52 },
  { left: 34, top: 63 },
  { left: 66, top: 64 },
]

const TREE_LEAF_HOTSPOTS = [
  { left: 50, top: 25 },
  { left: 36, top: 30 },
  { left: 64, top: 30 },
  { left: 28, top: 40 },
  { left: 72, top: 40 },
  { left: 40, top: 47 },
  { left: 60, top: 47 },
]

function toneByLeafId(id: PlantLeaf['id']) {
  if (id === 'deudas') return 'risk'
  if (id === 'ventas' || id === 'caja' || id === 'compras') return 'good'
  return 'neutral'
}

function iconByLeafId(id: PlantLeaf['id']) {
  if (id === 'ventas') return '💰'
  if (id === 'caja') return '🧾'
  if (id === 'operacion') return '⚙️'
  if (id === 'gente') return '👥'
  if (id === 'atencion') return '🎧'
  if (id === 'compras') return '🛒'
  return '📉'
}

export function BusinessPlant({
  businessName,
  stage,
  leaves,
  quickLinks,
  onNavigate,
}: Props) {
  const title = businessName.trim() || 'Tu negocio'
  const stageArt = STAGE_ART[stage]
  const stageAlt = STAGE_ALT[stage](title)
  const leafHotspots =
    stage === 'arbol' ? TREE_LEAF_HOTSPOTS : PLANT_LEAF_HOTSPOTS
  const showLeafHotspots = stage === 'planta' || stage === 'arbol'

  return (
    <section className="business-plant" aria-label="Mapa de tu negocio">
      <p className="plant-kicker">Mapa vivo del negocio</p>
      <strong className="plant-name">{title}</strong>
      <p className="plant-stage">{STAGE_LABEL[stage]}</p>

      <div className={`plant-canvas stage-${stage}`}>
        <button
          type="button"
          className="plant-stage-art"
          onClick={() => onNavigate('finanzas')}
          aria-label="Abrir finanzas del negocio"
        >
          <img src={stageArt} alt={stageAlt} />
        </button>

        {showLeafHotspots &&
          leaves.slice(0, leafHotspots.length).map((leaf, i) => {
            const hotspot = leafHotspots[i]
            return (
              <button
                key={`${leaf.id}-leaf`}
                type="button"
                className="plant-real-leaf"
                style={{
                  left: `${hotspot.left}%`,
                  top: `${hotspot.top}%`,
                }}
                onClick={() => onNavigate(leaf.tab)}
                title={`Ir a ${leaf.label}`}
                aria-label={`Hoja de ${leaf.label}. Ir a ${leaf.label}`}
                data-label={leaf.label}
              />
            )
          })}
      </div>

      {leaves.length === 0 ? (
        <div className="plant-links">
          {quickLinks.map((quick) => (
            <button key={quick.id} type="button" className="tiny-link" onClick={() => onNavigate(quick.tab)}>
              {quick.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="plant-links">
          {leaves.map((leaf) => (
            <button
              key={leaf.id}
              type="button"
              className={`tiny-link tone-${toneByLeafId(leaf.id)}`}
              onClick={() => onNavigate(leaf.tab)}
            >
              <span className="tiny-ico" aria-hidden>
                {iconByLeafId(leaf.id)}
              </span>
              {leaf.label}
              <span className="tiny-trend" aria-hidden>
                {leaf.id === 'deudas' ? '▼' : '▲'}
              </span>
            </button>
          ))}
        </div>
      )}

      {stage === 'arbol' && (
        <p className="plant-note">
          Umbral referencial de empresa formal. Valídalo con tu contador.
        </p>
      )}
    </section>
  )
}
