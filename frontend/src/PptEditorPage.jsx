import { useState, useRef, useCallback } from "react";

// ─── THEME DEFINITIONS ──────────────────────────────────────────────────────────
const THEMES = {
  cosmic: {
    name: "Cosmic", emoji: "🌌",
    slideTypes: {
      title:      { bg: "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)", accent:"#6366f1", accent2:"#818cf8", tagColor:"#a5b4fc" },
      overview:   { bg: "linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 100%)",             accent:"#8b5cf6", accent2:"#a78bfa", tagColor:"#c4b5fd" },
      content:    { bg: "linear-gradient(135deg,#050510 0%,#0d0d20 100%)",             accent:"#14b8a6", accent2:"#2dd4bf", tagColor:"#5eead4" },
      highlight:  { bg: "linear-gradient(135deg,#0d0922 0%,#1a0d40 60%,#2d0d52 100%)",accent:"#f59e0b", accent2:"#fbbf24", tagColor:"#fcd34d" },
      conclusion: { bg: "linear-gradient(135deg,#0f0c29 0%,#1e113a 50%,#2d1b4e 100%)",accent:"#ec4899", accent2:"#f9a8d4", tagColor:"#f9a8d4" },
    },
    preview: ["#0f0c29","#302b63","#6366f1"],
  },
  ocean: {
    name: "Ocean", emoji: "🌊",
    slideTypes: {
      title:      { bg: "linear-gradient(135deg,#0c1445 0%,#0a2a6e 50%,#0d3b8a 100%)", accent:"#38bdf8", accent2:"#7dd3fc", tagColor:"#bae6fd" },
      overview:   { bg: "linear-gradient(135deg,#061025 0%,#0a1f50 100%)",             accent:"#06b6d4", accent2:"#67e8f9", tagColor:"#a5f3fc" },
      content:    { bg: "linear-gradient(135deg,#040c1a 0%,#071628 100%)",             accent:"#0ea5e9", accent2:"#38bdf8", tagColor:"#7dd3fc" },
      highlight:  { bg: "linear-gradient(135deg,#051020 0%,#0a1f40 60%,#0c2855 100%)",accent:"#f0abfc", accent2:"#e879f9", tagColor:"#f5d0fe" },
      conclusion: { bg: "linear-gradient(135deg,#061025 0%,#0c2040 50%,#0d2d5e 100%)",accent:"#34d399", accent2:"#6ee7b7", tagColor:"#a7f3d0" },
    },
    preview: ["#0c1445","#0a2a6e","#38bdf8"],
  },
  forest: {
    name: "Forest", emoji: "🌿",
    slideTypes: {
      title:      { bg: "linear-gradient(135deg,#0a1a0c 0%,#162b18 50%,#1a3320 100%)", accent:"#4ade80", accent2:"#86efac", tagColor:"#bbf7d0" },
      overview:   { bg: "linear-gradient(135deg,#071009 0%,#0f1e11 100%)",             accent:"#22c55e", accent2:"#4ade80", tagColor:"#86efac" },
      content:    { bg: "linear-gradient(135deg,#040a05 0%,#0a1609 100%)",             accent:"#10b981", accent2:"#34d399", tagColor:"#6ee7b7" },
      highlight:  { bg: "linear-gradient(135deg,#0a0f08 0%,#142012 60%,#192818 100%)",accent:"#fbbf24", accent2:"#fcd34d", tagColor:"#fde68a" },
      conclusion: { bg: "linear-gradient(135deg,#080e08 0%,#102010 50%,#162818 100%)",accent:"#a78bfa", accent2:"#c4b5fd", tagColor:"#ddd6fe" },
    },
    preview: ["#0a1a0c","#162b18","#4ade80"],
  },
  ember: {
    name: "Ember", emoji: "🔥",
    slideTypes: {
      title:      { bg: "linear-gradient(135deg,#1a0800 0%,#3d1200 50%,#5c1a00 100%)", accent:"#f97316", accent2:"#fb923c", tagColor:"#fed7aa" },
      overview:   { bg: "linear-gradient(135deg,#140500 0%,#2d0e00 100%)",             accent:"#ef4444", accent2:"#f87171", tagColor:"#fecaca" },
      content:    { bg: "linear-gradient(135deg,#0d0300 0%,#1f0800 100%)",             accent:"#f59e0b", accent2:"#fbbf24", tagColor:"#fde68a" },
      highlight:  { bg: "linear-gradient(135deg,#0f0400 0%,#1f0a00 60%,#2d1000 100%)",accent:"#e879f9", accent2:"#f0abfc", tagColor:"#f5d0fe" },
      conclusion: { bg: "linear-gradient(135deg,#120500 0%,#251000 50%,#351500 100%)",accent:"#facc15", accent2:"#fde047", tagColor:"#fef9c3" },
    },
    preview: ["#1a0800","#3d1200","#f97316"],
  },
  slate: {
    name: "Slate", emoji: "🏢",
    slideTypes: {
      title:      { bg: "linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%)", accent:"#94a3b8", accent2:"#cbd5e1", tagColor:"#e2e8f0" },
      overview:   { bg: "linear-gradient(135deg,#0a101e 0%,#141d2e 100%)",             accent:"#60a5fa", accent2:"#93c5fd", tagColor:"#bfdbfe" },
      content:    { bg: "linear-gradient(135deg,#060c18 0%,#0d1524 100%)",             accent:"#a78bfa", accent2:"#c4b5fd", tagColor:"#ddd6fe" },
      highlight:  { bg: "linear-gradient(135deg,#090f1e 0%,#111e33 60%,#182840 100%)",accent:"#f472b6", accent2:"#f9a8d4", tagColor:"#fce7f3" },
      conclusion: { bg: "linear-gradient(135deg,#0c1220 0%,#1a2540 50%,#1e2d4e 100%)",accent:"#2dd4bf", accent2:"#5eead4", tagColor:"#99f6e4" },
    },
    preview: ["#0f172a","#1e293b","#94a3b8"],
  },
  aurora: {
    name: "Aurora", emoji: "🌅",
    slideTypes: {
      title:      { bg: "linear-gradient(135deg,#0d1b2a 0%,#1b2d3e 40%,#162635 100%)", accent:"#818cf8", accent2:"#a5b4fc", tagColor:"#c7d2fe" },
      overview:   { bg: "linear-gradient(135deg,#0a1520 0%,#162230 100%)",             accent:"#34d399", accent2:"#6ee7b7", tagColor:"#a7f3d0" },
      content:    { bg: "linear-gradient(135deg,#080f18 0%,#0e1a28 100%)",             accent:"#f472b6", accent2:"#f9a8d4", tagColor:"#fce7f3" },
      highlight:  { bg: "linear-gradient(135deg,#0a1220 0%,#131d30 60%,#182840 100%)",accent:"#fb923c", accent2:"#fdba74", tagColor:"#fed7aa" },
      conclusion: { bg: "linear-gradient(135deg,#0d1520 0%,#162030 50%,#1e2d3e 100%)",accent:"#22d3ee", accent2:"#67e8f9", tagColor:"#a5f3fc" },
    },
    preview: ["#0d1b2a","#1b2d3e","#818cf8"],
  },
};

