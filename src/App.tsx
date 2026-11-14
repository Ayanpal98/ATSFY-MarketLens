import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import {
  Activity, ArrowRight, BarChart3, Bell, Bookmark, Boxes, CheckCircle2,
  ChevronDown, Compass, Download, FileSearch, Filter, Globe2, LayoutDashboard,
  Lightbulb, Menu, Plus, Search, ShieldCheck, Sparkles, Trash2, X
} from "lucide-react";

type Section = "Overview" | "Discover launches" | "Analyze a product" | "Competitors" | "Market gaps" | "Research reports" | "Watchlist";
type Report = { id: string; title: string; market: string; objective: string; createdAt: string; body: string };
type Saved = { id: string; name: string; kind: string; detail: string };
const nav: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard }, { label: "Discover launches", icon: Compass },
  { label: "Analyze a product", icon: FileSearch }, { label: "Competitors", icon: Boxes },
  { label: "Market gaps", icon: Lightbulb }, { label: "Research reports", icon: BarChart3 },
  { label: "Watchlist", icon: Bookmark }
];
const demoLaunches = [
  { id: "demo-1", name: "Smart energy monitoring", category: "Climate & energy", region: "India", date: "Illustrative example", detail: "A connected home-energy concept for tracking appliance-level electricity use.", stage: "Illustrative" },
  { id: "demo-2", name: "Millet-based snack range", category: "Food & beverage", region: "North East India", date: "Illustrative example", detail: "A packaged food concept exploring regional grains and convenient nutrition.", stage: "Illustrative" },
  { id: "demo-3", name: "Farm input advisory app", category: "Agriculture", region: "India", date: "Illustrative example", detail: "A mobile-first concept for localized crop and input recommendations.", stage: "Illustrative" },
  { id: "demo-4", name: "Clinic operations software", category: "Health & wellness", region: "India", date: "Illustrative example", detail: "A workflow concept for appointments, patient communication and clinic administration.", stage: "Illustrative" }
];
const gapIdeas = [
  { id: "gap-1", title: "Affordable cold-chain visibility for small producers", sector: "Agriculture", region: "North East India", rationale: "A hypothesis to investigate: small producers may face cost and access barriers when monitoring temperature-sensitive goods.", validate: "Interview producers, transporters and buyers; compare existing service costs." },
  { id: "gap-2", title: "Regional-language workflow tools for micro businesses", sector: "Software & SaaS", region: "India", rationale: "A hypothesis to investigate: owners may need simpler tools that fit local-language workflows and low training time.", validate: "Observe business workflows and test clickable prototypes with owners." },
  { id: "gap-3", title: "Transparent sourcing for local food brands", sector: "Food & beverage", region: "North East India", rationale: "A hypothesis to investigate: customers and retailers may value traceability and consistent supplier information.", validate: "Interview retailers and consumers; test purchase intent and willingness to pay." }
];
const readStore = <T,>(key: string, fallback: T): T => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
};
const uid = () => Math.random().toString(36).slice(2, 10);

