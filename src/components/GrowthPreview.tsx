import { useMemo, useState } from 'react'
import {
  GROWTH_STAGES,
  growthStageArt,
  type GrowthStage,
  type GrowthStageId,
} from '../lib/growthStages'
import type { PlantStage } from '../types/profile'

type Props = {
  activeStage: PlantStage
}

function defaultSelection(activeStage: PlantStage): GrowthStageId {
  if (activeStage === 'planta_rama') return 'planta_rama'
  if (activeStage === 'planta') return 'planta'
  if (activeStage === 'arbol') return 'arbol'
  return 'semilla'
}

export function GrowthPreview({ activeStage }: Props) {
  const [selectedId, setSelectedId] = useState<GrowthStageId>(() =>
    defaultSelection(activeStage),
  )

  const selected = useMemo(
    () => GROWTH_STAGES.find((s) => s.id === selectedId) ?? GROWTH_STAGES[0],
    [selectedId],
  )

  const selectedArt = growthStageArt(selected)
  const readyCount = GROWTH_STAGES.filter((s) => s.ready).length

  return (
    <div className="growth-preview">
      <div className="growth-summary card">
        <p className="growth-kicker">Laboratorio visual</p>
        <h2 className="growth-title">Fases de crecimiento</h2>
        <p className="growth-copy">
          Aquí revisamos cada fase terminada antes de conectarla al perfil del negocio.
          Etapa activa en sidebar: <strong>{stageLabel(activeStage)}</strong>.
        </p>
        <p className="growth-meta">
          {readyCount} de {GROWTH_STAGES.length} fases con arte listo
        </p>
      </div>

      <div className="growth-layout">
        <ol className="growth-timeline" aria-label="Fases de crecimiento">
          {GROWTH_STAGES.map((stage) => (
            <li key={stage.id}>
              <button
                type="button"
                className={`growth-step${selected.id === stage.id ? ' active' : ''}${
                  stage.ready ? ' ready' : ' pending'
                }`}
                onClick={() => setSelectedId(stage.id)}
                aria-current={selected.id === stage.id ? 'step' : undefined}
              >
                <span className="growth-step-level">N{stage.level}</span>
                <span className="growth-step-label">{stage.label}</span>
                <span className={`growth-badge${stage.ready ? ' ok' : ''}`}>
                  {stage.ready ? 'Lista' : 'Pendiente'}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <StageDetail stage={selected} art={selectedArt} />
      </div>
    </div>
  )
}

function StageDetail({ stage, art }: { stage: GrowthStage; art: string | null }) {
  return (
    <article className="growth-detail card" aria-labelledby={`growth-${stage.id}`}>
      <header className="growth-detail-head">
        <div>
          <p className="growth-kicker">Nivel {stage.level}</p>
          <h3 id={`growth-${stage.id}`}>{stage.label}</h3>
        </div>
        <span className={`growth-badge${stage.ready ? ' ok' : ''}`}>
          {stage.ready ? 'Arte listo' : 'En construcción'}
        </span>
      </header>

      <div className={`growth-canvas${art ? '' : ' empty'}`}>
        {art ? (
          <img src={art} alt={`Ilustración: ${stage.label}`} />
        ) : (
          <div className="growth-placeholder">
            <span aria-hidden>🌱</span>
            <p>Fase en Blender — aún sin export web</p>
          </div>
        )}
      </div>

      <p className="growth-copy">{stage.description}</p>

      <dl className="growth-facts">
        <div>
          <dt>Criterio de activación</dt>
          <dd>{stage.criteria}</dd>
        </div>
        {stage.blend && (
          <div>
            <dt>Archivo Blender</dt>
            <dd>
              <code>{stage.blend}</code>
            </dd>
          </div>
        )}
        {stage.art && (
          <div>
            <dt>Asset web</dt>
            <dd>
              <code>{stage.art}</code>
            </dd>
          </div>
        )}
      </dl>
    </article>
  )
}

function stageLabel(stage: PlantStage): string {
  if (stage === 'planta_rama') return 'Tronco con primera rama'
  if (stage === 'planta') return 'Planta de negocio'
  if (stage === 'arbol') return 'Árbol de negocio'
  return 'Semilla de negocio'
}
