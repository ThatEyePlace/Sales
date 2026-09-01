"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Clipboard, Glasses, ReceiptText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type Frame = "redGreen" | "navy" | "orange" | "pof";
type SaleType = "pof" | "complete";
type Lens = "core" | "strong" | "clear";
type Channel = "insurance" | "inStore";
type Insurance = "vsp" | "eyemed" | "misc";

const frames: Record<Frame, { name: string; retail: number; accent: string }> = {
  redGreen: { name: "RED / GREEN", retail: 100, accent: "split" },
  navy: { name: "NAVY", retail: 150, accent: "navy" },
  orange: { name: "ORANGE", retail: 300, accent: "orange" },
  pof: { name: "POF", retail: 0, accent: "" },
};
const lenses: Record<Lens, { name: string; note: string; additional: number }> = {
  core: { name: "clear&CORE™", note: "Rx power 3.00 or less", additional: 149 },
  strong: { name: "thin&STRONG™", note: "Rx powers up to 5.00 or safety use", additional: 179 },
  clear: { name: "thin&CLEAR™", note: "Rx powers over 5.00", additional: 249 },
};
const completePrices: Record<Lens, Record<Frame, number>> = {
  core: { redGreen: 250, navy: 275, orange: 350, pof: 150 },
  strong: { redGreen: 300, navy: 325, orange: 400, pof: 200 },
  clear: { redGreen: 400, navy: 425, orange: 500, pof: 300 },
};
const insuranceLensRetail: Record<Lens, number> = { core: 300, strong: 400, clear: 600 };
const insuranceNames: Record<Insurance, string> = { vsp: "VSP", eyemed: "EyeMed", misc: "Misc" };
const modifiers = [
  { id: "standard", name: "Standard Finish (No AR)", price: -75, group: "VISION" },
  { id: "pof", name: "POF", price: -50, group: "VISION" },
  { id: "shift", name: "Shift™", price: 90, group: "VISION" },
  { id: "multifocal", name: "Multifocal", price: 50, group: "VISION" },
  { id: "mirror", name: "Mirror / Solid Tint", price: 50, group: "STYLE" },
  { id: "flash", name: "Flash Mirror / Gradient Tint", price: 100, group: "STYLE" },
  { id: "drill", name: "Drill Mount", price: 50, group: "STYLE" },
  { id: "bevel", name: "Step Bevel", price: 50, group: "STYLE" },
  { id: "rush", name: "Same Day / Rush", price: 25, group: "CONVENIENCE" },
  { id: "shipping", name: "Shipping", price: 25, group: "CONVENIENCE" },
] as const;

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

function ChoiceCard({ active, title, detail, price, onClick, accent }: { active: boolean; title: string; detail?: string; price?: string; onClick: () => void; accent?: string }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`choice-card ${active ? "choice-card-active" : ""}`}>
    {accent && <span className={`choice-accent choice-${accent}`} aria-hidden="true" />}
    <span className="choice-copy"><strong>{title}</strong>{detail && <small>{detail}</small>}</span>
    {price && <span className="choice-price">{price}</span>}
    {active && <Check className="choice-check" aria-hidden="true" />}
  </button>;
}

function ModifierGrid({ selected, onToggle, hidePof = false, multiplier = 1, insurancePrimary = false, secondPair = false }: { selected: string[]; onToggle: (id: string) => void; hidePof?: boolean; multiplier?: number; insurancePrimary?: boolean; secondPair?: boolean }) {
  return <div className="modifier-groups">
    {["VISION", "STYLE", "CONVENIENCE"].map((group) => {
      const options = modifiers.filter((item) => item.group === group && !(hidePof && item.id === "pof"));
      return <fieldset className="modifier-group" key={group}><legend>{group}</legend>
        {options.map((item) => {
          const displayPrice = item.id === "standard" && secondPair ? 75 : insurancePrimary && item.id === "standard" ? 150 : item.price * multiplier;
          const displayName = item.id === "standard" && (insurancePrimary || secondPair) ? "Anti-Reflective" : item.name;
          return <label className="modifier-row" key={item.id}>
            <Checkbox checked={selected.includes(item.id)} onCheckedChange={() => onToggle(item.id)} className="modifier-check" />
            <span>{displayName}</span><strong className={displayPrice < 0 ? "discount" : ""}>{displayPrice > 0 ? "+ " : "- "}{money(Math.abs(displayPrice))}</strong>
          </label>;
        })}
        {group === "VISION" && hidePof && <p className="included-note">POF pricing is already applied to this sale.</p>}
      </fieldset>;
    })}
  </div>;
}

