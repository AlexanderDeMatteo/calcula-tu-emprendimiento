import { rateLabel } from '../lib/format'
import type { BcvFetchStatus, Rates, RatesSource } from '../types/calculator'

type Props = {
  rates: Rates
  draftRates: Rates
  lastUpdate: string
  ratesSource: RatesSource
  bcvStatus: BcvFetchStatus
  bcvError: string | null
  onDraftChange: (patch: Partial<Rates>) => void
  onApply: () => void
  onRefreshBcv: () => void
  onResetScenario: () => void
  onMenuToggle?: () => void
}

export function TopbarRates({
  rates,
  draftRates,
  lastUpdate,
  ratesSource,
  bcvStatus,
  bcvError,
  onDraftChange,
  onApply,
  onRefreshBcv,
  onResetScenario,
  onMenuToggle,
}: Props) {
  const loading = bcvStatus === 'loading'

  return (
    <header className="shell-topbar">
      <div className="shell-top-left">
        {onMenuToggle ? (
          <button
            type="button"
            className="menu-btn"
            onClick={onMenuToggle}
            aria-label="Abrir menú"
          >
            ☰
          </button>
        ) : null}
        <div className="shell-rates-inline">
          <label className="shell-rate">
            <span>USD</span>
            <strong>{rateLabel(rates.bcv)}</strong>
            <input
              className="rate-inp"
              type="number"
              step="0.01"
              min={1}
              value={draftRates.bcv}
              onChange={(e) => onDraftChange({ bcv: parseFloat(e.target.value) || 0 })}
              aria-label="Tasa BCV Bs/USD"
            />
          </label>
          <label className="shell-rate">
            <span>EUR</span>
            <strong>{rateLabel(rates.eur)}</strong>
            <input
              className="rate-inp"
              type="number"
              step="0.01"
              min={1}
              value={draftRates.eur}
              onChange={(e) => onDraftChange({ eur: parseFloat(e.target.value) || 0 })}
              aria-label="Tasa Bs/EUR"
            />
          </label>
          <button type="button" className="rate-btn" onClick={onApply}>
            Aplicar
          </button>
        </div>
      </div>

      <div className="shell-top-right">
        <div className="shell-meta">
          <span className="shell-meta-lbl">Actualizado</span>
          <span className="shell-meta-val">{lastUpdate}</span>
          <span className="shell-meta-hint">
            BCV oficial{ratesSource === 'bcv' ? ' · auto' : ' · manual'}
          </span>
        </div>
        <button
          type="button"
          className="rate-btn rate-btn-bcv"
          onClick={onRefreshBcv}
          disabled={loading}
        >
          {loading ? '…' : 'Actualizar BCV'}
        </button>
        <button type="button" className="rate-btn rate-btn-ghost" onClick={onResetScenario}>
          Borrar
        </button>
      </div>

      {bcvError ? <div className="shell-top-error">{bcvError}</div> : null}
    </header>
  )
}
