import { describe, expect, it } from 'vitest'
import {
  derivePlantLeaves,
  derivePlantStage,
  deriveQuickLinks,
} from './plant'
import { defaultBusinessProfile, type BusinessProfile } from '../types/profile'

function profile(patch: Partial<BusinessProfile>): BusinessProfile {
  return { ...defaultBusinessProfile(), ...patch }
}

describe('derivePlantStage', () => {
  it('marca semilla en etapa idea unipersonal', () => {
    expect(derivePlantStage(profile({ stage: 'idea', peopleCount: 1 }))).toBe('semilla')
  })

  it('marca planta_rama en crecimiento temprano con ventas', () => {
    expect(
      derivePlantStage(
        profile({
          hasSales: true,
          peopleCount: 1,
          departments: [],
        }),
      ),
    ).toBe('planta_rama')
  })

  it('marca planta cuando ya hay mas funciones activas', () => {
    expect(
      derivePlantStage(
        profile({
          hasSales: true,
          peopleCount: 3,
          departments: ['ventas', 'operacion'],
        }),
      ),
    ).toBe('planta')
  })

  it('marca planta cuando ya hay ventas', () => {
    expect(
      derivePlantStage(
        profile({
          hasSales: true,
          peopleCount: 4,
          hasFormalEmployees: true,
        }),
      ),
    ).toBe('planta')
  })

  it('marca arbol cuando esta formalizado', () => {
    expect(derivePlantStage(profile({ stage: 'formalizado' }))).toBe('arbol')
  })
})

describe('derivePlantLeaves', () => {
  it('no genera hojas en etapa planta_rama', () => {
    expect(
      derivePlantLeaves(
        profile({
          hasSales: true,
          peopleCount: 1,
          departments: [],
        }),
      ),
    ).toEqual([])
  })

  it('no genera hojas en etapa semilla', () => {
    expect(derivePlantLeaves(profile({}))).toEqual([])
  })

  it('incluye hojas por ventas, equipo y deuda', () => {
    const leaves = derivePlantLeaves(
      profile({
        stage: 'informal',
        hasSales: true,
        peopleCount: 3,
        hasFormalEmployees: true,
        hasDebt: true,
        model: 'producto',
      }),
    )
    const ids = leaves.map((l) => l.id)
    expect(ids).toContain('ventas')
    expect(ids).toContain('caja')
    expect(ids).toContain('gente')
    expect(ids).toContain('deudas')
    expect(ids).toContain('operacion')
  })
})

describe('deriveQuickLinks', () => {
  it('devuelve atajos base cuando no hay hojas', () => {
    const quick = deriveQuickLinks(profile({}))
    expect(quick.map((q) => q.tab)).toEqual(['productos', 'ventas', 'finanzas'])
  })
})