export default function App() {
  const [section, setSection] = useState<Section>("Overview");
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authMessage, setAuthMessage] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All sectors");
  const [saved, setSaved] = useState<Saved[]>(() => readStore("ml_saved", []));
  const [reports, setReports] = useState<Report[]>(() => readStore("ml_reports", []));
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState("Consumer technology");
  const [market, setMarket] = useState("India");
  const [price, setPrice] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [objective, setObjective] = useState("Assess market opportunity");
  const [competitors, setCompetitors] = useState(["", "", ""]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) { setSession(data.session); setAuthReady(true); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthReady(true);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session?.user) { setWorkspaceId(null); return; }
    const loadWorkspace = async () => {
      const user = session.user;
      await supabase.from("profiles").upsert({ id: user.id, display_name: user.user_metadata?.full_name ?? user.email ?? null }, { onConflict: "id" });
      let { data: workspaces } = await supabase.from("workspaces").select("id").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1);
      let id = workspaces?.[0]?.id as string | undefined;
      if (!id) {
        const created = await supabase.from("workspaces").insert({ owner_id: user.id, name: "Research workspace", description: "Personal MarketLens workspace" }).select("id").single();
        if (created.error) { setNotice("Workspace setup failed: " + created.error.message); return; }
        id = created.data.id;
      }
      setWorkspaceId(id);
      const [reportResult, savedResult] = await Promise.all([
        supabase.from("research_reports").select("*").eq("owner_id", user.id).order("updated_at", { ascending: false }),
        supabase.from("watchlist_items").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
      ]);
      if (reportResult.error) setNotice("Could not load reports: " + reportResult.error.message);
      else setReports((reportResult.data ?? []).map((row: any) => ({ id: row.id, title: row.title, market: row.report_content?.market ?? "India", objective: row.report_content?.objective ?? "", createdAt: new Date(row.created_at).toLocaleString(), body: row.report_content?.body ?? "" })));
      if (savedResult.error) setNotice("Could not load watchlist: " + savedResult.error.message);
      else setSaved((savedResult.data ?? []).map((row: any) => ({ id: row.id, name: row.title, kind: row.metadata?.kind ?? row.entity_type, detail: row.metadata?.detail ?? "" })));
    };
    void loadWorkspace();
  }, [session?.user?.id]);
  const title = section === "Overview" ? "Market intelligence, made actionable." : section;
  const sectors = ["All sectors", "Agriculture", "Climate & energy", "Food & beverage", "Health & wellness", "Software & SaaS"];
  const launches = useMemo(() => demoLaunches.filter(x => (filter === "All sectors" || x.category === filter) && (x.name + x.category + x.region).toLowerCase().includes(query.toLowerCase())), [filter, query]);
  const addSaved = async (item: Saved) => {
    if (!session?.user || !workspaceId) { setNotice("Sign in and wait for your workspace to finish loading."); return; }
    if (saved.some(x => x.name === item.name)) { setNotice("Already in your watchlist."); return; }
    const entityType = item.kind.toLowerCase().includes("hypothesis") ? "market_signal" : item.kind.toLowerCase().includes("launch") ? "launch" : "product";
    const { data, error } = await supabase.from("watchlist_items").insert({
      owner_id: session.user.id, workspace_id: workspaceId, entity_type: entityType,
      external_id: item.id, title: item.name, metadata: { kind: item.kind, detail: item.detail }
    }).select("*").single();
    if (error) { setNotice("Could not save item: " + error.message); return; }
    setSaved(old => [{ id: data.id, name: data.title, kind: data.metadata?.kind ?? item.kind, detail: data.metadata?.detail ?? item.detail }, ...old]);
    setNotice("Saved to your account and synced to MarketLens.");
  };
  const removeSaved = async (id: string) => {
    const { error } = await supabase.from("watchlist_items").delete().eq("id", id);
    if (error) { setNotice("Could not remove item: " + error.message); return; }
    setSaved(old => old.filter(x => x.id !== id));
  };
  const deleteReport = async (id: string) => {
    const { error } = await supabase.from("research_reports").delete().eq("id", id);
    if (error) { setNotice("Could not delete report: " + error.message); return; }
    setReports(old => old.filter(x => x.id !== id));
  };
  const saveCompetitors = async () => {
    if (!session?.user || !workspaceId) { setNotice("Your workspace is still loading."); return; }
    const rows = competitors.filter(name => name.trim()).map(name => ({
      owner_id: session.user.id, workspace_id: workspaceId, name: name.trim(),
      notes: "Manually entered competitor for: " + (product || "unspecified research topic"),
      metadata: { entry_method: "manual", verification_status: "unverified" }
    }));
    if (!rows.length) { setNotice("Enter at least one competitor first."); return; }
    const { error } = await supabase.from("competitors").insert(rows);
    if (error) { setNotice("Could not save competitors: " + error.message); return; }
    setNotice(rows.length + " competitor record(s) saved to your workspace as unverified manual entries.");
  };
  const submitAuth = async () => {
    setAuthMessage("");
    if (!authEmail.trim() || authPassword.length < 8) { setAuthMessage("Enter a valid email and a password with at least 8 characters."); return; }
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword })
      : await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
    if (result.error) setAuthMessage(result.error.message);
    else if (authMode === "signup" && !result.data.session) setAuthMessage("Account created. Check your email to confirm the address, then sign in.");
    else setAuthMessage("Signed in. Loading your workspace…");
  };
  const createReport = () => {
    const name = (reportTitle || product || "Market opportunity research").trim();
    const body = [
      "# " + name, "", "Market: " + market, "Research objective: " + objective, "",
      "## Research scope", "Define the customer segment, geography, use case and buying context. Record assumptions separately from source-backed findings.", "",
      "## Questions to investigate", "- Who experiences this problem, and how frequently?", "- What alternatives are used today?", "- What are the price points and switching costs?", "- Which competitors serve the same customer?", "- What evidence would disprove the opportunity?", "",
      "## Evidence register", "Add source name, URL, access date, relevant excerpt and evidence status (Verified / Observed / Estimated / AI interpretation / Unavailable).", "",
      "## Competitor landscape", "Document direct and indirect alternatives, positioning, pricing evidence and differentiators.", "",
      "## Opportunity assessment", "Do not assign a market score until the methodology, inputs and evidence are documented.", "",
      "## Validation plan", "Conduct customer interviews, test willingness to pay and run a small pilot before making investment decisions.", "",
      "## Limitations", "This is a research scaffold generated from user inputs. It is not independently verified market research."
    ].join("\n");
    if (!session?.user || !workspaceId) { setNotice("Your workspace is still loading. Please try again."); return; }
    const content = { body, market, objective, category, planned_price_inr: price || null, source_url: sourceUrl || null };
    const { data, error } = await supabase.from("research_reports").insert({
      owner_id: session.user.id, workspace_id: workspaceId, title: name,
      product_name: product || null, status: "draft", report_content: content
    }).select("*").single();
    if (error) { setNotice("Could not save report: " + error.message); return; }
    if (sourceUrl.trim()) {
      const evidence = await supabase.from("evidence_sources").insert({
        owner_id: session.user.id, workspace_id: workspaceId, title: product || name,
        source_url: sourceUrl.trim(), source_type: "user_provided", verification_status: "unverified",
        notes: "User-provided product source. Not independently verified."
      });
      if (evidence.error) setNotice("Report saved; source URL could not be saved: " + evidence.error.message);
    }
    const report: Report = { id: data.id, title: data.title, market, objective, createdAt: new Date(data.created_at).toLocaleString(), body };
    setReports(old => [report, ...old]); setNotice("Research scaffold saved to your MarketLens account.");
    setSection("Research reports");
  };
  const download = (filename: string, content: string, type = "text/markdown") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };
  const openReport = (r: Report) => download(r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".md", r.body);
  const pageDesc = section === "Overview" ? "Explore products, competitors and opportunity hypotheses with a clear view of what is known and what still needs validation." : "Keep sourced evidence, estimates and research hypotheses clearly separated.";

  if (!authReady) return <div className="auth-screen"><div className="auth-card"><div className="brand-mark">M<span>.</span></div><h1>Opening MarketLens</h1><p>Checking your secure session…</p></div></div>;
  if (!session) return <div className="auth-screen"><div className="auth-card"><div className="brand-mark">M<span>.</span></div><div className="eyebrow">ATSFY TECHNOLOGIES · MARKET INTELLIGENCE</div><h1>{authMode === "signin" ? "Welcome back." : "Create your workspace."}</h1><p>Sign in to keep research reports and watchlists securely synced to your account.</p><label>Email address<input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label><label>Password<input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={authMode === "signin" ? "current-password" : "new-password"}/></label>{authMessage && <div className="auth-message">{authMessage}</div>}<button className="primary-button auth-submit" onClick={submitAuth}>{authMode === "signin" ? "Sign in" : "Create account"} <ArrowRight size={15}/></button><button className="auth-switch" onClick={()=>{setAuthMode(authMode === "signin" ? "signup" : "signin");setAuthMessage("");}}>{authMode === "signin" ? "New to MarketLens? Create an account" : "Already have an account? Sign in"}</button></div></div>;
  return <div className="app-shell">
    <aside className={"sidebar " + (mobileNav ? "sidebar-open" : "")}>
      <div className="brand"><div className="brand-mark">M<span>.</span></div><div><strong>ATSFY <b>MarketLens</b></strong><small>PRODUCT INTELLIGENCE</small></div><button className="icon-button close-nav" onClick={() => setMobileNav(false)} aria-label="Close"><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div><div className="workspace-switch"><span className="workspace-avatar">A</span><span><b>Research workspace</b><small>{workspaceId ? "Cloud-synced workspace" : "Loading workspace…"}</small></span><ChevronDown size={15}/></div>
      <div className="nav-label">INTELLIGENCE</div><nav>{nav.map(({label, icon: Icon}) => <button key={label} className={"nav-item " + (section === label ? "active" : "")} onClick={() => {setSection(label);setMobileNav(false);setNotice("");}}><Icon size={17}/><span>{label}</span>{label === "Watchlist" && <span className="nav-count">{saved.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="plan-card"><div className="plan-icon"><Sparkles size={16}/></div><b>Research with clarity</b><p>Evidence first. Assumptions visible. Decisions made with context.</p><button onClick={() => setSection("Research reports")}>Create a research brief <ArrowRight size={14}/></button></div><div className="profile"><div className="profile-avatar">ML</div><div><b>{session.user.email ?? "MarketLens user"}</b><small>Secure cloud workspace</small></div><button className="icon-button" onClick={()=>supabase.auth.signOut()} aria-label="Sign out"><X size={15}/></button></div></div>
    </aside>
    <main className="main-area"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <b>{section}</b></div><div className="top-actions"><div className="market-pill"><span/> India-first research <ChevronDown size={14}/></div><div className="top-avatar">M</div></div></header>
      <div className="content"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> ATSFY TECHNOLOGIES · MARKET INTELLIGENCE</div><h1>{title}</h1><p>{pageDesc}</p></div><span className="preview-tag">PREVIEW WORKSPACE</span></div>
      {notice && <div className="notice"><CheckCircle2 size={15}/>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={14}/></button></div>}
      {section === "Overview" && <><section className="hero-search"><div className="hero-copy"><div className="hero-chip"><Sparkles size={13}/> INDIA-FIRST PRODUCT INTELLIGENCE</div><h2>Find the signal.<br/><em>Understand the opportunity.</em></h2><p>Explore product launches, map competitors and turn market questions into structured research.</p></div><div className="search-card"><div className="search-label">WHAT DO YOU WANT TO RESEARCH?</div><div className="search-input-wrap"><Search size={19}/><input value={product} onChange={e=>setProduct(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setSection("Analyze a product")} placeholder="Enter a product, brand, category or idea"/><button onClick={()=>setSection("Analyze a product")} disabled={!product.trim()}>Start research <ArrowRight size={15}/></button></div><div className="search-meta"><span><Globe2 size={13}/> India and Northeast focus</span><span><ShieldCheck size={13}/> Evidence-aware workflow</span></div></div><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/></section>
      <div className="section-header"><div><span className="section-kicker">YOUR WORKSPACE</span><h2>Research overview</h2></div><button className="subtle-button" onClick={()=>setSection("Discover launches")}><Compass size={15}/> Explore launches</button></div>
      <section className="metrics-grid"><Metric icon={<Bookmark size={18}/>} label="Watchlist items" value={String(saved.length)} note="Synced to your account"/><Metric icon={<FileSearch size={18}/>} label="Research briefs" value={String(reports.length)} note="Saved to your account"/><Metric icon={<Compass size={18}/>} label="Launch examples" value="4" note="Illustrative demo records"/><Metric icon={<Activity size={18}/>} label="Live data feeds" value="0" note="No external feeds connected"/></section>
      <section className="lower-grid"><div className="panel"><PanelTitle kicker="DISCOVERY" title="Explore product launches" action="Open discovery" onClick={()=>setSection("Discover launches")}/><Empty title="A starting point for discovery" text="Browse clearly labelled illustrative examples, then connect approved sources for verified launch intelligence."/></div><div className="panel"><PanelTitle kicker="RESEARCH TOOLS" title="What you can investigate"/><Signal title="Competitor landscape" text="Compare alternatives and document source-backed positioning."/><Signal title="Market-gap hypotheses" text="Turn unmet-need ideas into customer validation questions."/><Signal title="Research reports" text="Create and export structured research scaffolds."/></div></section></>}
      {section === "Discover launches" && <section className="panel page-panel"><PanelTitle kicker="PRODUCT DISCOVERY" title="Launch discovery workspace"/><div className="disclaimer"><ShieldCheck size={16}/> The records below are illustrative examples, not verified real-world launches. Live discovery requires permitted data-source integrations.</div><div className="toolbar"><div className="field-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search example records"/></div><select value={filter} onChange={e=>setFilter(e.target.value)}>{sectors.map(s=><option key={s}>{s}</option>)}</select><button className="subtle-button" onClick={()=>{setQuery("");setFilter("All sectors");}}><Filter size={14}/> Reset</button></div><div className="record-list">{launches.map(x=><div className="record" key={x.id}><div className="record-icon"><Globe2 size={19}/></div><div className="record-main"><div className="record-meta"><span>{x.category}</span><span className="demo-label">ILLUSTRATIVE</span></div><b>{x.name}</b><p>{x.detail}</p><small>{x.region} · {x.date}</small></div><button className="outline-button" onClick={()=>addSaved({id:x.id,name:x.name,kind:"Launch example",detail:x.detail})}><Bookmark size={14}/> Save</button></div>)}</div>{launches.length===0 && <Empty title="No matching examples" text="Try another search or reset the sector filter."/>}</section>}
      {section === "Analyze a product" && <section className="analysis-layout"><div className="panel analysis-form"><PanelTitle kicker="RESEARCH WORKBENCH" title="Create a product research brief"/><p className="muted">Capture the question and define the scope before gathering evidence.</p><label>Product, brand or idea<input value={product} onChange={e=>setProduct(e.target.value)} placeholder="e.g. Millet-based ready-to-eat snacks"/></label><div className="form-row"><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option>Consumer technology</option><option>Food & beverage</option><option>Health & wellness</option><option>Software & SaaS</option><option>Agriculture</option><option>Climate & energy</option><option>Other</option></select></label><label>Target market<select value={market} onChange={e=>setMarket(e.target.value)}><option>India</option><option>North East India</option><option>Pan-India urban</option><option>Pan-India rural</option></select></label></div><label>Planned selling price (INR)<input value={price} onChange={e=>setPrice(e.target.value.replace(/[^0-9.]/g,""))} placeholder="Optional"/></label><label>Product website or source URL<input value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://... (optional)"/></label><div className="form-note"><ShieldCheck size={16}/> User-provided details are not treated as independently verified evidence.</div><button className="primary-button" onClick={()=>{setReportTitle(product.trim());setObjective("Assess product, customer and competitor landscape");createReport();}} disabled={!product.trim()}>Create research scaffold <ArrowRight size={15}/></button></div><div className="panel evidence-panel"><span className="section-kicker">RESEARCH CHECKLIST</span><h3>Evidence to collect</h3><p className="muted">A checklist, not a fabricated market score.</p>{["Customer problem and use case","Target segment and geography","Competitor products and pricing","Demand and customer feedback","Distribution and regulatory factors","Primary validation interviews"].map((x,i)=><div className="check-row" key={x}><div className="check-icon">{i+1}</div><div><b>{x}</b><small>Not yet researched — add sources before drawing conclusions.</small></div></div>)}</div></section>}
      {section === "Competitors" && <section className="panel page-panel"><PanelTitle kicker="COMPETITIVE INTELLIGENCE" title="Build a competitor comparison"/><p className="muted">Enter known alternatives manually. MarketLens does not fetch or verify competitor data yet.</p><label>Product or category being researched<input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product or category"/></label><div className="competitor-grid">{competitors.map((v,i)=><label key={i}>Competitor {i+1}<input value={v} onChange={e=>setCompetitors(old=>old.map((x,j)=>j===i?e.target.value:x))} placeholder="Company or product name"/></label>)}</div><button className="primary-button" onClick={saveCompetitors}><Plus size={15}/> Save competitors to workspace</button><button className="subtle-button" onClick={()=>download("marketlens-competitor-notes.md", "# Competitor research notes\n\nSubject: "+(product||"Not specified")+"\n\n"+competitors.map((x,i)=>(i+1)+". "+(x||"Not entered")+"\n- Website/source: \n- Pricing evidence: \n- Target customer: \n- Differentiation: \n- Evidence status: Unavailable").join("\n\n"))}> <Download size={15}/> Export comparison template</button></section>}
      {section === "Market gaps" && <section className="panel page-panel"><PanelTitle kicker="OPPORTUNITY EXPLORER" title="Market-gap hypotheses"/><div className="disclaimer"><Lightbulb size={16}/> These are research hypotheses for validation, not proven market gaps or measured demand.</div><div className="gap-grid">{gapIdeas.map(g=><article className="gap-card" key={g.id}><div className="record-meta"><span>{g.sector}</span><span className="demo-label">HYPOTHESIS</span></div><h3>{g.title}</h3><p>{g.rationale}</p><div className="validate"><b>How to validate</b><span>{g.validate}</span></div><button className="outline-button" onClick={()=>addSaved({id:g.id,name:g.title,kind:"Market-gap hypothesis",detail:g.rationale})}><Bookmark size={14}/> Save hypothesis</button></article>)}</div></section>}
      {section === "Research reports" && <section className="page-panel"><div className="report-builder panel"><PanelTitle kicker="RESEARCH STUDIO" title="Create a research report"/><p className="muted">Generate a structured research scaffold that you can fill with sourced evidence. This does not automatically collect or verify market data.</p><label>Research topic<input value={reportTitle} onChange={e=>setReportTitle(e.target.value)} placeholder="e.g. Millet snack market in Northeast India"/></label><div className="form-row"><label>Geography<select value={market} onChange={e=>setMarket(e.target.value)}><option>India</option><option>North East India</option><option>Tripura</option><option>Assam</option><option>Pan-India urban</option></select></label><label>Objective<select value={objective} onChange={e=>setObjective(e.target.value)}><option>Assess market opportunity</option><option>Map competitors</option><option>Understand customer demand</option><option>Evaluate market entry</option><option>Prepare startup validation</option></select></label></div><button className="primary-button" onClick={createReport}> <Plus size={15}/> Generate research scaffold</button></div><div className="section-header"><div><span className="section-kicker">YOUR LIBRARY</span><h2>Saved reports ({reports.length})</h2></div></div><div className="report-list">{reports.map(r=><div className="report-row" key={r.id}><div className="record-icon"><FileSearch size={18}/></div><div className="record-main"><b>{r.title}</b><p>{r.market} · {r.objective}</p><small>Created {r.createdAt} · Stored in your MarketLens account</small></div><button className="outline-button" onClick={()=>openReport(r)}><Download size={14}/> Export</button><button className="icon-button danger" onClick={()=>deleteReport(r.id)} aria-label="Delete report"><Trash2 size={15}/></button></div>)}</div>{reports.length===0 && <Empty title="No reports yet" text="Create your first research scaffold above. It will be saved to your MarketLens account."/>}</section>}
      {section === "Watchlist" && <section className="panel page-panel"><PanelTitle kicker="SAVED INTELLIGENCE" title="Your watchlist"/><p className="muted">Saved items are private to your account and synced across your signed-in devices.</p>{saved.length===0 ? <Empty title="Your watchlist is empty" text="Save launch examples and opportunity hypotheses to keep them together."/> : <div className="record-list">{saved.map(x=><div className="record" key={x.id}><div className="record-icon"><Bookmark size={18}/></div><div className="record-main"><div className="record-meta"><span>{x.kind}</span></div><b>{x.name}</b><p>{x.detail}</p></div><button className="icon-button danger" onClick={()=>removeSaved(x.id)} aria-label="Remove from watchlist"><Trash2 size={15}/></button></div>)}</div>}<button className="subtle-button" onClick={()=>download("marketlens-watchlist.csv","Name,Type,Details\n"+saved.map(x=>[x.name,x.kind,x.detail].map(v=>'"'+v.replace(/"/g,'""')+'"').join(",")).join("\n"),"text/csv")} disabled={!saved.length}><Download size={14}/> Export watchlist CSV</button></section>}
      <footer><span>© 2026 ATSFY Technologies</span><span>Evidence before assumptions · India</span><span className="footer-status"><span/> Secure account workspace</span></footer>
      </div>
    </main>{mobileNav && <button className="scrim" onClick={()=>setMobileNav(false)} aria-label="Close navigation"/>}
  </div>;
}
function Metric({icon,label,value,note}:{icon:React.ReactNode;label:string;value:string;note:string}) { return <div className="metric-card"><div className="metric-top"><div className="metric-icon">{icon}</div><span className="metric-label">{label}</span></div><strong>{value}</strong><small>{note}</small></div>; }
function PanelTitle({kicker,title,action,onClick}:{kicker:string;title:string;action?:string;onClick?:()=>void}) { return <div className="panel-title"><div><span className="section-kicker">{kicker}</span><h3>{title}</h3></div>{action && <button className="text-button" onClick={onClick}>{action}<ArrowRight size={14}/></button>}</div>; }
function Signal({title,text}:{title:string;text:string}) { return <div className="signal-row"><div className="signal-icon"><Sparkles size={16}/></div><div><b>{title}</b><p>{text}</p></div><ArrowRight size={15}/></div>; }
function Empty({title,text}:{title:string;text:string}) { return <div className="empty-state"><div className="empty-icon"><Globe2 size={23}/></div><b>{title}</b><p>{text}</p></div>; }
