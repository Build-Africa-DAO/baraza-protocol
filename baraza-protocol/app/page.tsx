"use client";
import { useState, useEffect } from "react"
import { Wallet, ChevronRight, ChevronLeft, Users, Vote, Coins, Shield, Smartphone, Upload, Check, X, Zap, Globe, ArrowRight, Menu, Bell, TrendingUp, FileText, Plus, ExternalLink } from "lucide-react"

const COLORS = {
  bg: "#070B12",
  card: "#0D1320",
  cardAlt: "#111827",
  border: "#1E2D42",
  green: "#14F195",
  amber: "#F7B731",
  red: "#FF5C5C",
  blue: "#5C9EFF",
  textPrimary: "#F0F4FF",
  textSecondary: "#7A8FA6",
  textMuted: "#4A5568",
}

const communityTypes = [
  { id: "taxi", label: "Taxi Cooperative", icon: "🚖", desc: "Drivers & riders co-govern routes and pricing" },
  { id: "beauty", label: "Beauty Collective", icon: "💅", desc: "Pool funds, open shared studios" },
  { id: "film", label: "Film DAO", icon: "🎬", desc: "Fund productions, share revenue" },
  { id: "savings", label: "Savings Circle", icon: "💰", desc: "Lend to SMEs, earn returns" },
  { id: "tech", label: "Tech Guild", icon: "💻", desc: "Pay contributors on-chain" },
  { id: "custom", label: "Custom", icon: "⚡", desc: "Build your own community" },
]

const paymentMethods = [
  { id: "mpesa", label: "M-Pesa", icon: "📱", active: true, desc: "Kenya" },
  { id: "momo", label: "MTN MoMo", icon: "📲", active: false, desc: "West Africa" },
  { id: "airtel", label: "Airtel Money", icon: "📡", active: false, desc: "Pan-Africa" },
  { id: "wapipay", label: "WapiPay", icon: "🔗", active: false, desc: "Crypto-native" },
  { id: "stripe", label: "Stripe", icon: "💳", active: false, desc: "Global" },
  { id: "bank", label: "Bank Transfer", icon: "🏦", active: false, desc: "Coming soon" },
]

const mockProposals = [
  { id: 1, title: "Open Westlands–CBD Night Route", status: "active", votes: { for: 31, against: 4 }, treasury: "KSh 45,000", deadline: "2 days" },
  { id: 2, title: "Driver Welfare Fund — Q2 2026", status: "passed", votes: { for: 28, against: 2 }, treasury: "KSh 20,000", deadline: "Closed" },
]

const mockMembers = [
  { role: "Driver", count: 47 },
  { role: "Rider", count: 203 },
  { role: "Operations", count: 6 },
]