const SHAPE_DEFS = [
  { id:"rect",    label:"Rectangle",       emoji:"⬜" },
  { id:"rounded", label:"Rounded Rect",    emoji:"▭" },
  { id:"circle",  label:"Circle",          emoji:"⭕" },
  { id:"triangle",label:"Triangle",        emoji:"△" },
  { id:"arrow",   label:"Arrow Right",     emoji:"➡️" },
  { id:"star",    label:"Star",            emoji:"⭐" },
  { id:"callout", label:"Speech Bubble",   emoji:"💬" },
  { id:"diamond", label:"Diamond",         emoji:"♦" },
];

const SHAPE_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#10b981","#3b82f6","#f43f5e",
  "#a855f7","#06b6d4","#22c55e","#f97316","#e879f9","#38bdf8","rgba(255,255,255,0.15)","rgba(255,255,255,0.06)",
];

const TABLE_PRESETS = [
  { rows:2, cols:2 }, { rows:3, cols:3 }, { rows:4, cols:3 },
  { rows:2, cols:4 }, { rows:5, cols:2 }, { rows:3, cols:4 },
];

// ─── SHAPE SVG RENDERER ─────────────────────────────────────────────────────────
function ShapeSvg({ type, color, w = 100, h = 60 }) {
  const s = { fill: color, stroke: "rgba(255,255,255,0.2)", strokeWidth: 1 };
  switch (type) {
    case "rect":     return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect x={1} y={1} width={w-2} height={h-2} {...s} /></svg>;
    case "rounded":  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><rect x={1} y={1} width={w-2} height={h-2} rx={10} ry={10} {...s} /></svg>;
    case "circle":   return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><ellipse cx={w/2} cy={h/2} rx={w/2-1} ry={h/2-1} {...s} /></svg>;
    case "triangle": return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polygon points={`${w/2},1 ${w-1},${h-1} 1,${h-1}`} {...s} /></svg>;
    case "arrow":    return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polygon points={`0,${h*0.3} ${w*0.65},${h*0.3} ${w*0.65},0 ${w},${h*0.5} ${w*0.65},${h} ${w*0.65},${h*0.7} 0,${h*0.7}`} {...s} /></svg>;
    case "star":     return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polygon points={`${w/2},1 ${w*0.61},${h*0.35} ${w-1},${h*0.35} ${w*0.68},${h*0.57} ${w*0.79},${h-1} ${w/2},${h*0.76} ${w*0.21},${h-1} ${w*0.32},${h*0.57} 1,${h*0.35} ${w*0.39},${h*0.35}`} {...s} /></svg>;
    case "callout":  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><path d={`M8,1 Q1,1 1,8 L1,${h*0.7} Q1,${h*0.78} 8,${h*0.78} L${w*0.3},${h*0.78} L${w*0.2},${h-1} L${w*0.45},${h*0.78} L${w-8},${h*0.78} Q${w-1},${h*0.78} ${w-1},${h*0.7} L${w-1},8 Q${w-1},1 ${w-8},1 Z`} {...s} /></svg>;
    case "diamond":  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polygon points={`${w/2},1 ${w-1},${h/2} ${w/2},${h-1} 1,${h/2}`} {...s} /></svg>;
    default:         return null;
  }
}

