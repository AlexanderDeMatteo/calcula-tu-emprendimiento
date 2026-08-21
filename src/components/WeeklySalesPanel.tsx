import { useEffect, useMemo, useState } from 'react'
import { computeProductRow } from '../lib/calc'
import { fbs, formatFriendlyDate, formatMonthLong, rateLabel } from '../lib/format'
import {
  DEFAULT_IPR_ALERT_PCT,
  availableStock,
  formatWeekRange,
  groupMonthSaleLines,
  lineRevenueBs,
  listMonthSaleLines,
  todayIsoDate,
  type MonthRealProfit,
  type WeeklySalesSummary,
} from '../lib/weeklySales'
import { monthProfitStatus } from '../lib/productStatus'
import type {
  Product,
  ProductQuoteCtx,
  Rates,
  WeeklySaleLine,
  WeeklySales,
} from '../types/calculator'

type Props = {
  rates: Rates
  products: Product[]
  quoteCtx: ProductQuoteCtx
  iprAlertPct: number
  monthReal: MonthRealProfit
  onIprAlertChange: (v: number) => void
  summary: WeeklySalesSummary
  onAddDailySale: (input: {
    date?: string
    productId: string
    qty: number
    unitPriceBs?: number
  }) => boolean
  onUpdate: (id: string, patch: Partial<WeeklySales>) => void
  onRemove: (id: string) => void
  onFillRates: (id: string, which: 'start' | 'end' | 'both') => void
  onUpdateLine: (
    weekId: string,
    lineId: string,
    patch: Partial<Pick<WeeklySaleLine, 'qty' | 'unitPriceBs' | 'saleDate'>>,
  ) => void
  onRemoveLine: (weekId: string, lineId: string) => void
  onGoInventory: () => void
}

