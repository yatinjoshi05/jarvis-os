import { useState } from 'react'
import { 
  TrendingUp, Percent, Award, Shield, Target, Plus, 
  Trash2, AlertTriangle, ChevronDown, ChevronUp, FileText, Activity
} from 'lucide-react'
import { financialManager } from '../../../entities/financial/FinancialManager'
import { FinancialCalculators } from '../../../entities/financial/calculators'
import { FinancialRecommendations } from '../../../entities/financial/recommendations'
import { financialDocumentsModule } from '../../../entities/financial/documents'
import { TradingDashboardPanel } from '../../trading/ui/TradingDashboardPanel'

export default function FinancialWorkspace() {
  const userId = 'usr_guest'

  // Tab State: Default to live trading dashboard
  const [activeTab, setActiveTab] = useState<'planner' | 'trading'>('trading')

  // Dashboard state loaded from FinancialManager
  const [profile, setProfile] = useState(() => financialManager.getProfile(userId))
  const [portfolio, setPortfolio] = useState(() => financialManager.getPortfolio(userId))
  const [insurance, setInsurance] = useState(() => financialManager.getInsurancePolicies(userId))
  const [investments, setInvestments] = useState(() => financialManager.getInvestments(userId))
  const [documents, setDocuments] = useState(() => financialManager.getDocuments(userId))
  
  // Interactive goals state
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState(50000)
  const [goalTenure, setGoalTenure] = useState(5)
  const [goalCurrent, setGoalCurrent] = useState(5000)

  // SIP Calculator inputs
  const [sipMonthly, setSipMonthly] = useState(500)
  const [sipRate, setSipRate] = useState(12)
  const [sipTenure, setSipTenure] = useState(10)

  // Risk Profiler Questionnaire answers
  const [riskAnswers, setRiskAnswers] = useState<Record<string, number>>({})
  const [riskProfileResult, setRiskProfileResult] = useState<any>(null)

  // Document Upload OCR simulation states
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState<'statement' | 'policy'>('statement')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [aiAuditReport, setAiAuditReport] = useState('')

  // UI state
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false)

  // Sync state helpers
  const refreshFinancialState = () => {
    setProfile(financialManager.getProfile(userId))
    setPortfolio(financialManager.getPortfolio(userId))
    setInsurance(financialManager.getInsurancePolicies(userId))
    setInvestments(financialManager.getInvestments(userId))
    setDocuments(financialManager.getDocuments(userId))
  }

  // Add new Goal
  const handleAddGoal = () => {
    if (!goalName.trim()) return
    const targetDate = Date.now() + goalTenure * 365 * 24 * 3600 * 1000
    financialManager.addGoal(userId, {
      name: goalName,
      targetAmount: goalTarget,
      currentAmount: goalCurrent,
      targetDate,
      category: 'retirement'
    })
    setGoalName('')
    refreshFinancialState()
  }

  // Delete Goal
  const handleDeleteGoal = (goalId: string) => {
    financialManager.deleteGoal(userId, goalId)
    refreshFinancialState()
  }

  // Risk profiling submission
  const handleAssessRisk = () => {
    const answersList = Object.entries(riskAnswers).map(([qid, score]) => ({
      questionId: qid,
      score
    }))
    const answersScore = answersList.reduce((sum, item) => sum + item.score, 0)
    const profileScore = answersList.length > 0 ? (answersScore / (answersList.length * 5)) * 10 : 5
    
    const updatedProfile = {
      ...profile,
      riskScore: profileScore
    }
    financialManager.updateProfile(userId, updatedProfile)

    const riskProfile = FinancialRecommendations.assessRisk(updatedProfile)
    setRiskProfileResult(riskProfile)
    refreshFinancialState()
  }

  // OCR simulation upload
  const handleUploadDocument = async () => {
    if (!docName.trim()) return
    setOcrLoading(true)
    setAiAuditReport('')
    try {
      const doc = financialManager.uploadDocument(docName, docType, `https://sandbox/docs/${docName.toLowerCase().replace(/\s+/g, '_')}.pdf`, userId)
      const audit = await financialDocumentsModule.analyzeDocumentWithAI(doc.id)
      setAiAuditReport(audit)
      refreshFinancialState()
    } catch (e: any) {
      setAiAuditReport(`OCR audit failed: ${e.message}`)
    } finally {
      setOcrLoading(false)
      setDocName('')
    }
  }

  // Delete document log
  const handleDeleteDoc = (docId: string) => {
    financialManager.deleteDocument(docId, userId)
    refreshFinancialState()
  }

  // Math Calculations
  const calculatedSIPResult = Math.round(FinancialCalculators.calculateSIP(sipMonthly, sipRate, sipTenure))
  const calculatedSIPInvestment = sipMonthly * 12 * sipTenure
  const calculatedSIPGain = calculatedSIPResult - calculatedSIPInvestment

  const health = (() => {
    const monthlyIncome = profile.financialMetrics.annualIncome / 12
    const savings = monthlyIncome - profile.financialMetrics.monthlyExpenses
    const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) : 0
    const savingsScore = Math.min(100, Math.max(0, (savingsRate / 0.35) * 100))

    const debtRatio = profile.financialMetrics.annualIncome > 0 ? (profile.financialMetrics.totalLiabilities / profile.financialMetrics.annualIncome) : 0
    const debtScore = Math.max(0, 100 - (debtRatio > 0.4 ? ((debtRatio - 0.4) / 0.5) * 100 : 0))

    const goalsList = profile.goals || []
    let goalScore = 100
    if (goalsList.length > 0) {
      const avgPct = goalsList.reduce((sum, g) => sum + (g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) : 1), 0) / goalsList.length
      goalScore = Math.min(100, avgPct * 100)
    }

    const termNeed = 10 * profile.financialMetrics.annualIncome + profile.financialMetrics.totalLiabilities
    const activeCover = insurance.reduce((sum, ins) => sum + ins.sumAssured, 0)
    const insuranceScore = termNeed > 0 ? Math.min(100, (activeCover / termNeed) * 100) : 100

    const totalScore = Math.round(
      (savingsScore * 0.25) +
      (debtScore * 0.25) +
      (goalScore * 0.25) +
      (insuranceScore * 0.25)
    )

    return {
      score: totalScore,
      breakdown: {
        savingsRate: `${Math.round(savingsRate * 100)}% (Target: 35%)`,
        debtToIncome: `${Math.round(debtRatio * 100)}% (Target: <40%)`,
        goalProgress: `${Math.round(goalScore)}% average progress`,
        insuranceAdequacy: `${Math.round(insuranceScore)}% (Need: $${termNeed.toLocaleString()})`
      }
    }
  })()

  const recommendations = FinancialRecommendations.generate(profile, portfolio, investments, insurance)

  return (
    <div className="w-full h-full min-h-0 flex-1 flex flex-col font-mono text-white p-1 select-none overflow-hidden">
      {/* Navigation Tab Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 flex-shrink-0 px-1">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('trading')}
            className={`px-3 py-1.5 rounded-lg border text-[9px] font-black tracking-widest transition-all uppercase flex items-center space-x-1.5 ${
              activeTab === 'trading'
                ? 'bg-[#00FFCC]/15 border-[#00FFCC]/40 text-[#00FFCC] shadow-[0_0_12px_rgba(0,255,204,0.1)]'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <Activity size={11} />
            <span>LIVE TRADING DASHBOARD</span>
          </button>

          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3 py-1.5 rounded-lg border text-[9px] font-black tracking-widest transition-all uppercase flex items-center space-x-1.5 ${
              activeTab === 'planner'
                ? 'bg-[#FF0055]/15 border-[#FF0055]/40 text-[#FF0055] shadow-[0_0_12px_rgba(255,0,85,0.1)]'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <TrendingUp size={11} />
            <span>WEALTH & FINANCIAL PLANNER</span>
          </button>
        </div>
      </div>

      {activeTab === 'trading' ? (
        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
          <TradingDashboardPanel />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-[25%_1fr_25%] gap-4 overflow-hidden min-h-0">
          
          {/* LEFT PANEL */}
          <div className="border border-white/10 rounded-xl bg-black/40 p-3.5 flex flex-col justify-between min-h-0">
            <div className="flex flex-col min-h-0 space-y-4">
              <div className="flex flex-col min-h-0">
                <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                  <TrendingUp size={13} className="text-[#FF0055]" />
                  <span className="text-[10px] font-black tracking-widest uppercase">PORTFOLIO TRACKER</span>
                </div>
                <div className="bg-black/35 border border-white/5 rounded-lg p-2.5 my-2.5 text-left">
                  <div className="text-[8px] text-white/40 tracking-wider">CASH BALANCE</div>
                  <div className="text-sm font-black text-[#00FFCC]">${portfolio.cashBalance.toLocaleString()}</div>
                </div>

                <div className="overflow-y-auto max-h-36 pr-1 space-y-1.5 hide-scrollbar">
                  {portfolio.holdings.map((hold) => {
                    const currentVal = hold.quantity * hold.currentPrice
                    const costVal = hold.quantity * hold.avgPrice
                    const returns = currentVal - costVal
                    return (
                      <div key={hold.symbol} className="border border-white/5 bg-black/25 rounded p-2 text-left text-[9px] flex justify-between items-center">
                        <div>
                          <div className="font-bold flex items-center space-x-1.5">
                            <span className="text-white">{hold.symbol}</span>
                            <span className="text-[7px] text-white/30 uppercase">{hold.assetClass}</span>
                          </div>
                          <div className="text-white/45 text-[8px] mt-0.5">{hold.quantity} units @ ${hold.avgPrice}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-white">${currentVal.toLocaleString()}</div>
                          <div className={`text-[8px] font-bold ${returns >= 0 ? 'text-[#00FFCC]' : 'text-[#FF0055]'}`}>
                            {returns >= 0 ? '+' : ''}{Math.round((returns / costVal) * 100)}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col min-h-0">
                <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                  <FileText size={13} className="text-[#00DFFF]" />
                  <span className="text-[10px] font-black tracking-widest uppercase">OCR STATEMENT AUDITOR</span>
                </div>

                <div className="space-y-2 mt-2.5 text-left">
                  <div className="flex items-center space-x-1.5">
                    <input 
                      type="text" 
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="Doc/Statement Name..."
                      className="flex-1 bg-black border border-white/10 rounded px-2 py-1 text-[9px] outline-none"
                    />
                    <select 
                      value={docType}
                      onChange={(e: any) => setDocType(e.target.value)}
                      className="bg-black border border-white/10 rounded px-1.5 py-1 text-[9px] text-white/80 outline-none"
                    >
                      <option value="statement">Stmt</option>
                      <option value="policy">Policy</option>
                    </select>
                    <button
                      onClick={handleUploadDocument}
                      disabled={ocrLoading || !docName.trim()}
                      className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-[#00DFFF]/10 hover:border-[#00DFFF]/30 rounded text-[9px] font-bold transition-all disabled:opacity-40"
                    >
                      AUDIT
                    </button>
                  </div>

                  <div className="overflow-y-auto max-h-24 space-y-1 hide-scrollbar pr-1">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex justify-between items-center text-[8px] border border-white/5 rounded px-2 py-1 bg-black/25">
                        <span className="truncate text-white/60">{doc.name} ({doc.type})</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[#00FFCC] uppercase font-bold">{doc.status}</span>
                          <button onClick={() => handleDeleteDoc(doc.id)} className="text-white/35 hover:text-[#FF0055] transition-all">
                            <Trash2 size={9} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-[#FF0055]/20 bg-[#FF0055]/5 rounded-lg p-2 text-left flex items-start space-x-1.5">
              <AlertTriangle size={11} className="text-[#FF0055] flex-shrink-0 mt-0.5" />
              <span className="text-[7px] leading-normal text-[#FF0055] font-black uppercase tracking-wider">
                AI-Generated Advice: For informational purposes only. Not licensed financial/insurance advice.
              </span>
            </div>
          </div>

          {/* CENTER PANEL */}
          <div className="flex flex-col gap-4 min-w-0 min-h-0">
            <div className="border border-white/10 rounded-xl bg-black/40 p-4 flex flex-col justify-between flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <span className="text-[8px] text-white/30 tracking-widest font-black uppercase">SYSTEM HEALTH TELEMETRY</span>
                  <h2 className="text-xs font-black text-white/95 mt-0.5">FINANCIAL HEALTH SCORE</h2>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-black text-[#00FFCC]">{health.score}</span>
                    <span className="text-[9px] text-white/30">/100</span>
                  </div>
                  <button 
                    onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                    className="p-1 rounded hover:bg-white/5 border border-white/5 transition-all text-white/60 hover:text-white"
                  >
                    {showScoreBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>

              {showScoreBreakdown && (
                <div className="grid grid-cols-4 gap-2 border-t border-white/5 mt-3 pt-3 text-left">
                  <div className="bg-black/35 rounded p-2 border border-white/5">
                    <div className="text-[7px] text-white/30 font-bold uppercase">Savings Rate</div>
                    <div className="text-[9px] font-black text-white mt-1">{health.breakdown.savingsRate}</div>
                  </div>
                  <div className="bg-black/35 rounded p-2 border border-white/5">
                    <div className="text-[7px] text-white/30 font-bold uppercase">Debt Ratio</div>
                    <div className="text-[9px] font-black text-white mt-1">{health.breakdown.debtToIncome}</div>
                  </div>
                  <div className="bg-black/35 rounded p-2 border border-white/5">
                    <div className="text-[7px] text-white/30 font-bold uppercase">Goal Progress</div>
                    <div className="text-[9px] font-black text-white mt-1">{health.breakdown.goalProgress}</div>
                  </div>
                  <div className="bg-black/35 rounded p-2 border border-white/5">
                    <div className="text-[7px] text-white/30 font-bold uppercase">Ins Cover</div>
                    <div className="text-[9px] font-black text-white mt-1">{health.breakdown.insuranceAdequacy}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 border border-white/10 rounded-xl bg-black/40 p-4 flex flex-col justify-between min-h-0">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <Target size={12} className="text-[#FF0055]" />
                  <span className="text-[10px] font-black tracking-widest uppercase">FINANCIAL GOAL PLANNER</span>
                </div>
                <span className="text-[8px] text-white/30 font-bold tracking-widest">ACTIVE TARGETS</span>
              </div>

              <div className="flex items-center space-x-2 my-2.5 flex-shrink-0 text-left">
                <div className="flex-1 grid grid-cols-4 gap-1.5">
                  <input 
                    type="text" 
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder="Goal (e.g. Retirement)..."
                    className="bg-black border border-white/10 rounded px-2 py-1 text-[9px] outline-none"
                  />
                  <input 
                    type="number" 
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(Number(e.target.value))}
                    placeholder="Target Amount..."
                    className="bg-black border border-white/10 rounded px-2 py-1 text-[9px] outline-none"
                  />
                  <input 
                    type="number" 
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(Number(e.target.value))}
                    placeholder="Current Amount..."
                    className="bg-black border border-white/10 rounded px-2 py-1 text-[9px] outline-none"
                  />
                  <input 
                    type="number" 
                    value={goalTenure}
                    onChange={(e) => setGoalTenure(Number(e.target.value))}
                    placeholder="Tenure (Years)..."
                    className="bg-black border border-white/10 rounded px-2 py-1 text-[9px] outline-none"
                  />
                </div>
                <button
                  onClick={handleAddGoal}
                  className="px-3.5 py-1 bg-[#FF0055] text-[#FFFFFF] rounded text-[9px] font-bold hover:bg-[#FF3377] transition-all flex items-center space-x-1"
                >
                  <Plus size={10} />
                  <span>ADD</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2 hide-scrollbar min-h-0 my-1">
                {profile.goals.map((g) => {
                  const progressPct = Math.round(g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 100)
                  return (
                    <div key={g.id} className="border border-white/5 bg-black/25 rounded-lg p-3 text-left text-[9px] space-y-1.5">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-white">{g.name}</span>
                        <button onClick={() => handleDeleteGoal(g.id)} className="text-white/35 hover:text-[#FF0055] transition-all">
                          <Trash2 size={9} />
                        </button>
                      </div>
                      <div className="flex justify-between text-[8px] text-white/50">
                        <span>Saved: ${g.currentAmount.toLocaleString()}</span>
                        <span>Target: ${g.targetAmount.toLocaleString()}</span>
                      </div>
                      <div className="relative w-full h-1.5 bg-white/5 rounded overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-[#FF0055]" style={{ width: `${progressPct}%` }} />
                      </div>
                      <div className="text-[7px] text-white/35 uppercase text-right">{progressPct}% completed</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="h-44 border border-white/10 rounded-xl bg-black/40 p-4 flex flex-col justify-between flex-shrink-0">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <Percent size={12} className="text-[#FF0055]" />
                  <span className="text-[10px] font-black tracking-widest uppercase">SIP CALCULATOR</span>
                </div>
                <span className="text-[8px] text-white/30 font-bold tracking-widest">COMPOUND CALCULATIONS</span>
              </div>

              <div className="flex-1 my-2.5 grid grid-cols-2 gap-4 items-center text-left">
                <div className="space-y-2">
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[7px] text-white/40 font-bold">Monthly Investment (${sipMonthly})</span>
                    <input 
                      type="range" 
                      min="50" 
                      max="5000" 
                      step="50"
                      value={sipMonthly}
                      onChange={(e) => setSipMonthly(Number(e.target.value))}
                      className="w-full accent-[#FF0055]"
                    />
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[7px] text-white/40 font-bold">Expected Return Rate ({sipRate}%)</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="25" 
                      step="0.5"
                      value={sipRate}
                      onChange={(e) => setSipRate(Number(e.target.value))}
                      className="w-full accent-[#FF0055]"
                    />
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[7px] text-white/40 font-bold">Tenure ({sipTenure} Years)</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="40"
                      value={sipTenure}
                      onChange={(e) => setSipTenure(Number(e.target.value))}
                      className="w-full accent-[#FF0055]"
                    />
                  </div>
                </div>

                <div className="bg-black/35 border border-white/5 rounded-lg p-3 space-y-2.5 h-full flex flex-col justify-center">
                  <div>
                    <span className="text-[7px] text-white/35 font-bold tracking-wider">PROJECTED WEALTH</span>
                    <div className="text-base font-black text-[#00FFCC]">${calculatedSIPResult.toLocaleString()}</div>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-2 text-[8px] text-white/45">
                    <span>Invested: ${calculatedSIPInvestment.toLocaleString()}</span>
                    <span>Gain: ${calculatedSIPGain.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL */}
          <div className="border border-white/10 rounded-xl bg-black/40 p-3.5 flex flex-col min-h-0 justify-between">
            <div className="flex flex-col min-h-0 space-y-3.5">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                <Award size={13} className="text-[#FF0055]" />
                <span className="text-[10px] font-black tracking-widest uppercase">RISK PROFILER</span>
              </div>

              <div className="space-y-2 text-left">
                <div className="text-[8px] text-white/35 font-bold tracking-wider">PORTFOLIO ALIGNMENT QUESTIONNAIRE</div>
                <div className="space-y-2.5 bg-black/25 border border-white/5 rounded p-2.5">
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[7px] text-white/40">1. Investment Experience Level</span>
                    <select 
                      onChange={(e) => setRiskAnswers(prev => ({ ...prev, experience: Number(e.target.value) }))}
                      className="bg-black border border-white/10 rounded px-1 py-0.5 text-[8px] text-white outline-none"
                    >
                      <option value="3">Beginner / Low Experience</option>
                      <option value="6">Intermediate / Basic Trade</option>
                      <option value="10">Advanced / Derivative Trade</option>
                    </select>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[7px] text-white/40">2. Drawdown Tolerance Limit</span>
                    <select 
                      onChange={(e) => setRiskAnswers(prev => ({ ...prev, drawdown: Number(e.target.value) }))}
                      className="bg-black border border-white/10 rounded px-1 py-0.5 text-[8px] text-white outline-none"
                    >
                      <option value="3">Less than 5% drawdown</option>
                      <option value="6">Between 5% and 20%</option>
                      <option value="10">Accept 20%+ drawdown</option>
                    </select>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-[7px] text-white/40">3. Investment Time Horizon</span>
                    <select 
                      onChange={(e) => setRiskAnswers(prev => ({ ...prev, horizon: Number(e.target.value) }))}
                      className="bg-black border border-white/10 rounded px-1 py-0.5 text-[8px] text-white outline-none"
                    >
                      <option value="3">Short Horizon (&lt; 2 Years)</option>
                      <option value="6">Medium Horizon (2 - 5 Years)</option>
                      <option value="10">Long Horizon (5+ Years)</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={handleAssessRisk}
                    className="w-full py-1 text-center text-[9px] bg-white/5 border border-white/10 hover:bg-[#FF0055]/10 hover:border-[#FF0055]/30 rounded font-bold transition-all text-white/80"
                  >
                    SUBMIT PROFILE
                  </button>
                </div>
                
                {riskProfileResult && (
                  <div className="bg-black/35 rounded border border-white/5 p-2 text-[8px] space-y-1 bg-[#00FFCC]/5 border-[#00FFCC]/10">
                    <div className="flex justify-between font-bold">
                      <span>Computed Horizon class:</span>
                      <span className="text-[#00FFCC] uppercase font-black">{riskProfileResult.category}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[7px] text-white/60 pt-1.5 border-t border-white/5">
                      <div>EQ: {riskProfileResult.suitability.equityAllocationPercent}%</div>
                      <div>DB: {riskProfileResult.suitability.debtAllocationPercent}%</div>
                      <div>GL: {riskProfileResult.suitability.goldAllocationPercent}%</div>
                      <div>CS: {riskProfileResult.suitability.cashAllocationPercent}%</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 space-y-3.5 mt-4">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                <Shield size={13} className="text-[#FF0055]" />
                <span className="text-[10px] font-black tracking-widest uppercase">ADVISOR ALERTS</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2 hide-scrollbar min-h-0 select-text text-left">
                {aiAuditReport && (
                  <div className="border border-[#00DFFF]/20 bg-[#00DFFF]/5 rounded-lg p-2.5 text-[8px] space-y-1 mb-2">
                    <span className="text-[#00DFFF] font-bold uppercase tracking-wider block">Document AI Analysis</span>
                    <pre className="text-white/70 whitespace-pre-wrap leading-relaxed font-mono">{aiAuditReport}</pre>
                  </div>
                )}

                {recommendations.map((rec) => (
                  <div key={rec.id} className="border border-white/5 bg-black/25 rounded-lg p-2.5 text-[9px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        rec.priority === 'high' ? 'bg-[#FF0055]/15 text-[#FF0055]' : rec.priority === 'medium' ? 'bg-orange-500/15 text-orange-400' : 'bg-white/10 text-white/55'
                      }`}>
                        {rec.priority}
                      </span>
                      <span className="text-white/30 text-[7px] font-bold uppercase">{rec.category}</span>
                    </div>
                    <div className="font-bold text-white/95">{rec.title}</div>
                    <p className="text-white/60 text-[8px] leading-relaxed font-mono">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