// ─── FONT IMPORT ────────────────────────────────────────────────────────────
const fontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${COLORS.bg}; color: ${COLORS.textPrimary}; font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 4px; } 
  ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
  ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
  
  @keyframes pulse-green { 0%, 100% { box-shadow: 0 0 0 0 rgba(20,241,149,0.4); } 50% { box-shadow: 0 0 0 8px rgba(20,241,149,0); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  
  .fade-up { animation: fadeUp 0.4s ease forwards; }
  .pulse-green { animation: pulse-green 2s infinite; }
  .spin { animation: spin 1s linear infinite; }
  
  .btn-primary {
    background: ${COLORS.green};
    color: #000;
    border: none;
    padding: 14px 28px;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .btn-primary:hover { background: #0fd480; transform: translateY(-1px); }
  .btn-primary:disabled { background: ${COLORS.border}; color: ${COLORS.textMuted}; cursor: not-allowed; transform: none; }
  
  .btn-ghost {
    background: transparent;
    color: ${COLORS.textSecondary};
    border: 1px solid ${COLORS.border};
    padding: 14px 28px;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .btn-ghost:hover { border-color: ${COLORS.textSecondary}; color: ${COLORS.textPrimary}; }
  
  .input {
    background: ${COLORS.cardAlt};
    border: 1px solid ${COLORS.border};
    color: ${COLORS.textPrimary};
    padding: 14px 16px;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    width: 100%;
    outline: none;
    transition: border-color 0.2s;
  }
  .input:focus { border-color: ${COLORS.green}; }
  .input::placeholder { color: ${COLORS.textMuted}; }
  
  .card {
    background: ${COLORS.card};
    border: 1px solid ${COLORS.border};
    border-radius: 16px;
    padding: 24px;
  }
  
  .tag {
    background: rgba(20,241,149,0.1);
    color: ${COLORS.green};
    border: 1px solid rgba(20,241,149,0.2);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
`

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

const Label = ({ children, required }) => (
  <label style={{ display: "block", marginBottom: 8, color: COLORS.textSecondary, fontSize: 13, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
    {children} {required && <span style={{ color: COLORS.green }}>*</span>}
  </label>
)

const StepIndicator = ({ current, total }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: i < current ? 24 : 8,
          height: 8,
          borderRadius: 4,
          background: i < current ? COLORS.green : i === current - 1 ? COLORS.green : COLORS.border,
          transition: "all 0.3s",
          opacity: i < current ? 0.4 : 1,
        }} />
      </div>
    ))}
    <span style={{ color: COLORS.textMuted, fontSize: 13, marginLeft: 8 }}>{current}/{total}</span>
  </div>
)

const NavBar = ({ wallet, onConnect, screen, onDashboard, onHome }) => (
  <div style={{
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    background: "rgba(7,11,18,0.85)", backdropFilter: "blur(20px)",
    borderBottom: `1px solid ${COLORS.border}`,
    padding: "0 24px", height: 64,
    display: "flex", alignItems: "center", justifyContent: "space-between"
  }}>
    <button onClick={onHome} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 16 }}>🏛️</span>
      </div>
      <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>Baraza</span>
    </button>

    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {screen === "dashboard" && (
        <button onClick={onHome} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }}>
          + New Community
        </button>
      )}
      {wallet ? (
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.green}`,
          borderRadius: 10, padding: "8px 16px",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green }} className="pulse-green" />
          <span style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: 500 }}>
            {wallet.slice(0, 4)}...{wallet.slice(-4)}
          </span>
        </div>
      ) : (
        <button className="btn-primary" onClick={onConnect} style={{ padding: "10px 20px", fontSize: 14 }}>
          <Wallet size={16} /> Connect Wallet
        </button>
      )}
    </div>
  </div>
)

// ─── SCREENS ────────────────────────────────────────────────────────────────