export default function Home() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [insurance, setInsurance] = useState<Insurance | null>(null);
  const [insuranceApplied, setInsuranceApplied] = useState(false);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [saleType, setSaleType] = useState<SaleType | null>(null);
  const [lens, setLens] = useState<Lens | null>(null);
  const [wantsModifiers, setWantsModifiers] = useState<boolean | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [wantsAdditional, setWantsAdditional] = useState<boolean | null>(null);
  const [additionalFrame, setAdditionalFrame] = useState<Frame | null>(null);
  const [additionalLens, setAdditionalLens] = useState<Lens | null>(null);
  const [additionalModifiers, setAdditionalModifiers] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const basePrice = useMemo(() => {
    if (!frame || !channel) return 0;
    if (channel === "insurance") return lens ? frames[frame].retail + insuranceLensRetail[lens] : 0;
    if (!saleType) return 0;
    return saleType === "pof" ? frames[frame].retail / 2 : lens ? completePrices[lens][frame] : 0;
  }, [frame, channel, saleType, lens]);
  const modifierTotal = useMemo(() => modifiers.filter((item) => selectedModifiers.includes(item.id)).reduce((sum, item) => sum + (channel === "insurance" ? item.id === "standard" ? 150 : item.price * 2 : item.price), 0), [selectedModifiers, channel]);
  const additionalModifierTotal = useMemo(() => modifiers.filter((item) => additionalModifiers.includes(item.id) && item.id !== "pof").reduce((sum, item) => sum + (item.id === "standard" ? 75 : item.price), 0), [additionalModifiers]);
  const additionalComplete = Boolean(wantsAdditional && additionalFrame && additionalLens);
  const additionalFramePrice = wantsAdditional && additionalFrame ? frames[additionalFrame].retail / 2 : 0;
  const additionalBase = additionalComplete && additionalLens ? lenses[additionalLens].additional + additionalFramePrice : 0;
  const retailFirstPair = basePrice + modifierTotal;
  const insuranceFactor = insurance === "vsp" ? 0.35 : 0.45;
  const firstPairTotal = channel === "insurance" && insuranceApplied && frame ? frames[frame].retail + (retailFirstPair - frames[frame].retail) * insuranceFactor : retailFirstPair;
  const total = firstPairTotal + additionalBase + (additionalComplete ? additionalModifierTotal : 0);
  const readyForModifiers = channel === "insurance" ? Boolean(frame && insurance && lens) : Boolean(frame && saleType && (saleType === "pof" || lens));
  const readyForAdditional = readyForModifiers && wantsModifiers !== null && (channel !== "insurance" || insuranceApplied);

  const toggle = (id: string, current: string[], setter: (value: string[]) => void) => setter(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const selectSaleType = (next: SaleType) => {
    setSaleType(next); setWantsModifiers(null); setSelectedModifiers([]); setWantsAdditional(null); setAdditionalFrame(null); setAdditionalLens(null); setAdditionalModifiers([]);
    if (next === "pof") setLens(null);
  };
  const selectChannel = (next: Channel) => {
    setChannel(next); setInsurance(null); setInsuranceApplied(false); setFrame(null); setSaleType(null); setLens(null); setWantsModifiers(null); setSelectedModifiers([]); setWantsAdditional(null); setAdditionalFrame(null); setAdditionalLens(null); setAdditionalModifiers([]);
  };
  const invalidateInsurance = () => { setInsuranceApplied(false); setWantsAdditional(null); setAdditionalFrame(null); setAdditionalLens(null); setAdditionalModifiers([]); };
  const reset = () => {
    setChannel(null); setInsurance(null); setInsuranceApplied(false); setFrame(null); setSaleType(null); setLens(null); setWantsModifiers(null); setSelectedModifiers([]); setWantsAdditional(null); setAdditionalFrame(null); setAdditionalLens(null); setAdditionalModifiers([]); setCopied(false);
  };

  const quoteLines = useMemo(() => {
    const lines: string[] = ["THAT EYE PLACE — SALES QUOTE"];
    if (channel) lines.push(`Sale source: ${channel === "insurance" ? "Insurance" : "In-Store"}`);
    if (insurance) lines.push(`Insurance: ${insuranceNames[insurance]}`);
    if (frame) lines.push(`Frame: ${frames[frame].name}`);
    if (channel === "insurance" && lens) lines.push(`Insurance-adjusted first pair — ${lenses[lens].name}: ${money(firstPairTotal)}`);
    if (channel === "inStore" && saleType === "pof") lines.push(`POF sale: ${money(basePrice)}`);
    if (channel === "inStore" && saleType === "complete" && lens) lines.push(`Complete pair — ${lenses[lens].name}: ${money(basePrice)}`);
    if (channel === "inStore") selectedModifiers.forEach((id) => { const item = modifiers.find((option) => option.id === id); if (item) lines.push(`${item.name}: ${item.price >= 0 ? "+" : "-"}${money(Math.abs(item.price))}`); });
    if (wantsAdditional && additionalFrame && additionalLens) {
      lines.push(`Additional pair frame — ${frames[additionalFrame].name}: ${money(additionalFramePrice)}`);
      lines.push(`Additional pair lenses — ${lenses[additionalLens].name}: ${money(lenses[additionalLens].additional)}`);
      additionalModifiers.forEach((id) => { const item = modifiers.find((option) => option.id === id); if (item && item.id !== "pof") { const price = item.id === "standard" ? 75 : item.price; lines.push(`Additional pair ${item.id === "standard" ? "Anti-Reflective" : item.name}: ${price >= 0 ? "+" : "-"}${money(Math.abs(price))}`); } });
      lines.push("Additional pair requires the same prescription.");
    }
    lines.push(`TOTAL: ${money(total)}`); return lines;
  }, [channel, insurance, frame, saleType, lens, basePrice, firstPairTotal, selectedModifiers, wantsAdditional, additionalFrame, additionalFramePrice, additionalLens, additionalModifiers, total]);

  const copyQuote = async () => { await navigator.clipboard.writeText(quoteLines.join("\n")); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };

  return <main>
    <header className="topbar"><div className="brand"><div className="brand-mark"><Glasses aria-hidden="true" /></div><div><span>THAT EYE PLACE</span><strong>Sales Pricing</strong></div></div><Button variant="outline" onClick={reset} className="reset-button"><RotateCcw /> Start Over</Button></header>
    <div className="app-shell">
      <section className="calculator" aria-label="Sales pricing calculator">
        <div className="intro"><p>QUICK QUOTE</p><h1>Build the sale. See the price.</h1><span>Select each step and the total updates automatically.</span></div>
        <section className="step-card"><div className="step-heading"><div><h2>How is this sale being priced?</h2><p>Choose insurance or the standard in-store price list.</p></div></div><div className="choice-grid two">
          <ChoiceCard active={channel === "insurance"} title="INSURANCE" detail="VSP, EyeMed, or Misc" onClick={() => selectChannel("insurance")} />
          <ChoiceCard active={channel === "inStore"} title="IN-STORE" detail="Use the current in-house pricing" onClick={() => selectChannel("inStore")} />
        </div></section>
        {channel === "insurance" && <section className="step-card reveal"><div className="step-heading"><div><h2>Select the insurance</h2><p>The plan adjustment is applied after the first pair is built.</p></div></div><div className="choice-grid three">
          {(Object.keys(insuranceNames) as Insurance[]).map((id) => <ChoiceCard key={id} active={insurance === id} title={insuranceNames[id]} onClick={() => { setInsurance(id); invalidateInsurance(); }} />)}
        </div></section>}
        {channel && (channel === "inStore" || insurance) && <section className="step-card reveal"><div className="step-heading"><span>1</span><div><h2>Select the frame collection</h2><p>{channel === "insurance" ? "Insurance retail frame price." : "Retail price shown for reference."}</p></div></div><div className="choice-grid three">
          {(Object.keys(frames) as Frame[]).filter((id) => channel === "insurance" || id !== "pof").map((id) => <ChoiceCard key={id} active={frame === id} title={frames[id].name} detail={id === "pof" ? "Patient's own frame" : `${money(frames[id].retail)} retail`} accent={frames[id].accent} onClick={() => { setFrame(id); invalidateInsurance(); }} />)}
        </div></section>}
        {channel === "inStore" && frame && <section className="step-card reveal"><div className="step-heading"><span>2</span><div><h2>What type of sale?</h2><p>Choose POF pricing or a complete pair.</p></div></div><div className="choice-grid two">
          <ChoiceCard active={saleType === "pof"} title="POF" detail="50% of frame retail" price={money(frames[frame].retail / 2)} onClick={() => selectSaleType("pof")} />
          <ChoiceCard active={saleType === "complete"} title="COMPLETE SALE" detail="Frame + complete lenses" onClick={() => selectSaleType("complete")} />
        </div></section>}
        {((channel === "inStore" && saleType === "complete") || (channel === "insurance" && frame)) && <section className="step-card reveal"><div className="step-heading"><span>{channel === "insurance" ? "2" : "3"}</span><div><h2>Select the complete-pair package</h2><p>{channel === "insurance" ? "Retail includes the frame and doubled in-house lens price." : "Pricing includes the selected frame collection."}</p></div></div><div className="choice-grid three lenses">
          {(Object.keys(lenses) as Lens[]).map((id) => <ChoiceCard key={id} active={lens === id} title={lenses[id].name} detail={lenses[id].note} price={frame ? money(channel === "insurance" ? frames[frame].retail + insuranceLensRetail[id] : completePrices[id][frame]) : undefined} onClick={() => { setLens(id); invalidateInsurance(); }} />)}
        </div></section>}
        {readyForModifiers && <section className="step-card reveal"><div className="step-heading"><span>{channel === "insurance" ? "3" : saleType === "complete" ? "4" : "3"}</span><div><h2>Any modifiers?</h2><p>{channel === "insurance" ? "First-pair modifiers use insurance retail pricing." : "Each selected modifier changes the running total."}</p></div></div><div className="yes-no">
          <button type="button" className={wantsModifiers === false ? "active" : ""} onClick={() => { setWantsModifiers(false); setSelectedModifiers([]); invalidateInsurance(); }}>No modifiers</button>
          <button type="button" className={wantsModifiers === true ? "active" : ""} onClick={() => { setWantsModifiers(true); invalidateInsurance(); }}>Yes, select modifiers</button>
        </div>{wantsModifiers && <ModifierGrid selected={selectedModifiers} hidePof={channel === "insurance" || saleType === "pof"} multiplier={channel === "insurance" ? 2 : 1} insurancePrimary={channel === "insurance"} onToggle={(id) => { toggle(id, selectedModifiers, setSelectedModifiers); invalidateInsurance(); }} />}</section>}
        {channel === "insurance" && readyForModifiers && wantsModifiers !== null && <section className="step-card reveal"><div className="step-heading"><span>4</span><div><h2>Apply insurance</h2><p>Confirm the first-pair retail selections before adding another pair.</p></div></div><div className="insurance-apply"><div><span>Retail submitted</span><strong>{money(retailFirstPair)}</strong></div><button type="button" className={insuranceApplied ? "applied" : ""} onClick={() => setInsuranceApplied(true)}>{insuranceApplied ? "Insurance Applied" : "Apply Insurance"}</button></div></section>}
        {readyForAdditional && <section className="step-card reveal"><div className="step-heading"><span>{channel === "insurance" ? "5" : saleType === "complete" ? "5" : "4"}</span><div><h2>Add another complete pair?</h2><p>Same prescription required. Modifiers still apply.</p></div></div><div className="yes-no">
          <button type="button" className={wantsAdditional === false ? "active" : ""} onClick={() => { setWantsAdditional(false); setAdditionalFrame(null); setAdditionalLens(null); setAdditionalModifiers([]); }}>No additional pair</button>
          <button type="button" className={wantsAdditional === true ? "active" : ""} onClick={() => { setWantsAdditional(true); setAdditionalFrame(null); setAdditionalLens(lens ?? "core"); }}>Yes, add a pair</button>
        </div>{wantsAdditional && <div className="additional-panel"><h3>Additional-pair frame</h3><div className="choice-grid three lenses compact">
          {(Object.keys(frames) as Frame[]).map((id) => <ChoiceCard key={id} active={additionalFrame === id} title={frames[id].name} detail={id === "pof" ? "Patient's own frame" : "50% of retail"} price={money(frames[id].retail / 2)} onClick={() => setAdditionalFrame(id)} />)}
        </div><h3>Additional-pair lens package</h3><div className="choice-grid three lenses compact">
          {(Object.keys(lenses) as Lens[]).map((id) => <ChoiceCard key={id} active={additionalLens === id} title={lenses[id].name} price={money(lenses[id].additional)} onClick={() => setAdditionalLens(id)} />)}
        </div><div className="additional-modifiers-title"><h3>Additional-pair modifiers</h3><p>Select only what applies to this pair.</p></div><ModifierGrid selected={additionalModifiers} hidePof secondPair onToggle={(id) => toggle(id, additionalModifiers, setAdditionalModifiers)} /></div>}</section>}
      </section>
      <aside className="quote-card" aria-live="polite"><div className="quote-title"><ReceiptText aria-hidden="true" /><div><span>RUNNING QUOTE</span><strong>Sale Summary</strong></div></div><div className="summary-lines">
        {!frame && <div className="empty-summary"><Glasses /><p>Start by selecting a frame collection.</p></div>}
        {channel && <div className="summary-row"><span>Sale source</span><strong>{channel === "insurance" ? insurance ? insuranceNames[insurance] : "Insurance" : "In-Store"}</strong></div>}
        {frame && <div className="summary-row"><span>Frame collection</span><strong>{frames[frame].name}</strong></div>}
        {channel === "inStore" && saleType && <div className="summary-row"><span>{saleType === "pof" ? "POF sale" : lens ? lenses[lens].name : "Complete sale"}</span><strong>{basePrice ? money(basePrice) : "—"}</strong></div>}
        {channel === "insurance" && lens && <div className="summary-row"><span>{insuranceApplied ? "Insurance price" : "Retail first pair"}</span><strong>{money(firstPairTotal)}</strong></div>}
        {channel === "inStore" && selectedModifiers.map((id) => { const item = modifiers.find((option) => option.id === id)!; return <div className="summary-row modifier-summary" key={id}><span>{item.name}</span><strong>{item.price >= 0 ? "+" : "-"}{money(Math.abs(item.price))}</strong></div>; })}
        {wantsAdditional && additionalFrame && additionalLens && <><div className="summary-divider" /><div className="summary-row"><span>Additional frame: {frames[additionalFrame].name}</span><strong>{money(additionalFramePrice)}</strong></div><div className="summary-row"><span>Additional {lenses[additionalLens].name}</span><strong>{money(lenses[additionalLens].additional)}</strong></div></>}
        {additionalComplete && additionalModifiers.filter((id) => id !== "pof").map((id) => { const item = modifiers.find((option) => option.id === id)!; const price = item.id === "standard" ? 75 : item.price; return <div className="summary-row modifier-summary" key={`additional-${id}`}><span>Additional: {item.id === "standard" ? "Anti-Reflective" : item.name}</span><strong>{price >= 0 ? "+" : "-"}{money(Math.abs(price))}</strong></div>; })}
      </div><div className="total-row"><span>TOTAL</span><strong>{money(total)}</strong></div><Button className="copy-button" onClick={copyQuote} disabled={!frame}>{copied ? <Check /> : <Clipboard />}{copied ? "Copied" : "Copy Quote"}</Button><p className="quote-footnote">Every complete pair includes premium anti-reflective, scratch resistance, UV protection, and standard warranty unless modified.</p><div className="next-cue"><span>Complete each visible step</span><ChevronRight /></div></aside>
    </div>
  </main>;
}