export function WeeklySalesPanel({
  rates,
  products,
  quoteCtx,
  iprAlertPct,
  monthReal,
  onIprAlertChange,
  summary,
  onAddDailySale,
  onUpdate,
  onRemove,
  onFillRates,
  onUpdateLine,
  onRemoveLine,
  onGoInventory,
}: Props) {
  const latest = summary.latest
  const today = todayIsoDate()
  const monthName = formatMonthLong(monthReal.monthLabel)
  const monthLines = useMemo(
    () => listMonthSaleLines(summary.sorted),
    [summary.sorted],
  )
  const dayGroups = useMemo(() => groupMonthSaleLines(monthLines), [monthLines])

  const [dailyDate, setDailyDate] = useState(today)
  const [dailyProductId, setDailyProductId] = useState(products[0]?.id ?? '')
  const [dailyQty, setDailyQty] = useState(1)
  const [dailyPrice, setDailyPrice] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [iprOpen, setIprOpen] = useState(false)

  const suggestedBs = useMemo(() => {
    const product = products.find((p) => p.id === dailyProductId)
    if (!product) return 0
    return computeProductRow(product, rates, quoteCtx).ppubBs
  }, [products, dailyProductId, rates, quoteCtx])

  useEffect(() => {
    if (!dailyProductId && products[0]) setDailyProductId(products[0].id)
  }, [products, dailyProductId])

  useEffect(() => {
    if (suggestedBs > 0) {
      setDailyPrice(String(Math.round(suggestedBs * 100) / 100))
    }
  }, [dailyProductId, suggestedBs])

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 2800)
    return () => window.clearTimeout(t)
  }, [flash])

  const monthProfit = monthProfitStatus(monthReal.utilMes, monthReal.hasSales)
  const selectedProduct = products.find((p) => p.id === dailyProductId)
  const productName = selectedProduct?.desc ?? 'Producto'
  const stock = availableStock(selectedProduct?.cant ?? 0)
  const canSell = stock >= 1

  useEffect(() => {
    if (stock <= 0) return
    setDailyQty((n) => Math.min(Math.max(1, n), stock))
  }, [stock, dailyProductId])

  function handleDailySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dailyProductId || !canSell) return
    const qty = Math.min(Math.max(1, dailyQty), stock)
    const unitPriceBs = parseFloat(dailyPrice) || suggestedBs
    const ok = onAddDailySale({
      date: dailyDate,
      productId: dailyProductId,
      qty,
      unitPriceBs,
    })
    if (!ok) return
    setFlash(`${productName} × ${qty} — ${fbs(qty * unitPriceBs)}`)
    setDailyQty(1)
  }

  function confirmRemoveWeek(id: string) {
    const ok = window.confirm(
      'Esto borra la semana y todas sus ventas. ¿Continuar?',
    )
    if (ok) onRemove(id)
  }

  const iprPhrase = !latest
    ? 'Cuando registres ventas, al cierre de semana actualiza la tasa para ver si el dólar te aprieta.'
    : latest.ipr != null && latest.ipr > 0
      ? `Esta semana el dólar/euro subió ${latest.ipr.toFixed(1)}%. Revisa precios si te aprieta el margen.`
      : latest.ipr != null
        ? `Esta semana la tasa no subió (${latest.ipr.toFixed(1)}%).`
        : 'Carga las tasas de inicio y cierre de semana para ver la presión del dólar.'

  return (
    <section className="panel-card weekly-sales">
      <div className="card daily-sale-card">
        <div className="card-ttl">¿Qué vendiste hoy?</div>
        {products.length === 0 ? (
          <div className="weekly-alert">
            Primero agrega productos en Inventario.
            <button type="button" className="add-btn" onClick={onGoInventory}>
              Ir a Inventario
            </button>
          </div>
        ) : (
          <form className="daily-sale-form friendly" onSubmit={handleDailySubmit}>
            <div className="daily-date-row">
              <button
                type="button"
                className={`date-chip${dailyDate === today ? ' active' : ''}`}
                onClick={() => setDailyDate(today)}
              >
                Hoy
              </button>
              <label>
                <span className="kpi-lbl">Otra fecha</span>
                <input
                  className="ei"
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  required
                />
              </label>
            </div>
            <label className="daily-product">
              <span className="kpi-lbl">Producto</span>
              <select
                className="ei"
                value={dailyProductId || products[0]?.id || ''}
                onChange={(e) => setDailyProductId(e.target.value)}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.desc} ({availableStock(p.cant)} en stock)
                  </option>
                ))}
              </select>
              <span className="field-hint">
                {canSell ? `Hay ${stock} en stock` : 'Sin stock'}
              </span>
            </label>
            <label>
              <span className="kpi-lbl">Cantidad</span>
              <div className="qty-stepper">
                <button
                  type="button"
                  className="rate-btn"
                  onClick={() => setDailyQty((n) => Math.max(1, n - 1))}
                  aria-label="Menos"
                  disabled={!canSell}
                >
                  −
                </button>
                <input
                  className="ei r"
                  type="number"
                  min={1}
                  max={stock || 1}
                  step={1}
                  value={canSell ? dailyQty : 0}
                  disabled={!canSell}
                  onChange={(e) =>
                    setDailyQty(
                      Math.min(stock, Math.max(1, parseInt(e.target.value, 10) || 1)),
                    )
                  }
                />
                <button
                  type="button"
                  className="rate-btn"
                  onClick={() => setDailyQty((n) => Math.min(stock, n + 1))}
                  aria-label="Más"
                  disabled={!canSell || dailyQty >= stock}
                >
                  +
                </button>
              </div>
            </label>
            <label>
              <span className="kpi-lbl">Precio cobrado (Bs)</span>
              <input
                className="ei r"
                type="number"
                min={0}
                step="0.01"
                value={dailyPrice}
                onChange={(e) => setDailyPrice(e.target.value)}
              />
              <span className="field-hint">
                Sugerido del catálogo: {suggestedBs > 0 ? fbs(suggestedBs) : '—'}
              </span>
            </label>
            <button type="submit" className="add-btn daily-submit" disabled={!canSell}>
              {canSell ? 'Registrar' : 'Sin stock'}
            </button>
            {flash ? <p className="daily-flash">{flash}</p> : null}
          </form>
        )}
      </div>

      <div className="card month-sales-card">
        <div className="card-ttl">Este mes</div>
        <div className="month-summary">
          <div>
            <span className="kpi-lbl">Vendiste</span>
            <strong>{monthReal.hasSales ? fbs(monthReal.salesBs) : '—'}</strong>
          </div>
          <div>
            <span className="kpi-lbl">Queda</span>
            <strong
              style={{
                color:
                  monthProfit.kind === 'ok'
                    ? 'var(--green)'
                    : monthProfit.kind === 'empty'
                      ? 'var(--txt3)'
                      : 'var(--red)',
              }}
            >
              {monthReal.hasSales ? fbs(monthReal.utilMes) : '—'}
            </strong>
          </div>
          <span className={`summary-badge ${monthProfit.kind}`}>{monthProfit.label}</span>
        </div>

        {dayGroups.length === 0 ? (
          <p className="weekly-empty-cell">
            Aún no cargaste ventas de {monthName}. Empieza con lo de hoy.
          </p>
        ) : (
          <ul className="sale-day-list">
            {dayGroups.map((group) => (
              <li key={group.date}>
                <div className="sale-day-lbl">{formatFriendlyDate(group.date)}</div>
                <ul className="sale-line-list">
                  {group.rows.map(({ weekId, line }) => {
                    const open = editingId === line.id
                    const total = lineRevenueBs(line)
                    const maxQty =
                      availableStock(
                        products.find((p) => p.id === line.productId)?.cant ?? 0,
                      ) + (line.qty || 0)
                    return (
                      <li key={line.id} className="sale-line">
                        <button
                          type="button"
                          className="sale-line-main"
                          onClick={() =>
                            setEditingId((prev) => (prev === line.id ? null : line.id))
                          }
                        >
                          <span className="sale-line-desc">{line.desc}</span>
                          <span className="sale-line-meta">
                            {line.qty} × {fbs(line.unitPriceBs)} = {fbs(total)}
                          </span>
                        </button>
                        {open ? (
                          <div className="sale-line-edit">
                            <label>
                              <span className="kpi-lbl">Día</span>
                              <input
                                className="ei"
                                type="date"
                                value={line.saleDate}
                                onChange={(e) =>
                                  onUpdateLine(weekId, line.id, {
                                    saleDate: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              <span className="kpi-lbl">Cant.</span>
                              <input
                                className="ei r"
                                type="number"
                                min={0}
                                max={maxQty}
                                step={1}
                                value={line.qty || ''}
                                onChange={(e) => {
                                  const next = parseFloat(e.target.value) || 0
                                  if (next > maxQty) return
                                  onUpdateLine(weekId, line.id, { qty: next })
                                }}
                              />
                            </label>
                            <label>
                              <span className="kpi-lbl">Precio Bs</span>
                              <input
                                className="ei r"
                                type="number"
                                min={0}
                                step="0.01"
                                value={line.unitPriceBs || ''}
                                onChange={(e) =>
                                  onUpdateLine(weekId, line.id, {
                                    unitPriceBs: parseFloat(e.target.value) || 0,
                                  })
                                }
                              />
                            </label>
                            <button
                              type="button"
                              className="del-btn"
                              onClick={() => onRemoveLine(weekId, line.id)}
                            >
                              Borrar
                            </button>
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card ipr-collapse-card">
        <button
          type="button"
          className="ipr-toggle"
          aria-expanded={iprOpen}
          onClick={() => setIprOpen((v) => !v)}
        >
          <span>
            <span className="card-ttl" style={{ margin: 0 }}>
              Presión del dólar {iprOpen ? '▾' : '▸'}
            </span>
            <span className="ipr-phrase">{iprPhrase}</span>
          </span>
        </button>
        {latest ? (
          <button
            type="button"
            className="add-btn ipr-close-btn"
            onClick={() => onFillRates(latest.row.id, 'end')}
          >
            Actualizar tasa de cierre
          </button>
        ) : null}

        {iprOpen ? (
          <div className="ipr-detail">
            <label className="ipr-threshold">
              <span className="kpi-lbl">Avisar si sube más de</span>
              <input
                className="ei r"
                type="number"
                min={1}
                step={0.5}
                value={iprAlertPct}
                onChange={(e) =>
                  onIprAlertChange(
                    Math.max(0.5, parseFloat(e.target.value) || DEFAULT_IPR_ALERT_PCT),
                  )
                }
              />
              <span>%</span>
            </label>
            <p className="field-hint">
              Tasas hoy: {rateLabel(rates.bcv)} Bs/$ · {rateLabel(rates.eur)} Bs/€
            </p>
            <div className="tbl-wrap">
              <table className="weekly-ipr-table">
                <thead>
                  <tr>
                    <th>Semana</th>
                    <th className="r">Ventas Bs</th>
                    <th className="r">USD ini</th>
                    <th className="r">USD fin</th>
                    <th className="r">EUR ini</th>
                    <th className="r">EUR fin</th>
                    <th className="r">IPR</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {summary.computed.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="weekly-empty-cell">
                        Aún no hay semanas. Se crean al registrar una venta.
                      </td>
                    </tr>
                  ) : (
                    summary.computed.map(({ row, ipr, alert, hasLines, lineCount }) => (
                      <tr key={row.id} className={alert ? 'row-alert' : undefined}>
                        <td>
                          <span className="week-range">
                            {formatWeekRange(row.weekStart, row.weekEnd)}
                          </span>
                          {lineCount > 0 ? (
                            <span className="sub-ref">{lineCount} venta(s)</span>
                          ) : null}
                        </td>
                        <td className="r">{hasLines ? fbs(row.salesBs) : '—'}</td>
                        <td>
                          <input
                            className="ei r"
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.rateUsdStart || ''}
                            onChange={(e) =>
                              onUpdate(row.id, {
                                rateUsdStart: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="ei r"
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.rateUsdEnd || ''}
                            onChange={(e) =>
                              onUpdate(row.id, {
                                rateUsdEnd: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="ei r"
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.rateEurStart || ''}
                            onChange={(e) =>
                              onUpdate(row.id, {
                                rateEurStart: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            className="ei r"
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.rateEurEnd || ''}
                            onChange={(e) =>
                              onUpdate(row.id, {
                                rateEurEnd: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </td>
                        <td
                          className="r"
                          style={{ fontWeight: 800, color: alert ? 'var(--red)' : undefined }}
                        >
                          {ipr !== null ? `${ipr.toFixed(1)}%` : '—'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="del-btn"
                            onClick={() => confirmRemoveWeek(row.id)}
                            aria-label="Eliminar semana"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