const Landing = ({ onConnect, wallet, onStart }) => (
  <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px 40px", position: "relative", overflow: "hidden" }}>

    {/* Background */}
    <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(20,241,149,0.06) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(247,183,49,0.04) 0%, transparent 70%)` }} />

    {/* Grid pattern */}
    <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${COLORS.border} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border} 1px, transparent 1px)`, backgroundSize: "60px 60px", opacity: 0.3 }} />

    <div style={{ position: "relative", textAlign: "center", maxWidth: 640 }} className="fade-up">
      <div className="tag" style={{ display: "inline-block", marginBottom: 24 }}>African Community Infrastructure · Solana</div>

      <h1 style={{
        fontFamily: "'Unbounded', sans-serif",
        fontSize: "clamp(36px, 8vw, 64px)",
        fontWeight: 900,
        lineHeight: 1.05,
        marginBottom: 24,
        background: `linear-gradient(135deg, ${COLORS.textPrimary} 0%, ${COLORS.green} 100%)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>
        Own what you build together.
      </h1>

      <p style={{ color: COLORS.textSecondary, fontSize: 18, lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: "0 auto 40px" }}>
        Launch a DAO, host on-chain events, govern your treasury — from any phone, in any African city. M-Pesa accepted.
      </p>

      <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        {wallet ? (
          <button className="btn-primary" onClick={onStart} style={{ fontSize: 16, padding: "16px 32px" }}>
            Launch Your Community <ArrowRight size={18} />
          </button>
        ) : (
          <button className="btn-primary" onClick={onConnect} style={{ fontSize: 16, padding: "16px 32px" }}>
            <Wallet size={18} /> Connect Wallet to Start
          </button>
        )}
        <button className="btn-ghost" onClick={onStart} style={{ fontSize: 16, padding: "16px 32px" }}>
          View Demo <ExternalLink size={16} />
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 64, textAlign: "left" }}>
        {[
          { label: "Mobile Money Users", value: "800M+", sub: "Across Africa" },
          { label: "First Deployment", value: "May 22", sub: "Global Pizza Party 6" },
          { label: "Target Attendees", value: "500+", sub: "Nairobi, Kenya" },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 22, fontWeight: 700, color: COLORS.green, marginBottom: 4 }}>{stat.value}</div>
            <div style={{ color: COLORS.textSecondary, fontSize: 12 }}>{stat.label}</div>
            <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 2 }}>{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const Step1 = ({ data, onChange, onNext }) => {
  const [selected, setSelected] = useState(data.type || "")

  return (
    <div className="fade-up">
      <div className="tag" style={{ marginBottom: 16 }}>Step 1</div>
      <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Community Setup</h2>
      <p style={{ color: COLORS.textSecondary, marginBottom: 32 }}>Tell us about your community.</p>

      <div style={{ marginBottom: 20 }}>
        <Label required>Community Name</Label>
        <input className="input" placeholder="e.g. Nairobi Riders DAO" value={data.name || ""} onChange={e => onChange("name", e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <Label required>Token Symbol</Label>
          <input className="input" placeholder="e.g. RIDE" value={data.symbol || ""} onChange={e => onChange("symbol", e.target.value.toUpperCase())} />
        </div>
        <div>
          <Label>Website</Label>
          <input className="input" placeholder="https://" value={data.website || ""} onChange={e => onChange("website", e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Label required>Community Type</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {communityTypes.map(type => (
            <button key={type.id} onClick={() => { setSelected(type.id); onChange("type", type.id) }} style={{
              background: selected === type.id ? "rgba(20,241,149,0.08)" : COLORS.cardAlt,
              border: `1px solid ${selected === type.id ? COLORS.green : COLORS.border}`,
              borderRadius: 12, padding: "14px 16px", cursor: "pointer",
              display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 20 }}>{type.icon}</span>
              <div>
                <div style={{ color: selected === type.id ? COLORS.green : COLORS.textPrimary, fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{type.label}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 11, lineHeight: 1.4 }}>{type.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <Label>Description</Label>
        <textarea className="input" placeholder="What does your community stand for?" rows={3} value={data.description || ""} onChange={e => onChange("description", e.target.value)} style={{ resize: "none" }} />
      </div>

      <button className="btn-primary" onClick={onNext} disabled={!data.name || !data.symbol || !selected} style={{ width: "100%" }}>
        Continue <ChevronRight size={18} />
      </button>
    </div>
  )
}

const Step2 = ({ data, onChange, onNext, onBack }) => (
  <div className="fade-up">
    <div className="tag" style={{ marginBottom: 16 }}>Step 2</div>
    <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Membership Settings</h2>
    <p style={{ color: COLORS.textSecondary, marginBottom: 32 }}>How do members join your community?</p>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
      <div>
        <Label required>Membership Price (SOL)</Label>
        <input className="input" type="number" placeholder="0.1" value={data.price || ""} onChange={e => onChange("price", e.target.value)} />
        {data.price && <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 6 }}>≈ KSh {Math.round(data.price * 19500).toLocaleString()}</div>}
      </div>
      <div>
        <Label>Auction Duration</Label>
        <select className="input" value={data.duration || "1"} onChange={e => onChange("duration", e.target.value)} style={{ appearance: "none" }}>
          <option value="1">1 Day</option>
          <option value="3">3 Days</option>
          <option value="7">7 Days</option>
          <option value="0">Fixed Price</option>
        </select>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
      <div>
        <Label>Proposal Threshold</Label>
        <input className="input" type="number" placeholder="0.5" value={data.threshold || ""} onChange={e => onChange("threshold", e.target.value)} />
        <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 6 }}>% of votes needed to propose</div>
      </div>
      <div>
        <Label>Quorum Threshold</Label>
        <input className="input" type="number" placeholder="10" value={data.quorum || ""} onChange={e => onChange("quorum", e.target.value)} />
        <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 6 }}>% of votes needed to pass</div>
      </div>
    </div>

    <div style={{ display: "flex", gap: 12 }}>
      <button className="btn-ghost" onClick={onBack} style={{ flex: 1 }}><ChevronLeft size={18} /> Back</button>
      <button className="btn-primary" onClick={onNext} style={{ flex: 2 }}>Continue <ChevronRight size={18} /></button>
    </div>
  </div>
)

const Step3 = ({ data, onChange, onNext, onBack }) => (
  <div className="fade-up">
    <div className="tag" style={{ marginBottom: 16 }}>Step 3</div>
    <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Veto Power</h2>
    <p style={{ color: COLORS.textSecondary, marginBottom: 12 }}>
      Veto power protects your community in the early days. As membership grows, you can remove it through a governance vote.
    </p>
    <div className="card" style={{ marginBottom: 32, borderColor: "rgba(247,183,49,0.2)", background: "rgba(247,183,49,0.04)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Shield size={20} color={COLORS.amber} style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.6 }}>
          Recommended for new communities with fewer than 50 members. You can veto malicious proposals while your community establishes trust.
        </p>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
      {[{ val: "yes", label: "Yes", desc: "I want veto power", icon: "🛡️" }, { val: "no", label: "No", desc: "Full decentralization", icon: "🌐" }].map(opt => (
        <button key={opt.val} onClick={() => onChange("veto", opt.val)} style={{
          background: data.veto === opt.val ? "rgba(20,241,149,0.08)" : COLORS.cardAlt,
          border: `1px solid ${data.veto === opt.val ? COLORS.green : COLORS.border}`,
          borderRadius: 16, padding: "24px 20px", cursor: "pointer", textAlign: "center", transition: "all 0.2s",
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.icon}</div>
          <div style={{ fontFamily: "'Unbounded', sans-serif", color: data.veto === opt.val ? COLORS.green : COLORS.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{opt.label}</div>
          <div style={{ color: COLORS.textMuted, fontSize: 13 }}>{opt.desc}</div>
        </button>
      ))}
    </div>

    <div style={{ display: "flex", gap: 12 }}>
      <button className="btn-ghost" onClick={onBack} style={{ flex: 1 }}><ChevronLeft size={18} /> Back</button>
      <button className="btn-primary" onClick={onNext} disabled={!data.veto} style={{ flex: 2 }}>Continue <ChevronRight size={18} /></button>
    </div>
  </div>
)

const Step4 = ({ data, onChange, onNext, onBack }) => {
  const [active, setActive] = useState(data.payments || ["mpesa"])
  const toggle = (id) => {
    if (id === "mpesa") return
    const next = active.includes(id) ? active.filter(x => x !== id) : [...active, id]
    setActive(next); onChange("payments", next)
  }

  return (
    <div className="fade-up">
      <div className="tag" style={{ marginBottom: 16 }}>Step 4</div>
      <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Payment Methods</h2>
      <p style={{ color: COLORS.textSecondary, marginBottom: 32 }}>How can members pay to join? M-Pesa is always active.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 32 }}>
        {paymentMethods.map(pm => (
          <button key={pm.id} onClick={() => toggle(pm.id)} style={{
            background: pm.id === "mpesa" || active.includes(pm.id) ? "rgba(20,241,149,0.06)" : COLORS.cardAlt,
            border: `1px solid ${pm.id === "mpesa" || active.includes(pm.id) ? COLORS.green : COLORS.border}`,
            borderRadius: 12, padding: "16px", cursor: pm.id === "mpesa" ? "default" : "pointer",
            display: "flex", alignItems: "center", gap: 12, textAlign: "left", transition: "all 0.2s",
            opacity: !pm.active && pm.id !== "mpesa" ? 0.6 : 1,
          }}>
            <span style={{ fontSize: 22 }}>{pm.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 14 }}>{pm.label}</span>
                {!pm.active && pm.id !== "mpesa" && <span style={{ fontSize: 10, color: COLORS.textMuted, background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, padding: "1px 6px", borderRadius: 4 }}>Soon</span>}
              </div>
              <div style={{ color: COLORS.textMuted, fontSize: 12 }}>{pm.desc}</div>
            </div>
            {(pm.id === "mpesa" || active.includes(pm.id)) && <Check size={16} color={COLORS.green} />}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 32, borderColor: "rgba(20,241,149,0.15)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Smartphone size={18} color={COLORS.green} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 14, marginBottom: 4 }}>M-Pesa Bridge via LI.FI</div>
            <div style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
              Member sends KSh → Africa's Talking confirms → Yellow Card converts to USDC → LI.FI routes to Solana → Privy creates invisible wallet → NFT ticket sent by SMS.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn-ghost" onClick={onBack} style={{ flex: 1 }}><ChevronLeft size={18} /> Back</button>
        <button className="btn-primary" onClick={onNext} style={{ flex: 2 }}>Continue <ChevronRight size={18} /></button>
      </div>
    </div>
  )
}

const Step5 = ({ data, onChange, onNext, onBack }) => {
  const traits = ["0 — Backgrounds", "1 — Bodies", "2 — Accessories", "3 — Heads", "4 — Glasses"]
  const [uploaded, setUploaded] = useState(false)

  return (
    <div className="fade-up">
      <div className="tag" style={{ marginBottom: 16 }}>Step 5</div>
      <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Membership NFT</h2>
      <p style={{ color: COLORS.textSecondary, marginBottom: 32 }}>Upload your NFT trait folder. Each member gets a unique generated NFT.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <Label>Trait Layers</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {traits.map((t, i) => (
              <div key={i} style={{
                background: uploaded ? "rgba(20,241,149,0.06)" : COLORS.cardAlt,
                border: `1px solid ${uploaded ? COLORS.green : COLORS.border}`,
                borderRadius: 8, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                {uploaded ? <Check size={14} color={COLORS.green} /> : <div style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${COLORS.border}` }} />}
                <span style={{ color: uploaded ? COLORS.textPrimary : COLORS.textSecondary, fontSize: 13 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>NFT Preview</Label>
          <div style={{
            background: COLORS.cardAlt, border: `2px dashed ${uploaded ? COLORS.green : COLORS.border}`,
            borderRadius: 16, aspectRatio: "1", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
            transition: "all 0.2s",
          }} onClick={() => { setUploaded(true); onChange("artwork", true) }}>
            {uploaded ? (
              <>
                <div style={{ fontSize: 48 }}>🦁</div>
                <div style={{ color: COLORS.green, fontSize: 12, fontWeight: 600 }}>NFT #001 Preview</div>
                <div style={{ color: COLORS.textMuted, fontSize: 11 }}>Tap to regenerate</div>
              </>
            ) : (
              <>
                <Upload size={24} color={COLORS.textMuted} />
                <div style={{ color: COLORS.textSecondary, fontSize: 13, textAlign: "center" }}>Upload trait folder<br />PNG or SVG</div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn-ghost" onClick={onBack} style={{ flex: 1 }}><ChevronLeft size={18} /> Back</button>
        <button className="btn-primary" onClick={onNext} style={{ flex: 2 }}>Continue <ChevronRight size={18} /></button>
      </div>
    </div>
  )
}

const Step6 = ({ data, onDeploy, onBack, deploying, deployed }) => (
  <div className="fade-up">
    <div className="tag" style={{ marginBottom: 16 }}>Step 6</div>
    <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Launch Community</h2>
    <p style={{ color: COLORS.textSecondary, marginBottom: 32 }}>Review and deploy your community to Solana.</p>

    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          { label: "Community", value: data.name || "—" },
          { label: "Token", value: data.symbol ? `$${data.symbol}` : "—" },
          { label: "Type", value: communityTypes.find(t => t.id === data.type)?.label || "—" },
          { label: "Membership", value: data.price ? `${data.price} SOL` : "—" },
          { label: "Veto Power", value: data.veto === "yes" ? "Enabled" : "Disabled" },
          { label: "M-Pesa", value: "Active" },
        ].map((item, i) => (
          <div key={i}>
            <div style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</div>
            <div style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>

    {deployed ? (
      <div className="card" style={{ borderColor: COLORS.green, background: "rgba(20,241,149,0.05)", textAlign: "center", padding: 32, marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
        <div style={{ fontFamily: "'Unbounded', sans-serif", color: COLORS.green, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Community Launched!</div>
        <div style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 16 }}>Your DAO is live on Solana devnet</div>
        <div style={{
          background: COLORS.cardAlt, borderRadius: 8, padding: "10px 16px",
          fontFamily: "monospace", fontSize: 12, color: COLORS.textMuted,
          wordBreak: "break-all",
        }}>
          Tx: 3xK9m...7vQp2 ✓
        </div>
      </div>
    ) : (
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button className="btn-ghost" onClick={onBack} style={{ flex: 1 }} disabled={deploying}><ChevronLeft size={18} /> Back</button>
        <button className="btn-primary" onClick={onDeploy} style={{ flex: 2 }} disabled={deploying}>
          {deploying ? (
            <><div className="spin" style={{ width: 16, height: 16, border: "2px solid #000", borderTopColor: "transparent", borderRadius: "50%" }} /> Deploying to Solana...</>
          ) : (
            <><Zap size={16} /> Launch on Solana</>
          )}
        </button>
      </div>
    )}
  </div>
)

const Dashboard = ({ data, onVote, voted, onNewProposal }) => (
  <div style={{ paddingTop: 80, minHeight: "100vh" }}>
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div className="tag" style={{ marginBottom: 12 }}>Live on Solana Devnet</div>
          <h1 style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            {data.name || "Nairobi Riders DAO"}
          </h1>
          <div style={{ color: COLORS.textSecondary, fontSize: 14 }}>
            {communityTypes.find(t => t.id === data.type)?.label || "Taxi Cooperative"} · ${data.symbol || "RIDE"}
          </div>
        </div>
        <button className="btn-primary" onClick={onNewProposal} style={{ padding: "10px 20px", fontSize: 14, flexShrink: 0 }}>
          <Plus size={16} /> New Proposal
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Treasury", value: "KSh 120,000", sub: "≈ $930 USDC", icon: <Coins size={20} color={COLORS.green} /> },
          { label: "Members", value: "256", sub: "47 drivers · 203 riders", icon: <Users size={20} color={COLORS.blue} /> },
          { label: "Proposals", value: "2 active", sub: "12 total passed", icon: <Vote size={20} color={COLORS.amber} /> },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>{stat.icon}</div>
            <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 20, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>{stat.value}</div>
            <div style={{ color: COLORS.textMuted, fontSize: 11 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Active Proposal */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Active Proposals</div>

        {mockProposals.map(prop => (
          <div key={prop.id} className="card" style={{ marginBottom: 16, borderColor: prop.status === "active" ? "rgba(20,241,149,0.2)" : COLORS.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    background: prop.status === "active" ? "rgba(20,241,149,0.15)" : "rgba(255,255,255,0.06)",
                    color: prop.status === "active" ? COLORS.green : COLORS.textMuted,
                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase",
                  }}>
                    {prop.status === "active" ? "● Active" : "✓ Passed"}
                  </span>
                  <span style={{ color: COLORS.textMuted, fontSize: 12 }}>#{prop.id}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 16, color: COLORS.textPrimary }}>{prop.title}</div>
              </div>
              <div style={{ color: COLORS.textMuted, fontSize: 12, textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                <div>{prop.treasury}</div>
                <div style={{ color: prop.deadline === "Closed" ? COLORS.textMuted : COLORS.amber }}>{prop.deadline}</div>
              </div>
            </div>

            {/* Vote bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: COLORS.green, fontSize: 13, fontWeight: 600 }}>For: {prop.votes.for}</span>
                <span style={{ color: COLORS.red, fontSize: 13, fontWeight: 600 }}>Against: {prop.votes.against}</span>
              </div>
              <div style={{ height: 8, background: COLORS.cardAlt, borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  width: `${(prop.votes.for / (prop.votes.for + prop.votes.against)) * 100}%`,
                  background: `linear-gradient(90deg, ${COLORS.green}, #0fd480)`,
                  transition: "width 1s ease",
                }} />
              </div>
            </div>

            {prop.status === "active" && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => onVote(prop.id, "for")} disabled={voted[prop.id]} style={{
                  flex: 1, padding: "12px", borderRadius: 10, border: "none", cursor: voted[prop.id] ? "default" : "pointer",
                  background: voted[prop.id] === "for" ? COLORS.green : "rgba(20,241,149,0.1)",
                  color: voted[prop.id] === "for" ? "#000" : COLORS.green,
                  fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                }}>
                  {voted[prop.id] === "for" ? "✓ Voted For" : "👍 Vote For"}
                </button>
                <button onClick={() => onVote(prop.id, "against")} disabled={voted[prop.id]} style={{
                  flex: 1, padding: "12px", borderRadius: 10, border: "none", cursor: voted[prop.id] ? "default" : "pointer",
                  background: voted[prop.id] === "against" ? COLORS.red : "rgba(255,92,92,0.1)",
                  color: voted[prop.id] === "against" ? "#fff" : COLORS.red,
                  fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                }}>
                  {voted[prop.id] === "against" ? "✓ Voted Against" : "👎 Vote Against"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Members */}
      <div>
        <div style={{ color: COLORS.textSecondary, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Membership</div>
        <div className="card">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {mockMembers.map((m, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 24, fontWeight: 700, color: COLORS.textPrimary }}>{m.count}</div>
                <div style={{ color: COLORS.textMuted, fontSize: 12 }}>{m.role}s</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 20 }}>
            <div style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 12, fontWeight: 500 }}>Join via M-Pesa</div>
            <div style={{
              background: COLORS.cardAlt, borderRadius: 10, padding: 16,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ fontSize: 28 }}>📱</div>
              <div>
                <div style={{ color: COLORS.textPrimary, fontWeight: 600, marginBottom: 2 }}>Send KSh {data.price ? Math.round(data.price * 19500).toLocaleString() : "2,000"} to M-PESA</div>
                <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Till: BARAZA · Receive NFT membership by SMS</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function Baraza() {
  const [screen, setScreen] = useState("landing")
  const [step, setStep] = useState(1)
  const [wallet, setWallet] = useState(null)
  const [deploying, setDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [voted, setVoted] = useState({})
  const [formData, setFormData] = useState({})

  const onChange = (key, val) => setFormData(prev => ({ ...prev, [key]: val }))

  const connectWallet = () => {
    const mock = "Aziz" + Math.random().toString(36).slice(2, 6).toUpperCase() + "...7vQp"
    setWallet(mock)
  }

  const handleDeploy = () => {
    setDeploying(true)
    setTimeout(() => { setDeploying(false); setDeployed(true) }, 2800)
    setTimeout(() => setScreen("dashboard"), 5000)
  }

  const handleVote = (proposalId, side) => {
    setVoted(prev => ({ ...prev, [proposalId]: side }))
  }

  const TOTAL_STEPS = 6
  const steps = [Step1, Step2, Step3, Step4, Step5, Step6]
  const CurrentStep = steps[step - 1]

  return (
    <>
      <style>{fontStyle}</style>
      <NavBar
        wallet={wallet}
        onConnect={connectWallet}
        screen={screen}
        onDashboard={() => setScreen("dashboard")}
        onHome={() => { setScreen("landing"); setStep(1); setDeployed(false); setDeploying(false) }}
      />

      <div style={{ minHeight: "100vh", background: COLORS.bg }}>
        {screen === "landing" && (
          <Landing onConnect={connectWallet} wallet={wallet} onStart={() => { if (!wallet) connectWallet(); setScreen("wizard") }} />
        )}

        {screen === "wizard" && (
          <div style={{ paddingTop: 80, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 560, padding: "40px 24px" }}>
              <StepIndicator current={step} total={TOTAL_STEPS} />
              <CurrentStep
                data={formData}
                onChange={onChange}
                onNext={() => step < TOTAL_STEPS ? setStep(s => s + 1) : null}
                onBack={() => step > 1 ? setStep(s => s - 1) : setScreen("landing")}
                onDeploy={handleDeploy}
                deploying={deploying}
                deployed={deployed}
              />
              {deployed && step === TOTAL_STEPS && (
                <button className="btn-primary" onClick={() => setScreen("dashboard")} style={{ width: "100%", marginTop: 16 }}>
                  Go to Dashboard <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {screen === "dashboard" && (
          <Dashboard
            data={formData}
            onVote={handleVote}
            voted={voted}
            onNewProposal={() => {}}
          />
        )}
      </div>
    </>
  )
}