// ─── TABLE RENDERER (for slide preview) ─────────────────────────────────────────
function TablePreview({ tableData, accent }) {
  if (!tableData) return null;
  const { rows, cols, cells, style } = tableData;
  const headerBg = style === "striped" ? accent + "44" : accent + "33";
  const stripeBg = style === "striped" ? "rgba(255,255,255,0.04)" : "transparent";
  return (
    <div style={{ overflowX:"auto", marginTop:6 }}>
      <table style={{ borderCollapse:"collapse", width:"100%", fontSize:"clamp(7px,1.2vw,11px)", fontFamily:"'DM Sans',sans-serif" }}>
        {cells.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci} style={{
                padding:"4px 8px",
                border: `1px solid ${accent}44`,
                background: ri === 0 ? headerBg : (style==="striped" && ri%2===0 ? stripeBg : "rgba(255,255,255,0.02)"),
                color: ri === 0 ? "#ffffff" : "rgba(255,255,255,0.8)",
                fontWeight: ri === 0 ? 700 : 400,
                textAlign: "center",
              }}>
                {cell || (ri === 0 ? `Col ${ci+1}` : "")}
              </td>
            ))}
          </tr>
        ))}
      </table>
    </div>
  );
}

// ─── MAIN EDITOR ────────────────────────────────────────────────────────────────
export default function PptEditorEnhanced({ slides: initialSlides, onBack, onExportPptx, onExportPdf }) {
  const [slides, setSlides] = useState(initialSlides || [
    { title: "Presentation Title", content: "Subtitle or intro line\nAnother supporting point", type: "title", extras: [] },
    { title: "Overview", content: "Main point one\nMain point two\nMain point three", type: "overview", extras: [] },
    { title: "Key Findings", content: "Finding one in detail\nFinding two in detail\nFinding three in detail\nFinding four in detail", type: "content", extras: [] },
    { title: "Highlight", content: "The most important takeaway from this content", type: "highlight", extras: [] },
    { title: "Conclusion", content: "Final thought one\nFinal thought two\nFinal thought three", type: "conclusion", extras: [] },
  ]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activePanel, setActivePanel] = useState(null); // null | "insert" | "design"
  const [activeInsertTab, setActiveInsertTab] = useState("table"); // table | image | shape
  const [currentTheme, setCurrentTheme] = useState("cosmic");

  // Insert state
  const [tableConfig, setTableConfig] = useState({ rows:3, cols:3, style:"default" });
  const [tableCells, setTableCells] = useState(() => Array.from({length:3},()=>Array(3).fill("")));
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [selectedShape, setSelectedShape] = useState("rect");
  const [selectedShapeColor, setSelectedShapeColor] = useState("#6366f1");
  const [shapeLabel, setShapeLabel] = useState("");

  const fileInputRef = useRef(null);
  const active = slides[activeIdx] || slides[0];
  const theme = THEMES[currentTheme];
  const typeCfg = theme.slideTypes[active?.type] || theme.slideTypes.content;

  const updateSlide = (field, value) =>
    setSlides(s => s.map((sl, i) => i === activeIdx ? { ...sl, [field]: value } : sl));

  const addSlide = () => {
    const next = [...slides, { title:"New Slide", content:"Key point one\nKey point two\nKey point three", type:"content", extras:[] }];
    setSlides(next); setActiveIdx(next.length - 1);
  };
  const deleteSlide = (i) => {
    if (slides.length <= 1) return;
    const next = slides.filter((_, idx) => idx !== i);
    setSlides(next); setActiveIdx(Math.min(activeIdx, next.length - 1));
  };

  // ── Rebuild table cells when size changes
  const resizeTable = (rows, cols) => {
    setTableConfig(c => ({ ...c, rows, cols }));
    setTableCells(prev => {
      const newCells = Array.from({ length: rows }, (_, ri) =>
        Array.from({ length: cols }, (_, ci) => (prev[ri]?.[ci] ?? ""))
      );
      return newCells;
    });
  };

  const insertTable = () => {
    const tableData = {
      type: "table",
      rows: tableConfig.rows, cols: tableConfig.cols,
      cells: tableCells.map(row => [...row]),
      style: tableConfig.style,
    };
    updateSlide("extras", [...(active.extras || []), tableData]);
  };

  const insertImageFromUrl = () => {
    if (!imageUrl.trim()) return;
    updateSlide("extras", [...(active.extras || []), { type:"image", src:imageUrl.trim(), caption:imageCaption }]);
    setImageUrl(""); setImageCaption("");
  };

  const insertImageFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateSlide("extras", [...(active.extras || []), { type:"image", src:ev.target.result, caption:file.name }]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const insertShape = () => {
    updateSlide("extras", [...(active.extras || []), { type:"shape", shape:selectedShape, color:selectedShapeColor, label:shapeLabel }]);
  };

  const removeExtra = (extraIdx) => {
    updateSlide("extras", active.extras.filter((_, i) => i !== extraIdx));
  };

  const applyThemeToAll = (themeKey) => {
    setCurrentTheme(themeKey);
  };

  const SLIDE_TYPE_OPTIONS = ["title","overview","content","highlight","conclusion"];

  // ── SLIDE PREVIEW ──────────────────────────────────────────────────────────────
  const SlideCanvas = ({ slide, index, total, small }) => {
    const t = THEMES[currentTheme];
    const cfg = t.slideTypes[slide.type] || t.slideTypes.content;
    const bullets = slide.content ? slide.content.split("\n").map(l=>l.replace(/^[•\-\*]\s*/,"").trim()).filter(Boolean) : [];
    const isTitle = slide.type === "title";
    const isConclusion = slide.type === "conclusion";
    const useGrid = bullets.length >= 4 && !isTitle && !isConclusion;
    const fontSize = small ? { title:"9px", body:"7px", tag:"6px" } : { title:"clamp(14px,2.6vw,22px)", body:"clamp(9px,1.5vw,13px)", tag:"9px" };
    const pad = small ? "8px 12px" : "24px 32px";
    const TAG_LABELS = { title:"TITLE SLIDE", overview:"OVERVIEW", content:"CONTENT", highlight:"KEY HIGHLIGHT", conclusion:"CONCLUSION" };
    const extras = slide.extras || [];

    return (
      <div style={{ width:"100%", height:"100%", background:cfg.bg, display:"flex", flexDirection:"column", position:"relative", overflow:"hidden", borderRadius:small?6:0 }}>
        {/* Decorative corner glows */}
        <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:cfg.accent, opacity:0.08, pointerEvents:"none" }} />
        {/* Top accent bar */}
        <div style={{ height:small?3:5, background:`linear-gradient(90deg,${cfg.accent},${cfg.accent2})`, flexShrink:0 }} />
        {/* Slide number */}
        <div style={{ position:"absolute", top:small?6:14, right:small?8:16, fontSize:small?7:9, fontFamily:"'Syne',sans-serif", fontWeight:700, color:"rgba(255,255,255,0.25)", letterSpacing:2 }}>
          {String(index+1).padStart(2,"0")} / {String(total).padStart(2,"0")}
        </div>
        {/* Body */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:pad, position:"relative", zIndex:1 }}>
          {/* Tag */}
          <div style={{ display:"inline-block", fontSize:fontSize.tag, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:small?"2px 6px":"3px 10px", borderRadius:20, background:cfg.accent+"33", border:`1px solid ${cfg.accent}55`, color:cfg.tagColor, marginBottom:small?6:10, width:"fit-content" }}>
            {TAG_LABELS[slide.type]||"CONTENT"}
          </div>
          {/* Title */}
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:isTitle?(small?"12px":"clamp(18px,3.5vw,30px)"):(small?"10px":fontSize.title), fontWeight:800, color:"#fff", lineHeight:1.2, marginBottom:small?6:10, textShadow:"0 2px 20px rgba(0,0,0,0.4)" }}>
            {slide.title}
          </div>
          {/* Divider */}
          <div style={{ width:small?20:36, height:2, borderRadius:2, background:cfg.accent, marginBottom:small?6:12 }} />
          {/* Content */}
          {useGrid && !small ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:4 }}>
              {bullets.slice(0,4).map((b,i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"8px 10px" }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, fontWeight:700, color:cfg.tagColor, marginBottom:3 }}>0{i+1}</div>
                  <div style={{ fontSize:fontSize.body, color:"rgba(255,255,255,0.8)", lineHeight:1.4 }}>{b}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:small?3:6 }}>
              {bullets.slice(0,5).map((b,i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:small?5:8 }}>
                  <div style={{ width:small?4:6, height:small?4:6, borderRadius:"50%", background:cfg.accent, flexShrink:0, marginTop:small?2:5 }} />
                  <span style={{ fontSize:fontSize.body, color:"rgba(255,255,255,0.85)", lineHeight:1.5 }}>{b}</span>
                </div>
              ))}
            </div>
          )}
          {/* Extras (table / image / shape) */}
          {!small && extras.length > 0 && (
            <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:8 }}>
              {extras.map((ex, ei) => (
                <div key={ei} style={{ position:"relative" }}>
                  {ex.type === "table" && <TablePreview tableData={ex} accent={cfg.accent} />}
                  {ex.type === "image" && (
                    <div style={{ textAlign:"center" }}>
                      <img src={ex.src} alt={ex.caption||"inserted"} style={{ maxHeight:90, maxWidth:"100%", borderRadius:6, border:`1px solid ${cfg.accent}44`, objectFit:"cover" }} onError={e=>{ e.target.style.display="none"; }} />
                      {ex.caption && <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", marginTop:3 }}>{ex.caption}</div>}
                    </div>
                  )}
                  {ex.type === "shape" && (
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <ShapeSvg type={ex.shape} color={ex.color} w={60} h={36} />
                      {ex.label && <span style={{ fontSize:"clamp(8px,1.3vw,11px)", color:"rgba(255,255,255,0.75)" }}>{ex.label}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:small?"4px 8px":"10px 32px", borderTop:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:small?6:8, fontWeight:800, color:"rgba(255,255,255,0.2)", letterSpacing:1, textTransform:"uppercase" }}>NoteAI</div>
          <div style={{ display:"flex", gap:2 }}>
            {Array.from({length:total}).map((_,i) => (
              <div key={i} style={{ width:i===index?(small?12:20):(small?8:14), height:small?1.5:2.5, borderRadius:2, background:i===index ? cfg.accent : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const panelBtnStyle = (panel) => ({
    padding:"8px 14px", borderRadius:8,
    border:`1px solid ${activePanel===panel ? "rgba(99,102,241,0.6)" : "rgba(99,102,241,0.2)"}`,
    background: activePanel===panel ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.03)",
    color: activePanel===panel ? "#a5b4fc" : "#94a3b8",
    fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
    display:"flex", alignItems:"center", gap:6,
  });

  const tabStyle = (active) => ({
    padding:"6px 14px", borderRadius:7,
    border:`1px solid ${active ? "rgba(99,102,241,0.5)" : "rgba(99,102,241,0.15)"}`,
    background: active ? "rgba(99,102,241,0.2)" : "transparent",
    color: active ? "#a5b4fc" : "#64748b",
    fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
  });

  const inputStyle = {
    width:"100%", background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(99,102,241,0.2)",
    borderRadius:8, padding:"8px 12px", color:"#e2e8f0", fontSize:13, fontFamily:"inherit",
    outline:"none", boxSizing:"border-box",
  };

  const sectionLabel = { fontSize:11, fontWeight:700, letterSpacing:".05em", textTransform:"uppercase", color:"#6366f1", marginBottom:8, display:"block" };

  return (
    <div style={{ width:"100%", maxWidth:1120, fontFamily:"'DM Sans',sans-serif", color:"#e2e8f0" }}>
      {/* ── TOP TOOLBAR ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={onBack} style={{ ...panelBtnStyle(false), border:"1px solid rgba(99,102,241,0.2)" }}>← Back</button>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#f1f5f9", margin:0 }}>🎨 Presentation Editor</h1>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button style={panelBtnStyle("design")} onClick={() => setActivePanel(p => p==="design" ? null : "design")}>
            🎨 Design
          </button>
          <button style={panelBtnStyle("insert")} onClick={() => setActivePanel(p => p==="insert" ? null : "insert")}>
            ➕ Insert
          </button>
          {onExportPdf && (
            <button onClick={onExportPdf} style={{ padding:"8px 14px", borderRadius:8, border:"1px solid rgba(225,29,72,0.35)", background:"rgba(225,29,72,0.1)", color:"#fca5a5", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>📄 PDF</button>
          )}
          {onExportPptx && (
            <button onClick={onExportPptx} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>⬇ Export .pptx</button>
          )}
        </div>
      </div>

      {/* ── DESIGN PANEL ── */}
      {activePanel === "design" && (
        <div style={{ background:"rgba(10,10,20,0.6)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:16, padding:20, marginBottom:18, backdropFilter:"blur(20px)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#f1f5f9" }}>🎨 Slide Theme</span>
            <span style={{ fontSize:11, color:"#64748b" }}>Applies to all slides</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12 }}>
            {Object.entries(THEMES).map(([key, t]) => (
              <div key={key} onClick={() => applyThemeToAll(key)} style={{
                border:`2px solid ${currentTheme===key ? "#6366f1" : "rgba(99,102,241,0.15)"}`,
                borderRadius:12, overflow:"hidden", cursor:"pointer",
                background: currentTheme===key ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.02)",
                transition:"all .2s",
              }}>
                {/* Mini slide preview using first slide style */}
                <div style={{ height:72, background:t.slideTypes.title.bg, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column" }}>
                    <div style={{ height:3, background:`linear-gradient(90deg,${t.slideTypes.title.accent},${t.slideTypes.title.accent2})` }} />
                    <div style={{ flex:1, padding:"8px 10px", display:"flex", flexDirection:"column", gap:4, justifyContent:"center" }}>
                      <div style={{ width:"70%", height:7, borderRadius:3, background:"rgba(255,255,255,0.7)" }} />
                      <div style={{ width:20, height:2, borderRadius:2, background:t.slideTypes.title.accent }} />
                      <div style={{ width:"55%", height:5, borderRadius:3, background:"rgba(255,255,255,0.35)" }} />
                      <div style={{ width:"45%", height:5, borderRadius:3, background:"rgba(255,255,255,0.25)" }} />
                    </div>
                    <div style={{ height:10, borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"flex-end", gap:2, padding:"0 6px" }}>
                      {[1,2,3].map(i => <div key={i} style={{ width:i===1?12:8, height:1.5, borderRadius:1, background:i===1?t.slideTypes.title.accent:"rgba(255,255,255,0.15)" }} />)}
                    </div>
                  </div>
                </div>
                <div style={{ padding:"8px 10px", display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:14 }}>{t.emoji}</span>
                  <span style={{ fontSize:12, fontWeight:700, color: currentTheme===key ? "#a5b4fc" : "#94a3b8" }}>{t.name}</span>
                  {currentTheme===key && <span style={{ marginLeft:"auto", fontSize:10, color:"#6366f1", fontWeight:700 }}>✓ Active</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INSERT PANEL ── */}
      {activePanel === "insert" && (
        <div style={{ background:"rgba(10,10,20,0.6)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:16, padding:20, marginBottom:18, backdropFilter:"blur(20px)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#f1f5f9" }}>➕ Insert into Slide {activeIdx + 1}</span>
          </div>
          {/* Sub-tabs */}
          <div style={{ display:"flex", gap:6, marginBottom:18 }}>
            {[["table","📊 Table"],["image","🖼️ Image"],["shape","🔷 Shape"]].map(([id,label]) => (
              <button key={id} style={tabStyle(activeInsertTab===id)} onClick={() => setActiveInsertTab(id)}>{label}</button>
            ))}
          </div>

          {/* TABLE TAB */}
          {activeInsertTab === "table" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div>
                <span style={sectionLabel}>Quick Size Presets</span>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                  {TABLE_PRESETS.map((p,i) => (
                    <button key={i} onClick={() => resizeTable(p.rows, p.cols)} style={{
                      padding:"5px 10px", borderRadius:7, fontSize:11, fontWeight:600, fontFamily:"inherit", cursor:"pointer",
                      border:`1px solid ${tableConfig.rows===p.rows&&tableConfig.cols===p.cols ? "#6366f1" : "rgba(99,102,241,0.2)"}`,
                      background: tableConfig.rows===p.rows&&tableConfig.cols===p.cols ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                      color: tableConfig.rows===p.rows&&tableConfig.cols===p.cols ? "#a5b4fc" : "#64748b",
                    }}>{p.rows}×{p.cols}</button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:12, marginBottom:14 }}>
                  <div style={{ flex:1 }}>
                    <span style={{ ...sectionLabel, marginBottom:4 }}>Rows</span>
                    <input type="number" min={1} max={10} value={tableConfig.rows} onChange={e=>resizeTable(+e.target.value||1,tableConfig.cols)} style={{ ...inputStyle, width:"100%" }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <span style={{ ...sectionLabel, marginBottom:4 }}>Columns</span>
                    <input type="number" min={1} max={8} value={tableConfig.cols} onChange={e=>resizeTable(tableConfig.rows,+e.target.value||1)} style={{ ...inputStyle, width:"100%" }} />
                  </div>
                </div>
                <span style={sectionLabel}>Table Style</span>
                <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                  {["default","striped","bordered"].map(s => (
                    <button key={s} onClick={()=>setTableConfig(c=>({...c,style:s}))} style={{
                      padding:"5px 12px", borderRadius:7, fontSize:11, fontWeight:600, fontFamily:"inherit", cursor:"pointer",
                      border:`1px solid ${tableConfig.style===s ? "#6366f1" : "rgba(99,102,241,0.2)"}`,
                      background: tableConfig.style===s ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                      color: tableConfig.style===s ? "#a5b4fc" : "#64748b",
                      textTransform:"capitalize",
                    }}>{s}</button>
                  ))}
                </div>
                <button onClick={insertTable} style={{ width:"100%", padding:"10px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                  Insert Table into Slide
                </button>
              </div>
              <div>
                <span style={sectionLabel}>Edit Cell Content</span>
                <div style={{ overflowX:"auto", maxHeight:260, overflowY:"auto" }}>
                  <table style={{ borderCollapse:"collapse", width:"100%" }}>
                    {tableCells.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding:2 }}>
                            <input
                              type="text"
                              value={cell}
                              placeholder={ri===0 ? `Header ${ci+1}` : `R${ri}C${ci+1}`}
                              onChange={e => {
                                const next = tableCells.map((r,rri) => r.map((c,cci) => rri===ri&&cci===ci ? e.target.value : c));
                                setTableCells(next);
                              }}
                              style={{ ...inputStyle, padding:"5px 7px", fontSize:11, width:"100%", minWidth:50 }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* IMAGE TAB */}
          {activeInsertTab === "image" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div>
                <span style={sectionLabel}>Upload from Device</span>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border:"2px dashed rgba(139,92,246,0.5)", borderRadius:12, padding:"28px 16px", textAlign:"center", cursor:"pointer", background:"rgba(139,92,246,0.05)", marginBottom:14, transition:"all .2s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(139,92,246,0.9)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(139,92,246,0.5)"}
                >
                  <div style={{ fontSize:26, marginBottom:6 }}>🖼️</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0", marginBottom:3 }}>Click to upload image</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>PNG · JPG · GIF · WebP</div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={insertImageFromFile} />

                <span style={sectionLabel}>Or insert from URL</span>
                <input style={{ ...inputStyle, marginBottom:8 }} placeholder="https://example.com/image.jpg" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
                <input style={{ ...inputStyle, marginBottom:10 }} placeholder="Caption (optional)" value={imageCaption} onChange={e=>setImageCaption(e.target.value)} />
                <button onClick={insertImageFromUrl} disabled={!imageUrl.trim()} style={{ width:"100%", padding:"10px", borderRadius:9, border:"none", background: imageUrl.trim() ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(99,102,241,0.2)", color: imageUrl.trim() ? "#fff" : "#64748b", fontSize:13, fontWeight:700, cursor: imageUrl.trim() ? "pointer" : "not-allowed", fontFamily:"'Syne',sans-serif" }}>
                  Insert Image from URL
                </button>
              </div>
              <div>
                <span style={sectionLabel}>Images on this slide</span>
                {(active.extras||[]).filter(e=>e.type==="image").length === 0 ? (
                  <div style={{ fontSize:12, color:"#64748b", padding:"20px 0", textAlign:"center" }}>No images inserted yet</div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {(active.extras||[]).map((ex, ei) => ex.type==="image" ? (
                      <div key={ei} style={{ display:"flex", gap:8, alignItems:"center", background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"6px 10px", border:"1px solid rgba(99,102,241,0.15)" }}>
                        <img src={ex.src} alt="" style={{ width:42, height:28, objectFit:"cover", borderRadius:4 }} onError={e=>{e.target.style.opacity=0.3;}} />
                        <div style={{ flex:1, fontSize:11, color:"#94a3b8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ex.caption||"Image"}</div>
                        <button onClick={()=>removeExtra(ei)} style={{ background:"rgba(225,29,72,0.15)", border:"1px solid rgba(225,29,72,0.3)", borderRadius:5, color:"#f87171", padding:"2px 8px", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SHAPE TAB */}
          {activeInsertTab === "shape" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div>
                <span style={sectionLabel}>Shape Type</span>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:16 }}>
                  {SHAPE_DEFS.map(sh => (
                    <button key={sh.id} onClick={()=>setSelectedShape(sh.id)} style={{
                      padding:"8px 4px", borderRadius:8, border:`1px solid ${selectedShape===sh.id?"#6366f1":"rgba(99,102,241,0.2)"}`,
                      background:selectedShape===sh.id?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.02)",
                      cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                    }}>
                      <ShapeSvg type={sh.id} color={selectedShape===sh.id?"#6366f1":"#475569"} w={36} h={22} />
                      <span style={{ fontSize:9, color:selectedShape===sh.id?"#a5b4fc":"#64748b", fontWeight:600, fontFamily:"inherit" }}>{sh.label}</span>
                    </button>
                  ))}
                </div>
                <span style={sectionLabel}>Fill Color</span>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                  {SHAPE_COLORS.map(c => (
                    <div key={c} onClick={()=>setSelectedShapeColor(c)} style={{
                      width:22, height:22, borderRadius:"50%", background:c, cursor:"pointer",
                      border:`2px solid ${selectedShapeColor===c?"#fff":"transparent"}`,
                      boxShadow:selectedShapeColor===c?"0 0 0 2px #6366f1":"none",
                    }} />
                  ))}
                </div>
                <span style={sectionLabel}>Label (optional)</span>
                <input style={{ ...inputStyle, marginBottom:12 }} placeholder="Text inside or next to shape…" value={shapeLabel} onChange={e=>setShapeLabel(e.target.value)} />
                <button onClick={insertShape} style={{ width:"100%", padding:"10px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
                  Insert Shape into Slide
                </button>
              </div>
              <div>
                <span style={sectionLabel}>Preview</span>
                <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(99,102,241,0.15)", padding:16, display:"flex", alignItems:"center", justifyContent:"center", gap:12, minHeight:80 }}>
                  <ShapeSvg type={selectedShape} color={selectedShapeColor} w={80} h={50} />
                  {shapeLabel && <span style={{ fontSize:13, color:"rgba(255,255,255,0.8)" }}>{shapeLabel}</span>}
                </div>
                <span style={{ ...sectionLabel, marginTop:16 }}>Shapes on this slide</span>
                {(active.extras||[]).filter(e=>e.type==="shape").length === 0 ? (
                  <div style={{ fontSize:12, color:"#64748b", padding:"12px 0" }}>No shapes inserted yet</div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {(active.extras||[]).map((ex, ei) => ex.type==="shape" ? (
                      <div key={ei} style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"6px 10px", border:"1px solid rgba(99,102,241,0.15)" }}>
                        <ShapeSvg type={ex.shape} color={ex.color} w={36} h={22} />
                        <span style={{ flex:1, fontSize:11, color:"#94a3b8" }}>{ex.label||SHAPE_DEFS.find(s=>s.id===ex.shape)?.label}</span>
                        <button onClick={()=>removeExtra(ei)} style={{ background:"rgba(225,29,72,0.15)", border:"1px solid rgba(225,29,72,0.3)", borderRadius:5, color:"#f87171", padding:"2px 8px", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SLIDE STRIP ── */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:10, marginBottom:16 }}>
        {slides.map((s, i) => {
          const t = THEMES[currentTheme];
          const c = t.slideTypes[s.type] || t.slideTypes.content;
          return (
            <div key={i} onClick={()=>setActiveIdx(i)} style={{
              width:120, flexShrink:0, borderRadius:8, overflow:"hidden",
              border:`2px solid ${activeIdx===i ? "#6366f1" : "rgba(99,102,241,0.15)"}`,
              cursor:"pointer", transition:"all .15s", transform:activeIdx===i?"scale(1.03)":"scale(1)",
              aspectRatio:"16/9", position:"relative",
            }}>
              <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
                <SlideCanvas slide={s} index={i} total={slides.length} small />
              </div>
              {/* Slide number overlay */}
              <div style={{ position:"absolute", bottom:3, left:5, fontSize:8, fontFamily:"'Syne',sans-serif", fontWeight:700, color:"rgba(255,255,255,0.45)", background:"rgba(0,0,0,0.3)", borderRadius:3, padding:"1px 4px" }}>
                {i+1}
              </div>
            </div>
          );
        })}
        <div onClick={addSlide} style={{ width:60, flexShrink:0, borderRadius:8, border:"2px dashed rgba(99,102,241,0.3)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(99,102,241,0.04)", aspectRatio:"16/9" }}>
          <span style={{ fontSize:20, color:"#6366f1" }}>＋</span>
        </div>
      </div>

      {/* ── MAIN EDIT AREA ── */}
      <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:20, alignItems:"start" }}>
        {/* LEFT: editor controls */}
        <div style={{ background:"rgba(10,10,20,0.5)", border:"1px solid rgba(99,102,241,0.15)", borderRadius:16, padding:20, backdropFilter:"blur(20px)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:"#f1f5f9" }}>Slide {activeIdx+1} of {slides.length}</span>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <select value={active.type} onChange={e=>updateSlide("type",e.target.value)} style={{ ...inputStyle, width:"auto", padding:"4px 8px", fontSize:12, color:typeCfg.accent, cursor:"pointer" }}>
                {SLIDE_TYPE_OPTIONS.map(t => <option key={t} value={t} style={{ background:"#0f172a" }}>{t}</option>)}
              </select>
              {slides.length > 1 && (
                <button onClick={()=>deleteSlide(activeIdx)} style={{ padding:"4px 8px", borderRadius:6, border:"1px solid rgba(225,29,72,0.3)", background:"rgba(225,29,72,0.08)", color:"#f87171", fontSize:11, cursor:"pointer" }}>🗑</button>
              )}
            </div>
          </div>

          <label style={sectionLabel}>Slide Title</label>
          <input
            style={{ ...inputStyle, fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:14 }}
            type="text" value={active.title} placeholder="Slide title…"
            onChange={e=>updateSlide("title",e.target.value)}
          />

          <label style={sectionLabel}>Content (one point per line)</label>
          <textarea
            style={{ ...inputStyle, minHeight:120, resize:"vertical", lineHeight:1.65, marginBottom:14 }}
            value={active.content} placeholder="Point one\nPoint two\nPoint three"
            onChange={e=>updateSlide("content",e.target.value)}
          />

          {/* Inserted extras summary */}
          {(active.extras||[]).length > 0 && (
            <div style={{ marginTop:4 }}>
              <label style={sectionLabel}>Inserted Elements</label>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {active.extras.map((ex, ei) => (
                  <div key={ei} style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(99,102,241,0.06)", borderRadius:7, padding:"6px 10px", border:"1px solid rgba(99,102,241,0.12)" }}>
                    <span style={{ fontSize:14 }}>{ex.type==="table"?"📊":ex.type==="image"?"🖼️":"🔷"}</span>
                    <span style={{ flex:1, fontSize:11, color:"#94a3b8" }}>
                      {ex.type==="table" ? `Table ${ex.rows}×${ex.cols}` : ex.type==="image" ? (ex.caption||"Image") : `${SHAPE_DEFS.find(s=>s.id===ex.shape)?.label||ex.shape}${ex.label?" — "+ex.label:""}`}
                    </span>
                    <button onClick={()=>removeExtra(ei)} style={{ background:"transparent", border:"none", color:"#f87171", fontSize:13, cursor:"pointer", padding:0 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop:14, padding:"10px 12px", borderRadius:9, background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.12)", fontSize:11, color:"#64748b" }}>
            💡 <strong style={{ color:"#a5b4fc" }}>Tip:</strong> 4+ bullet points auto-layout as a 2×2 grid. Use <strong style={{ color:"#a5b4fc" }}>Insert</strong> above to add tables, images, or shapes.
          </div>
        </div>

        {/* RIGHT: live preview */}
        <div>
          <div style={{ fontSize:11, color:"#64748b", fontWeight:600, textTransform:"uppercase", letterSpacing:".04em", marginBottom:8 }}>
            Live Preview — 16:9 · {THEMES[currentTheme].emoji} {THEMES[currentTheme].name} Theme
          </div>
          <div style={{ borderRadius:14, overflow:"hidden", border:`2px solid ${typeCfg.accent}55`, boxShadow:`0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${typeCfg.accent}22`, aspectRatio:"16/9", position:"relative" }}>
            <SlideCanvas slide={active} index={activeIdx} total={slides.length} small={false} />
          </div>
          {/* Quick nav */}
          <div style={{ display:"flex", gap:8, marginTop:10, justifyContent:"center" }}>
            <button onClick={()=>setActiveIdx(i=>Math.max(0,i-1))} disabled={activeIdx===0} style={{ padding:"6px 14px", borderRadius:7, border:"1px solid rgba(99,102,241,0.2)", background:"rgba(99,102,241,0.06)", color:activeIdx===0?"#374151":"#a5b4fc", fontSize:12, fontWeight:600, cursor:activeIdx===0?"not-allowed":"pointer", fontFamily:"inherit" }}>← Prev</button>
            <span style={{ padding:"6px 14px", fontSize:12, color:"#64748b" }}>{activeIdx+1} / {slides.length}</span>
            <button onClick={()=>setActiveIdx(i=>Math.min(slides.length-1,i+1))} disabled={activeIdx===slides.length-1} style={{ padding:"6px 14px", borderRadius:7, border:"1px solid rgba(99,102,241,0.2)", background:"rgba(99,102,241,0.06)", color:activeIdx===slides.length-1?"#374151":"#a5b4fc", fontSize:12, fontWeight:600, cursor:activeIdx===slides.length-1?"not-allowed":"pointer", fontFamily:"inherit" }}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}