import { useMemo, useState } from 'react'
import type { DistMode } from '../types/calculator'
import {
  defaultBusinessProfile,
  type BusinessModel,
  type BusinessProfile,
  type BusinessSector,
  type BusinessSite,
  type BusinessStage,
  type DepartmentKey,
} from '../types/profile'

type Props = {
  initial: BusinessProfile
  onComplete: (profile: BusinessProfile) => void
}

type Step = 0 | 1 | 2 | 3 | 4 | 5

const DEPARTMENT_OPTIONS: Array<{ key: DepartmentKey; label: string }> = [
  { key: 'ventas', label: 'Ventas' },
  { key: 'caja', label: 'Caja' },
  { key: 'operacion', label: 'Operación' },
  { key: 'gente', label: 'Gente' },
  { key: 'atencion', label: 'Atención' },
  { key: 'compras', label: 'Compras' },
  { key: 'deudas', label: 'Deudas' },
]

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`chip${active ? ' chip-active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export function OnboardingWizard({ initial, onComplete }: Props) {
  const [step, setStep] = useState<Step>(0)
  const [draft, setDraft] = useState<BusinessProfile>({
    ...defaultBusinessProfile(),
    ...initial,
  })

  const showDepartments = draft.peopleCount >= 3 || draft.stage === 'formalizado'

  const totalSteps = showDepartments ? 6 : 5
  const stepLabel = `Paso ${step + 1} de ${totalSteps}`

  const canNext = useMemo(() => {
    if (step === 0) return draft.name.trim().length > 1
    return true
  }, [draft.name, step])

  function toggleDepartment(dep: DepartmentKey) {
    setDraft((prev) => {
      const has = prev.departments.includes(dep)
      return {
        ...prev,
        departments: has
          ? prev.departments.filter((d) => d !== dep)
          : [...prev.departments, dep],
      }
    })
  }

  function goNext() {
    if (!canNext) return
    if (step === 4 && !showDepartments) {
      onComplete({ ...draft, complete: true, departments: [] })
      return
    }
    if (step === 5) {
      onComplete({ ...draft, complete: true })
      return
    }
    setStep((s) => (s + 1) as Step)
  }

  function goBack() {
    setStep((s) => (Math.max(0, s - 1) as Step))
  }

  return (
    <div className="onboarding-wrap">
      <div className="onboarding-card">
        <div className="onboarding-head">
          <p className="onboarding-step">{stepLabel}</p>
          <h1>Vamos a sembrar tu negocio</h1>
          <p>Necesitamos estos datos para generar tu planta y tu panel real.</p>
        </div>

        {step === 0 && (
          <section className="onboarding-step-body">
            <h2>Identidad</h2>
            <label>
              Nombre del emprendimiento
              <input
                value={draft.name}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Arepera La Esquina"
              />
            </label>
            <div className="onboarding-grid-2">
              <label>
                Estado
                <input
                  value={draft.estado}
                  onChange={(e) => setDraft((p) => ({ ...p, estado: e.target.value }))}
                />
              </label>
              <label>
                Ciudad
                <input
                  value={draft.ciudad}
                  onChange={(e) => setDraft((p) => ({ ...p, ciudad: e.target.value }))}
                />
              </label>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="onboarding-step-body">
            <h2>Oficio</h2>
            <p>Selecciona lo que más se parece a tu negocio hoy.</p>
            <div className="chips">
              {(['comercio', 'comida', 'servicios', 'produccion', 'mixto'] as BusinessSector[]).map(
                (sector) => (
                  <Chip
                    key={sector}
                    active={draft.sector === sector}
                    label={sector}
                    onClick={() => setDraft((p) => ({ ...p, sector }))}
                  />
                ),
              )}
            </div>

            <p style={{ marginTop: 10 }}>Modelo de negocio</p>
            <div className="chips">
              {(['producto', 'servicio', 'mixto'] as BusinessModel[]).map((model) => (
                <Chip
                  key={model}
                  active={draft.model === model}
                  label={model}
                  onClick={() => setDraft((p) => ({ ...p, model }))}
                />
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="onboarding-step-body">
            <h2>Etapa</h2>
            <div className="chips">
              {(['idea', 'informal', 'formalizado'] as BusinessStage[]).map((stage) => (
                <Chip
                  key={stage}
                  active={draft.stage === stage}
                  label={stage}
                  onClick={() => setDraft((p) => ({ ...p, stage }))}
                />
              ))}
            </div>
            <p className="tiny-help">
              El árbol representa un negocio formalizado. Esta lectura es referencial.
            </p>
          </section>
        )}

        {step === 3 && (
          <section className="onboarding-step-body">
            <h2>Cuerpo del negocio</h2>
            <label>
              Personas que trabajan (incluyéndote)
              <input
                type="number"
                min={1}
                value={draft.peopleCount}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, peopleCount: Math.max(1, Number(e.target.value) || 1) }))
                }
              />
            </label>
            <div className="chips">
              <Chip
                active={draft.hasFormalEmployees}
                label="Tengo empleados formales"
                onClick={() => setDraft((p) => ({ ...p, hasFormalEmployees: !p.hasFormalEmployees }))}
              />
              <Chip
                active={draft.hasDebt}
                label="Tengo deudas activas"
                onClick={() => setDraft((p) => ({ ...p, hasDebt: !p.hasDebt }))}
              />
              <Chip
                active={draft.hasSales}
                label="Ya vendo actualmente"
                onClick={() => setDraft((p) => ({ ...p, hasSales: !p.hasSales }))}
              />
            </div>

            <p style={{ marginTop: 10 }}>Dónde operas</p>
            <div className="chips">
              {(['casa', 'alquilado', 'propio', 'digital', 'otro'] as BusinessSite[]).map((site) => (
                <Chip
                  key={site}
                  active={draft.site === site}
                  label={site}
                  onClick={() => setDraft((p) => ({ ...p, site }))}
                />
              ))}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="onboarding-step-body">
            <h2>Prioridad del mes</h2>
            <div className="chips">
              {(['sobrevivir', 'crecer', 'pagar_deuda', 'dueno'] as DistMode[]).map((mode) => (
                <Chip
                  key={mode}
                  active={draft.monthFocus === mode}
                  label={mode.replace('_', ' ')}
                  onClick={() => setDraft((p) => ({ ...p, monthFocus: mode }))}
                />
              ))}
            </div>
          </section>
        )}

        {step === 5 && showDepartments && (
          <section className="onboarding-step-body">
            <h2>Funciones del negocio</h2>
            <p>Estas funciones aparecerán como hojas clicables.</p>
            <div className="chips">
              {DEPARTMENT_OPTIONS.map((dep) => (
                <Chip
                  key={dep.key}
                  active={draft.departments.includes(dep.key)}
                  label={dep.label}
                  onClick={() => toggleDepartment(dep.key)}
                />
              ))}
            </div>
          </section>
        )}

        <div className="onboarding-actions">
          <button type="button" className="add-btn ghost" onClick={goBack} disabled={step === 0}>
            Atrás
          </button>
          <button type="button" className="add-btn" onClick={goNext} disabled={!canNext}>
            {step === totalSteps - 1 ? 'Entrar al panel' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}
