import { useEffect, useState } from 'react'
import { CapitalExpenses } from './components/CapitalExpenses'
import { DebtsPanel } from './components/DebtsPanel'
import { BusinessPlant } from './components/BusinessPlant'
import { FinancialSummary } from './components/FinancialSummary'
import { GlobalOverview } from './components/GlobalOverview'
import { IncomeDistribution } from './components/IncomeDistribution'
import { ProductTable } from './components/ProductTable'
import { SummaryStrip } from './components/SummaryStrip'
import {
  getTabMeta,
  loadStoredTab,
  saveStoredTab,
  SidebarNav,
  type AppTab,
} from './components/TabNav'
import { TaxPanel } from './components/TaxPanel'
import { OnboardingWizard } from './components/OnboardingWizard'
import { GrowthPreview } from './components/GrowthPreview'
import { TopbarRates } from './components/TopbarRates'
import { WeeklySalesPanel } from './components/WeeklySalesPanel'
import { useCalculator } from './hooks/useCalculator'
import './styles/theme.css'

export default function App() {
  const calc = useCalculator()
  const [tab, setTab] = useState<AppTab>(() => loadStoredTab())
  const [navOpen, setNavOpen] = useState(false)
  const meta = getTabMeta(tab)

  useEffect(() => {
    saveStoredTab(tab)
  }, [tab])

  useEffect(() => {
    if (!navOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  if (!calc.profile.complete) {
    return (
      <OnboardingWizard
        initial={calc.profile}
        onComplete={(profile) => calc.completeOnboarding(profile)}
      />
    )
  }

  return (
    <div className={`app-shell${navOpen ? ' nav-open' : ''}`}>
      <div
        className="sidebar-backdrop"
        onClick={() => setNavOpen(false)}
        aria-hidden={!navOpen}
      />

      <aside className="sidebar" aria-label="Navegación principal">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="logo-box">LD</div>
            <div>
              <div className="logo-name">LEDEZMA</div>
              <div className="logo-sub">Emprendedor VE</div>
            </div>
          </div>
          <p className="sidebar-session">
            {calc.profile.name.trim() || 'Tu negocio'} · solo este dispositivo
          </p>
        </div>

        <div className="sidebar-body">
          <SidebarNav
            active={tab}
            onChange={setTab}
            onNavigate={() => setNavOpen(false)}
            onAddProduct={() => {
              setTab('productos')
              setNavOpen(false)
              calc.addProduct()
            }}
          />

          <BusinessPlant
            businessName={calc.profile.name}
            stage={calc.plantStage}
            leaves={calc.plantLeaves}
            quickLinks={calc.plantQuickLinks}
            onNavigate={(nextTab) => {
              setTab(nextTab)
              setNavOpen(false)
            }}
          />
        </div>

        <div className="sidebar-foot">
          <div className="sidebar-loc">
            <label>
              Estado
              <input
                className="loc-inp"
                value={calc.location.estado}
                onChange={(e) =>
                  calc.setLocation((prev) => ({ ...prev, estado: e.target.value }))
                }
              />
            </label>
            <label>
              Ciudad
              <input
                className="loc-inp"
                value={calc.location.ciudad}
                onChange={(e) =>
                  calc.setLocation((prev) => ({ ...prev, ciudad: e.target.value }))
                }
              />
            </label>
          </div>
          <p className="sidebar-disclaimer">
            Datos fiscales referenciales. Consulta a un contador certificado.
          </p>
        </div>
      </aside>

      <div className="shell-main">
        <TopbarRates
          rates={calc.rates}
          draftRates={calc.draftRates}
          lastUpdate={calc.lastUpdate}
          ratesSource={calc.ratesSource}
          bcvStatus={calc.bcvStatus}
          bcvError={calc.bcvError}
          onDraftChange={(patch) => calc.setDraftRates((prev) => ({ ...prev, ...patch }))}
          onApply={calc.applyRates}
          onRefreshBcv={() => void calc.refreshRatesFromBcv()}
          onResetScenario={calc.resetScenario}
          onMenuToggle={() => setNavOpen((o) => !o)}
        />

        <div className="shell-content">
          <header className="panel-head">
            <div>
              <h1>{meta.title}</h1>
              <p>{meta.subtitle}</p>
            </div>
          </header>

          <SummaryStrip
            financial={calc.financial}
            monthReal={calc.monthReal}
            rates={calc.rates}
            productCount={calc.products.length}
            pressurePct={calc.pressurePct}
            onGoSales={() => setTab('ventas')}
          />

          <div
            className="panel-body"
            role="region"
            id={`panel-${tab}`}
            aria-label={meta.title}
          >
            {tab === 'productos' && (
              <ProductTable
                products={calc.products}
                rates={calc.rates}
                quoteCtx={calc.quoteCtx}
                onAdd={calc.addProduct}
                onUpdate={calc.updateProduct}
                onRemove={calc.removeProduct}
              />
            )}

            {tab === 'ventas' && (
              <WeeklySalesPanel
                rates={calc.rates}
                products={calc.products}
                quoteCtx={calc.quoteCtx}
                iprAlertPct={calc.iprAlertPct}
                monthReal={calc.monthReal}
                onIprAlertChange={calc.setIprAlertPct}
                summary={calc.weeklySalesSummary}
                onAddDailySale={calc.addDailySaleLine}
                onUpdate={calc.updateWeeklySale}
                onRemove={calc.removeWeeklySale}
                onFillRates={calc.fillWeeklyRatesFromCurrent}
                onUpdateLine={calc.updateWeeklySaleLine}
                onRemoveLine={calc.removeWeeklySaleLine}
                onGoInventory={() => setTab('productos')}
              />
            )}

            {tab === 'crecimiento' && (
              <GrowthPreview activeStage={calc.plantStage} />
            )}

            {tab === 'finanzas' && (
              <div className="cards-grid">
                <FinancialSummary
                  financial={calc.financial}
                  global={calc.global}
                  rates={calc.rates}
                  reinvPct={calc.reinvPct}
                  onGoCapital={() => setTab('capital')}
                  onGoDeudas={() => setTab('deudas')}
                  onApplySobrevivir={() => calc.setDistMode('sobrevivir')}
                />
                <IncomeDistribution
                  dist={calc.dist}
                  distSum={calc.distSum}
                  venBs={calc.financial.venBs}
                  rates={calc.rates}
                  distMode={calc.distMode}
                  distManual={calc.distManual}
                  suggestion={calc.distSuggestion}
                  onChange={calc.setDistValue}
                  onModeChange={calc.setDistMode}
                  onRecalculate={() => calc.applySuggestedDist()}
                />
              </div>
            )}

            {tab === 'tributos' && (
              <div className="cards-grid-3">
                <TaxPanel
                  group="para"
                  title="Contribuciones Parafiscales (Nómina)"
                  items={calc.parafiscales}
                  rates={calc.rates}
                  taxes={calc.taxes}
                  salario={calc.salario}
                  salarioDivisa={calc.salarioDivisa}
                  salarioBs={calc.salarioBs}
                  onSalarioChange={calc.setSalario}
                  onSalarioDivisaChange={calc.setSalarioDivisa}
                  onTaxUpdate={calc.updateTax}
                />
                <TaxPanel
                  group="mun"
                  title={`Impuestos Municipales — ${calc.location.ciudad || 'tu ciudad'}`}
                  items={calc.municipales}
                  rates={calc.rates}
                  taxes={calc.taxes}
                  ingresosEUR={calc.ingresosMunEUR}
                  onIngresosEURChange={calc.setIngresosMunEUR}
                  onFillFromSales={calc.fillTaxBaseFromSales}
                  onTaxUpdate={calc.updateTax}
                />
                <TaxPanel
                  group="nac"
                  title="Impuestos Nacionales — SENIAT"
                  items={calc.nacionales}
                  rates={calc.rates}
                  taxes={calc.taxes}
                  ingresosEUR={calc.ingresosNacEUR}
                  onIngresosEURChange={calc.setIngresosNacEUR}
                  onFillFromSales={calc.fillTaxBaseFromSales}
                  onTaxUpdate={calc.updateTax}
                />
              </div>
            )}

            {tab === 'capital' && (
              <div className="cards-grid">
                <CapitalExpenses
                  kind="capital"
                  title="Capital Inicial"
                  items={calc.capitalItems}
                  total={calc.global.capTotal}
                  rates={calc.rates}
                  onUpdate={calc.updateMoneyItem}
                  onRemove={calc.removeMoneyItem}
                  onAdd={calc.addMoneyItem}
                />
                <CapitalExpenses
                  kind="gastos"
                  title="Gastos Fijos Mensuales"
                  items={calc.gastosItems}
                  total={calc.global.gasTotal}
                  rates={calc.rates}
                  onUpdate={calc.updateMoneyItem}
                  onRemove={calc.removeMoneyItem}
                  onAdd={calc.addMoneyItem}
                />
              </div>
            )}

            {tab === 'deudas' && (
              <DebtsPanel
                items={calc.debtItems}
                saldoTotal={calc.global.saldoDeudas}
                cuotaTotal={calc.global.cuotaDeudas}
                rates={calc.rates}
                onUpdate={calc.updateDebtItem}
                onRemove={calc.removeDebtItem}
                onAdd={calc.addDebtItem}
              />
            )}

            {tab === 'resultado' && (
              <>
                <GlobalOverview
                  financial={calc.financial}
                  global={calc.global}
                  monthReal={calc.monthReal}
                  rates={calc.rates}
                />
                <div className="result-actions">
                  <button
                    type="button"
                    className="add-btn"
                    onClick={() => setTab('productos')}
                  >
                    Editar productos
                  </button>
                  <button
                    type="button"
                    className="add-btn"
                    onClick={() => setTab('tributos')}
                  >
                    Revisar tributos
                  </button>
                </div>
              </>
            )}
          </div>

          <footer className="footer">
            Herramienta desarrollada por <strong>Ledezma Digital Agency</strong> —{' '}
            {calc.location.ciudad || 'tu ciudad'}, {calc.location.estado || 'tu estado'} —
            Venezuela. Datos referenciales.
          </footer>
        </div>
      </div>
    </div>
  )
}
