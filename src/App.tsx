import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, BarChart3, Bell, Bookmark,
  Boxes, BriefcaseBusiness, CheckCircle2, ChevronDown, CircleHelp,
  Compass, FileSearch, Filter, Globe2, LayoutDashboard, Lightbulb,
  Menu, Plus, Search, Settings2, ShieldCheck, Sparkles, TrendingUp,
  X,
} from "lucide-react";

type Section = "Overview" | "Discover launches" | "Analyze a product" | "Competitors" | "Market gaps" | "Research reports" | "Watchlist";
const navigation: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Discover launches", icon: Compass },
  { label: "Analyze a product", icon: FileSearch },
  { label: "Competitors", icon: Boxes },
  { label: "Market gaps", icon: Lightbulb },
  { label: "Research reports", icon: BarChart3 },
  { label: "Watchlist", icon: Bookmark },
];

function App() {
  const [section, setSection] = useState<Section>("Overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState("Consumer technology");
  const [price, setPrice] = useState("");
  const [market, setMarket] = useState("India");
  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);

  const checklist = useMemo(() => [
    { title: "Product identity", detail: product ? product : "Product name and positioning", status: product.trim().length > 1 },
    { title: "Category & geography", detail: category + " · " + market, status: true },
    { title: "Price positioning", detail: price ? "User-provided price: ₹" + price : "Price not supplied", status: Boolean(price) },
    { title: "Primary source", detail: url || "Product URL not supplied", status: Boolean(url) },
    { title: "Competitor evidence", detail: "Requires verified competitor sources", status: false },
    { title: "Demand & customer evidence", detail: "Requires search, review or survey sources", status: false },
  ], [product, category, market, price, url]);

  const startAnalysis = () => {
    if (product.trim().length < 2) return;
    setSubmitted(true);
    setSection("Analyze a product");
  };

  const pageTitle = section === "Overview" ? "Market intelligence, made actionable." : section;
  const pageDescription = section === "Overview"
    ? "A clearer view of products, competitors and opportunities across India."
    : "Build an evidence-led view of the Indian market. Facts, estimates and AI interpretation stay distinct.";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">M<span>.</span></div>
          <div><strong>ATSFY <b>MarketLens</b></strong><small>PRODUCT INTELLIGENCE</small></div>
          <button className="icon-button close-nav" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18}/></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switch"><span className="workspace-avatar">A</span><span><b>ATSFY Research</b><small>Personal workspace</small></span><ChevronDown size={15}/></button>
        <div className="nav-label">INTELLIGENCE</div>
        <nav>
          {navigation.map(({label, icon: Icon}) => (
            <button key={label} className={`nav-item ${section === label ? "active" : ""}`} onClick={() => {setSection(label);setMobileNav(false);}}>
              <Icon size={17}/><span>{label}</span>{label === "Watchlist" && <span className="nav-count">0</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="plan-card"><div className="plan-icon"><Sparkles size={16}/></div><b>Research with clarity</b><p>Upgrade when you need deeper analysis and more reports.</p><button onClick={() => setSection("Research reports")}>Explore plans <ArrowRight size={14}/></button></div>
          <button className="nav-item"><Settings2 size={17}/>Settings</button>
          <button className="nav-item"><CircleHelp size={17}/>Help centre</button>
          <div className="profile"><div className="profile-avatar">AP</div><div><b>Research workspace</b><small>Free plan</small></div><ChevronDown size={15}/></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20}/></button>
          <div className="breadcrumb">Workspace <span>/</span> <b>{section}</b></div>
          <div className="top-actions"><div className="market-pill"><span/> India market <ChevronDown size={14}/></div><button className="icon-button" aria-label="Notifications"><Bell size={18}/></button><div className="top-avatar">A</div></div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div><div className="eyebrow"><span className="eyebrow-dot"/> INDIA MARKET INTELLIGENCE</div><h1>{pageTitle}</h1><p>{pageDescription}</p></div>
            <button className="date-button"><Globe2 size={15}/> India <ChevronDown size={14}/></button>
          </div>

          {section === "Analyze a product" ? (
            <section className="analysis-layout">
              <div className="panel analysis-form">
                <div className="panel-heading"><div><span className="section-kicker">RESEARCH WORKBENCH</span><h2>Start with a product</h2><p>Tell us what you want to understand. We will build an evidence checklist before drawing conclusions.</p></div><div className="heading-icon"><FileSearch size={20}/></div></div>
                <label>Product name <span className="required">*</span><input value={product} onChange={e=>{setProduct(e.target.value);setSubmitted(false);}} placeholder="e.g. Smart home energy monitor"/></label>
                <div className="form-row"><label>Product category<select value={category} onChange={e=>setCategory(e.target.value)}><option>Consumer technology</option><option>Food & beverage</option><option>Beauty & personal care</option><option>Health & wellness</option><option>Fashion & lifestyle</option><option>Automotive</option><option>Industrial & manufacturing</option><option>Software & SaaS</option><option>Agriculture</option><option>Other</option></select></label><label>Target market<select value={market} onChange={e=>setMarket(e.target.value)}><option>India</option><option>North East India</option><option>Pan-India urban</option><option>Pan-India rural</option></select></label></div>
                <label>Current or planned selling price (INR)<input value={price} onChange={e=>setPrice(e.target.value.replace(/[^0-9.]/g,""))} placeholder="Optional — e.g. 2499"/></label>
                <label>Product website or source URL<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://... (optional)"/></label>
                <div className="form-note"><ShieldCheck size={16}/><span>We separate user-provided details, verified sources, estimates and AI-generated interpretation.</span></div>
                <button className="primary-button" onClick={startAnalysis} disabled={product.trim().length < 2}>Create research brief <ArrowRight size={16}/></button>
                {submitted && <div className="success-note"><CheckCircle2 size={16}/> Research brief created locally. Connect data sources to populate verified market evidence.</div>}
              </div>
              <div className="panel evidence-panel"><span className="section-kicker">EVIDENCE READINESS</span><h3>What we need to assess</h3><p className="muted">A transparent checklist, not an invented market score.</p><div className="readiness"><div><b>{checklist.filter(x=>x.status).length}</b><span>of {checklist.length} inputs available</span></div><div className="readiness-bar"><i style={{width:(checklist.filter(x=>x.status).length/checklist.length*100)+"%"}}/></div></div><div className="checklist">{checklist.map((item,i)=><div className="check-row" key={item.title}><div className={`check-icon ${item.status?"complete":""}`}>{item.status?<CheckCircle2 size={15}/>:<span>{i+1}</span>}</div><div><b>{item.title}</b><small>{item.detail}</small></div></div>)}</div><div className="evidence-foot"><ShieldCheck size={16}/> No market claims until supporting evidence is available.</div></div>
            </section>
          ) : (
            <>
              <section className="hero-search">
                <div className="hero-copy"><div className="hero-chip"><Sparkles size={13}/> YOUR MARKET RESEARCH COPILOT</div><h2>Every product has a market story.<br/><em>Find the signal.</em></h2><p>Research a product, explore its competitive landscape and uncover the questions that matter before you make a move.</p></div>
                <div className="search-card"><div className="search-label">WHAT PRODUCT ARE YOU RESEARCHING?</div><div className="search-input-wrap"><Search size={19}/><input value={product} onChange={e=>setProduct(e.target.value)} onKeyDown={e=>e.key==="Enter"&&startAnalysis()} placeholder="Enter a product, brand or product URL"/><button onClick={startAnalysis} disabled={product.trim().length<2}>Analyze <ArrowRight size={15}/></button></div><div className="search-meta"><span><Globe2 size={13}/> India-first research</span><span><ShieldCheck size={13}/> Evidence-led analysis</span></div></div>
                <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
              </section>

              <div className="section-header"><div><span className="section-kicker">YOUR INTELLIGENCE HUB</span><h2>Research overview</h2></div><button className="subtle-button" onClick={()=>setSection("Discover launches")}><Filter size={15}/> Explore workspace</button></div>
              <section className="metrics-grid">
                <Metric icon={<Activity size={18}/>} label="Products tracked" value="—" note="Awaiting source connection" />
                <Metric icon={<TrendingUp size={18}/>} label="Launches discovered" value="—" note="No live feed connected" />
                <Metric icon={<Boxes size={18}/>} label="Competitors mapped" value="—" note="Evidence not yet collected" />
                <Metric icon={<FileSearch size={18}/>} label="Research reports" value="0" note="Create your first brief" />
              </section>

              <section className="lower-grid">
                <div className="panel launch-panel"><div className="panel-title"><div><span className="section-kicker">DISCOVERY FEED</span><h3>Latest product launches</h3></div><button className="text-button" onClick={()=>setSection("Discover launches")}>View discovery <ArrowRight size={14}/></button></div><div className="empty-state"><div className="empty-icon"><Globe2 size={23}/></div><b>Your launch feed is getting ready</b><p>Connect approved launch, marketplace and company-announcement sources to discover products across India.</p><button className="outline-button" onClick={()=>setSection("Discover launches")}><Plus size={15}/> Explore source coverage</button></div></div>
                <div className="panel signals-panel"><div className="panel-title"><div><span className="section-kicker">RESEARCH SIGNALS</span><h3>What you can investigate</h3></div><div className="heading-icon small"><Lightbulb size={18}/></div></div><Signal icon={<BriefcaseBusiness size={16}/>} title="Competitive positioning" text="Compare features, price bands and customer segments."/><Signal icon={<TrendingUp size={16}/>} title="Demand indicators" text="Review search interest, reviews and category signals."/><Signal icon={<ArrowDownRight size={16}/>} title="Market gaps" text="Find underserved needs backed by source evidence."/></div>
              </section>
            </>
          )}
          <footer><span>© 2026 ATSFY Technologies</span><span>Built for clearer decisions <i>·</i> India</span><span className="footer-status"><span/> Workspace preview</span></footer>
        </div>
      </main>
      {mobileNav && <button className="scrim" onClick={()=>setMobileNav(false)} aria-label="Close navigation"/>}
    </div>
  );
}

function Metric({icon,label,value,note}:{icon:ReactNode;label:string;value:string;note:string}) {
  return <div className="metric-card"><div className="metric-top"><div className="metric-icon">{icon}</div><span className="metric-label">{label}</span></div><strong>{value}</strong><small>{note}</small></div>;
}
function Signal({icon,title,text}:{icon:React.ReactNode;title:string;text:string}) {
  return <div className="signal-row"><div className="signal-icon">{icon}</div><div><b>{title}</b><p>{text}</p></div><ArrowRight size={15}/></div>;
}
export default App;