"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Glasses, Printer, ReceiptText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type Frame = "redGreen" | "navy" | "orange" | "pof";
type SaleType = "pof" | "complete";
type Lens = "core" | "strong" | "clear";
type Channel = "insurance" | "inStore";
type Insurance = "vsp" | "eyemed" | "misc";
type ExamType = "glasses" | "contacts" | "combo";
type ExamMode = "only" | "withPurchase";

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
  core: { redGreen: 250, navy: 275, orange: 350, pof: 200 },
  strong: { redGreen: 300, navy: 325, orange: 400, pof: 250 },
  clear: { redGreen: 400, navy: 425, orange: 500, pof: 350 },
};
const insuranceLensRetail: Record<Lens, number> = { core: 300, strong: 400, clear: 600 };
const insuranceNames: Record<Insurance, string> = { vsp: "VSP", eyemed: "EyeMed", misc: "Misc" };
const exams: Record<ExamType, { name: string; retail: number; withPurchase: number }> = {
  glasses: { name: "Glasses", retail: 75, withPurchase: 40 },
  contacts: { name: "Contacts", retail: 95, withPurchase: 60 },
  combo: { name: "Combo", retail: 170, withPurchase: 100 },
};
const modifiers = [
  { id: "standard", name: "Remove Anti-Reflective", price: -75, group: "VISION" },
  { id: "shift", name: "Shift™", price: 90, group: "VISION" },
  { id: "multifocal", name: "Multifocal", price: 50, group: "VISION" },
  { id: "mirror", name: "Mirror / Solid Tint", price: 50, group: "STYLE" },
  { id: "flash", name: "Flash Mirror / Gradient Tint", price: 100, group: "STYLE" },
  { id: "drill", name: "Drill Mount", price: 50, group: "STYLE" },
  { id: "bevel", name: "Step Bevel", price: 50, group: "STYLE" },
  { id: "rush", name: "Same Day / Rush", price: 25, group: "CONVENIENCE" },
  { id: "shipping", name: "Shipping", price: 25, group: "CONVENIENCE" },
] as const;

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 }).format(value);
const expectedArrivalDate = (saleDate = new Date()) => {
  const date = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate(), 12);
  while (date.getDay() !== 3 && date.getDay() !== 5) date.setDate(date.getDate() + 1);
  let laterMailDays = 0;
  while (laterMailDays < 2) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() === 3 || date.getDay() === 5) laterMailDays += 1;
  }
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
};

function ChoiceCard({ active, title, detail, price, onClick, accent }: { active: boolean; title: string; detail?: string; price?: string; onClick: () => void; accent?: string }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`choice-card ${active ? "choice-card-active" : ""}`}>
    {accent && <span className={`choice-accent choice-${accent}`} aria-hidden="true" />}
    <span className="choice-copy"><strong>{title}</strong>{detail && <small>{detail}</small>}</span>
    {price && <span className="choice-price">{price}</span>}
    {active && <Check className="choice-check" aria-hidden="true" />}
  </button>;
}

function ModifierGrid({ selected, onToggle, multiplier = 1, insurancePrimary = false, secondPair = false }: { selected: string[]; onToggle: (id: string) => void; multiplier?: number; insurancePrimary?: boolean; secondPair?: boolean }) {
  return <div className="modifier-groups">
    {["VISION", "STYLE", "CONVENIENCE"].map((group) => {
      const options = modifiers.filter((item) => item.group === group);
      return <fieldset className="modifier-group" key={group}><legend>{group}</legend>
        {options.map((item) => {
          const displayPrice = secondPair ? (item.id === "standard" ? 150 : item.price * 2) * 0.35 : insurancePrimary && item.id === "standard" ? 150 : item.price * multiplier;
          const displayName = item.id === "standard" && (insurancePrimary || secondPair) ? "Anti-Reflective" : item.name;
          return <label className="modifier-row" key={item.id}>
            <Checkbox checked={selected.includes(item.id)} onCheckedChange={() => onToggle(item.id)} className="modifier-check" />
            <span>{displayName}</span>{(!secondPair || selected.includes(item.id)) && <strong className={displayPrice < 0 ? "discount" : ""}>{displayPrice > 0 ? "+ " : "- "}{money(Math.abs(displayPrice))}</strong>}
          </label>;
        })}
      </fieldset>;
    })}
  </div>;
}

export default function Home() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [insurance, setInsurance] = useState<Insurance | null>(null);
  const [insuranceApplied, setInsuranceApplied] = useState(false);
  const [wantsExam, setWantsExam] = useState<boolean | null>(null);
  const [examMode, setExamMode] = useState<ExamMode | null>(null);
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [saleType, setSaleType] = useState<SaleType | null>(null);
  const [lens, setLens] = useState<Lens | null>(null);
  const [wantsModifiers, setWantsModifiers] = useState<boolean | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [wantsAdditional, setWantsAdditional] = useState<boolean | null>(null);
  const [additionalFrame, setAdditionalFrame] = useState<Frame | null>(null);
  const [additionalLens, setAdditionalLens] = useState<Lens | null>(null);
  const [additionalModifiers, setAdditionalModifiers] = useState<string[]>([]);

  const basePrice = useMemo(() => {
    if (!frame || !channel) return 0;
    if (channel === "insurance") return frames[frame].retail + (lens ? insuranceLensRetail[lens] : 0);
    if (!saleType) return 0;
    return saleType === "pof" ? frames[frame].retail / 2 : lens ? completePrices[lens][frame] : 0;
  }, [frame, channel, saleType, lens]);
  const modifierTotal = useMemo(() => modifiers.filter((item) => selectedModifiers.includes(item.id)).reduce((sum, item) => sum + (channel === "insurance" ? item.id === "standard" ? 150 : item.price * 2 : item.price), 0), [selectedModifiers, channel]);
  const additionalModifierTotal = useMemo(() => modifiers.filter((item) => additionalModifiers.includes(item.id)).reduce((sum, item) => sum + (item.id === "standard" ? 150 * 0.35 : item.price * 2 * 0.35), 0), [additionalModifiers]);
  const additionalComplete = Boolean(wantsAdditional && additionalFrame && additionalLens);
  const additionalFramePrice = wantsAdditional && additionalFrame ? frames[additionalFrame].retail * 0.35 : 0;
  const additionalLensPrice = additionalComplete && additionalLens ? insuranceLensRetail[additionalLens] * 0.35 : 0;
  const additionalBase = additionalComplete ? additionalLensPrice + additionalFramePrice : 0;
  const examPrice = wantsExam && examMode && examType ? exams[examType][examMode === "only" ? "retail" : "withPurchase"] : 0;
  const retailFirstPair = basePrice + modifierTotal;
  const insuranceFactor = insurance === "vsp" ? 0.35 : 0.45;
  const firstPairTotal = channel === "insurance" && insuranceApplied && frame ? frames[frame].retail + (retailFirstPair - frames[frame].retail) * insuranceFactor : retailFirstPair;
  const total = examPrice + firstPairTotal + additionalBase + (additionalComplete ? additionalModifierTotal : 0);
  const examDiscount = examMode === "withPurchase" && examType ? exams[examType].retail - exams[examType].withPurchase : 0;
  const firstPairRetailValue = channel === "insurance"
    ? retailFirstPair
    : saleType === "pof" && frame
      ? frames[frame].retail + modifierTotal
      : saleType === "complete" && frame && lens
        ? frames[frame].retail + insuranceLensRetail[lens] + modifierTotal
        : firstPairTotal;
  const firstPairDiscount = Math.max(0, firstPairRetailValue - firstPairTotal);
  const additionalRetailValue = additionalComplete && additionalFrame && additionalLens
    ? frames[additionalFrame].retail + insuranceLensRetail[additionalLens] + modifiers.filter((item) => additionalModifiers.includes(item.id)).reduce((sum, item) => sum + (item.id === "standard" ? 150 : item.price * 2), 0)
    : 0;
  const additionalDiscount = Math.max(0, additionalRetailValue - (additionalBase + (additionalComplete ? additionalModifierTotal : 0)));
  const totalDiscount = examDiscount + firstPairDiscount + additionalDiscount;
  const examComplete = wantsExam === false || Boolean(wantsExam && examMode && examType);
  const examOnly = Boolean(wantsExam && examMode === "only" && examType);
  const purchaseFlow = wantsExam === false || Boolean(wantsExam && examMode === "withPurchase" && examType);
  const readyForModifiers = channel === "insurance" ? Boolean(frame && insurance && lens) : Boolean(frame && saleType && (saleType === "pof" || lens));
  const readyForAdditional = readyForModifiers && wantsModifiers !== null && (channel !== "insurance" || insuranceApplied);
  const canPrint = examOnly || (examComplete && purchaseFlow && (channel === "insurance" ? Boolean(insuranceApplied && frame && lens) : Boolean(readyForModifiers && wantsModifiers !== null)));

  const toggle = (id: string, current: string[], setter: (value: string[]) => void) => setter(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const selectSaleType = (next: SaleType) => {
    setSaleType(next); setWantsModifiers(null); setSelectedModifiers([]); setWantsAdditional(null); setAdditionalFrame(null); setAdditionalLens(null); setAdditionalModifiers([]);
    if (next === "pof") setLens(null);
  };
  const selectChannel = (next: Channel) => {
    setChannel(next); setInsurance(null); setInsuranceApplied(false); setWantsExam(null); setExamMode(null); setExamType(null); setFrame(null); setSaleType(null); setLens(null); setWantsModifiers(null); setSelectedModifiers([]); setWantsAdditional(null); setAdditionalFrame(null); setAdditionalLens(null); setAdditionalModifiers([]);
  };
  const invalidateInsurance = () => { setInsuranceApplied(false); setWantsAdditional(null); setAdditionalFrame(null); setAdditionalLens(null); setAdditionalModifiers([]); };
  const reset = () => {
    setChannel(null); setInsurance(null); setInsuranceApplied(false); setWantsExam(null); setExamMode(null); setExamType(null); setFrame(null); setSaleType(null); setLens(null); setWantsModifiers(null); setSelectedModifiers([]); setWantsAdditional(null); setAdditionalFrame(null); setAdditionalLens(null); setAdditionalModifiers([]);
  };

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
        {channel && (channel === "inStore" || insurance) && <section className="step-card reveal"><div className="step-heading"><span>1</span><div><h2>Exam?</h2><p>Add an exam to this quote before selecting the frame.</p></div></div><div className="yes-no">
          <button type="button" className={wantsExam === false ? "active" : ""} onClick={() => { setWantsExam(false); setExamMode(null); setExamType(null); invalidateInsurance(); }}>No</button>
          <button type="button" className={wantsExam === true ? "active" : ""} onClick={() => { setWantsExam(true); invalidateInsurance(); }}>Yes</button>
        </div>{wantsExam && <><div className="choice-grid two lenses compact">
          <ChoiceCard active={examMode === "only"} title="EXAM ONLY" detail="Use the full retail exam price" onClick={() => { setExamMode("only"); setExamType(null); setFrame(null); setSaleType(null); setLens(null); invalidateInsurance(); }} />
          <ChoiceCard active={examMode === "withPurchase"} title="WITH PURCHASE" detail="Use the discounted exam price" onClick={() => { setExamMode("withPurchase"); setExamType(null); invalidateInsurance(); }} />
        </div>{examMode && <div className="choice-grid three lenses compact">
          {(Object.keys(exams) as ExamType[]).map((id) => <ChoiceCard key={id} active={examType === id} title={exams[id].name} price={money(exams[id][examMode === "only" ? "retail" : "withPurchase"])} onClick={() => { setExamType(id); invalidateInsurance(); }} />)}
        </div>}</>}</section>}
        {channel && (channel === "inStore" || insurance) && purchaseFlow && <section className="step-card reveal"><div className="step-heading"><span>2</span><div><h2>Select the frame collection</h2><p>{channel === "insurance" ? "Insurance retail frame price." : "Retail price shown for reference."}</p></div></div><div className="choice-grid three">
          {(Object.keys(frames) as Frame[]).map((id) => <ChoiceCard key={id} active={frame === id} title={frames[id].name} detail={id === "pof" ? channel === "inStore" ? "Patient's own frame · $50 off complete pair" : "Patient's own frame" : `${money(frames[id].retail)} retail`} accent={frames[id].accent} onClick={() => { setFrame(id); invalidateInsurance(); if (channel === "inStore" && id === "pof") selectSaleType("complete"); }} />)}
        </div></section>}
        {channel === "inStore" && frame && frame !== "pof" && <section className="step-card reveal"><div className="step-heading"><span>3</span><div><h2>What type of sale?</h2><p>Choose POF pricing or a complete pair.</p></div></div><div className="choice-grid two">
          <ChoiceCard active={saleType === "pof"} title="POF" detail="50% of frame retail" price={money(frames[frame].retail / 2)} onClick={() => selectSaleType("pof")} />
          <ChoiceCard active={saleType === "complete"} title="COMPLETE SALE" detail="Frame + complete lenses" onClick={() => selectSaleType("complete")} />
        </div></section>}
        {((channel === "inStore" && saleType === "complete") || (channel === "insurance" && frame)) && <section className="step-card reveal"><div className="step-heading"><span>{channel === "insurance" ? "3" : "4"}</span><div><h2>Select the complete-pair package</h2><p>{channel === "insurance" ? "Retail includes the frame and doubled in-house lens price." : "Pricing includes the selected frame collection."}</p></div></div><div className="choice-grid three lenses">
          {(Object.keys(lenses) as Lens[]).map((id) => <ChoiceCard key={id} active={lens === id} title={lenses[id].name} detail={lenses[id].note} price={frame ? money(channel === "insurance" ? frames[frame].retail + insuranceLensRetail[id] : completePrices[id][frame]) : undefined} onClick={() => { setLens(id); invalidateInsurance(); }} />)}
        </div></section>}
        {readyForModifiers && <section className="step-card reveal"><div className="step-heading"><span>{channel === "insurance" ? "4" : saleType === "complete" ? "5" : "4"}</span><div><h2>Any modifiers?</h2><p>{channel === "insurance" ? "First-pair modifiers use insurance retail pricing." : "Each selected modifier changes the running total."}</p></div></div><div className="yes-no">
          <button type="button" className={wantsModifiers === false ? "active" : ""} onClick={() => { setWantsModifiers(false); setSelectedModifiers([]); invalidateInsurance(); }}>No modifiers</button>
          <button type="button" className={wantsModifiers === true ? "active" : ""} onClick={() => { setWantsModifiers(true); invalidateInsurance(); }}>Yes, select modifiers</button>
        </div>{wantsModifiers && <ModifierGrid selected={selectedModifiers} multiplier={channel === "insurance" ? 2 : 1} insurancePrimary={channel === "insurance"} onToggle={(id) => { toggle(id, selectedModifiers, setSelectedModifiers); invalidateInsurance(); }} />}</section>}
        {channel === "insurance" && readyForModifiers && wantsModifiers !== null && <section className="step-card reveal"><div className="step-heading"><span>5</span><div><h2>Apply insurance</h2><p>Confirm the first-pair retail selections before adding another pair.</p></div></div><div className="insurance-apply"><div><span>Retail submitted</span><strong>{money(retailFirstPair)}</strong></div><button type="button" className={insuranceApplied ? "applied" : ""} onClick={() => setInsuranceApplied(true)}>{insuranceApplied ? "Insurance Applied" : "Apply Insurance"}</button></div></section>}
        {readyForAdditional && <section className="step-card reveal"><div className="step-heading"><span>{channel === "insurance" ? "6" : saleType === "complete" ? "6" : "5"}</span><div><h2>Add another complete pair?</h2><p>Same prescription required. Modifiers still apply.</p></div></div><div className="yes-no">
          <button type="button" className={wantsAdditional === false ? "active" : ""} onClick={() => { setWantsAdditional(false); setAdditionalFrame(null); setAdditionalLens(null); setAdditionalModifiers([]); }}>No additional pair</button>
          <button type="button" className={wantsAdditional === true ? "active" : ""} onClick={() => { setWantsAdditional(true); setAdditionalFrame(null); setAdditionalLens(null); }}>Yes, add a pair</button>
        </div>{wantsAdditional && <div className="additional-panel"><h3>Additional-pair frame</h3><p className="included-note">Select an option to show its final 65%-off price.</p><div className="choice-grid three lenses compact">
          {(Object.keys(frames) as Frame[]).map((id) => <ChoiceCard key={id} active={additionalFrame === id} title={frames[id].name} detail={id === "pof" ? "Patient's own frame" : "Second-pair frame"} price={additionalFrame === id ? money(frames[id].retail * 0.35) : undefined} onClick={() => setAdditionalFrame(id)} />)}
        </div><h3>Additional-pair lens package</h3><p className="included-note">Select an option to show its final 65%-off price.</p><div className="choice-grid three lenses compact">
          {(Object.keys(lenses) as Lens[]).map((id) => <ChoiceCard key={id} active={additionalLens === id} title={lenses[id].name} price={additionalLens === id ? money(insuranceLensRetail[id] * 0.35) : undefined} onClick={() => setAdditionalLens(id)} />)}
        </div><div className="additional-modifiers-title"><h3>Additional-pair modifiers</h3><p>Discounted prices appear after selection.</p></div><ModifierGrid selected={additionalModifiers} secondPair onToggle={(id) => toggle(id, additionalModifiers, setAdditionalModifiers)} /></div>}</section>}
      </section>
      <aside className="quote-card" aria-live="polite"><div className="quote-title"><ReceiptText aria-hidden="true" /><div><span>RUNNING QUOTE</span><strong>Sale Summary</strong></div></div><div className="summary-lines">
        {!channel && <div className="empty-summary"><Glasses /><p>Choose Insurance or In-Store to begin.</p></div>}
        {channel && <div className="summary-row"><span>Sale source</span><strong>{channel === "insurance" ? insurance ? insuranceNames[insurance] : "Insurance" : "In-Store"}</strong></div>}
        {wantsExam === false && <div className="summary-row"><span>Exam</span><strong>No</strong></div>}
        {wantsExam && examMode && examType && <div className="summary-row"><span>{exams[examType].name} exam · {examMode === "only" ? "Exam Only" : "With Purchase"}</span><strong>{money(examPrice)}</strong></div>}
        {frame && <div className="summary-row"><span>Frame collection</span><strong>{frames[frame].name}</strong></div>}
        {channel === "insurance" && frame && <div className="summary-row"><span>Frame charge</span><strong>{money(frames[frame].retail)}</strong></div>}
        {channel === "inStore" && saleType && <div className="summary-row"><span>{saleType === "pof" ? "POF sale" : lens ? lenses[lens].name : "Complete sale"}</span><strong>{basePrice ? money(basePrice) : "—"}</strong></div>}
        {channel === "insurance" && lens && <div className="summary-row"><span>{insuranceApplied ? "Adjusted lenses / modifiers" : "Retail lenses / modifiers"}</span><strong>{money(firstPairTotal - frames[frame!].retail)}</strong></div>}
        {channel === "inStore" && selectedModifiers.map((id) => { const item = modifiers.find((option) => option.id === id)!; return <div className="summary-row modifier-summary" key={id}><span>{item.name}</span><strong>{item.price >= 0 ? "+" : "-"}{money(Math.abs(item.price))}</strong></div>; })}
        {wantsAdditional && additionalFrame && additionalLens && <><div className="summary-divider" /><div className="summary-row"><span>Additional frame: {frames[additionalFrame].name}</span><strong>{money(additionalFramePrice)}</strong></div><div className="summary-row"><span>Additional {lenses[additionalLens].name}</span><strong>{money(additionalLensPrice)}</strong></div></>}
        {additionalComplete && additionalModifiers.map((id) => { const item = modifiers.find((option) => option.id === id)!; const price = item.id === "standard" ? 150 * 0.35 : item.price * 2 * 0.35; return <div className="summary-row modifier-summary" key={`additional-${id}`}><span>Additional: {item.id === "standard" ? "Anti-Reflective" : item.name}</span><strong>{price >= 0 ? "+" : "-"}{money(Math.abs(price))}</strong></div>; })}
      </div><div className="total-row"><span>TOTAL</span><strong>{money(total)}</strong></div><Button className="copy-button" onClick={() => window.print()} disabled={!canPrint}><Printer />Print / Save PDF</Button><p className="quote-footnote">Every complete pair includes premium anti-reflective, scratch resistance, UV protection, and standard warranty unless modified.</p><div className="next-cue"><span>Complete each visible step</span><ChevronRight /></div></aside>
    </div>
    <section className="print-quote" aria-label="Printable sales quote">
      <header className="print-header"><div className="print-brand"><Glasses aria-hidden="true" /><div><strong>THAT EYE PLACE</strong><span>Sales Quote</span></div></div><div className="print-date">Prepared {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div></header>
      <div className="print-meta"><div><span>Pricing</span><strong>{channel === "insurance" ? insurance ? insuranceNames[insurance] : "Insurance" : "In-Store"}</strong></div><div><span>Frame collection</span><strong>{frame ? frames[frame].name : "—"}</strong></div></div>
      <div className="print-arrival"><span>EXPECTED ARRIVAL DATE:</span><strong>{expectedArrivalDate()}</strong></div>
      {examOnly && examType && <section className="print-section"><h2>Exam</h2><div className="print-line"><span>{exams[examType].name} exam — Exam Only</span><strong>{money(examPrice)}</strong></div></section>}
      {!examOnly && <section className="print-section"><h2>First Pair</h2>
        {channel === "insurance" && frame && <div className="print-line print-math"><span>Frame — {frames[frame].name}<small>{money(frames[frame].retail)} retail − {money(0)} discount</small></span><strong>{money(frames[frame].retail)}</strong></div>}
        {channel === "insurance" && lens && <div className="print-line print-math"><span>{lenses[lens].name} lenses<small>{money(insuranceLensRetail[lens])} retail − {money(insuranceLensRetail[lens] * (1 - insuranceFactor))} insurance discount</small></span><strong>{money(insuranceLensRetail[lens] * (insuranceApplied ? insuranceFactor : 1))}</strong></div>}
        {channel === "inStore" && saleType === "pof" && frame && <div className="print-line print-math"><span>POF sale — {frames[frame].name}<small>{money(frames[frame].retail)} retail − {money(frames[frame].retail - basePrice)} discount</small></span><strong>{money(basePrice)}</strong></div>}
        {channel === "inStore" && saleType === "complete" && frame && lens && <><div className="print-line"><span>Frame retail — {frames[frame].name}</span><strong>{money(frames[frame].retail)}</strong></div><div className="print-line"><span>Lens retail — {lenses[lens].name}</span><strong>{money(insuranceLensRetail[lens])}</strong></div><div className="print-line print-discount"><span>Complete-pair package discount</span><strong>−{money(frames[frame].retail + insuranceLensRetail[lens] - basePrice)}</strong></div><div className="print-line"><span>Complete-pair charge</span><strong>{money(basePrice)}</strong></div></>}
        {selectedModifiers.map((id) => { const item = modifiers.find((option) => option.id === id)!; const retail = channel === "insurance" ? item.id === "standard" ? 150 : item.price * 2 : item.price; const price = channel === "insurance" && insuranceApplied ? retail * insuranceFactor : retail; const discount = channel === "insurance" ? retail - price : 0; const name = channel === "insurance" && item.id === "standard" ? "Anti-Reflective" : item.name; return <div className={`print-line print-option ${channel === "insurance" ? "print-math" : ""}`} key={`print-${id}`}><span>{name}{channel === "insurance" && <small>{money(retail)} retail − {money(discount)} insurance discount</small>}</span><strong>{price >= 0 ? "+" : "-"}{money(Math.abs(price))}</strong></div>; })}
        <div className="print-subtotal"><span>First-pair total</span><strong>{money(firstPairTotal)}</strong></div>
      </section>}
      {examMode === "withPurchase" && examType && <section className="print-section"><h2>Exam Added After Purchase Pricing</h2><div className="print-line print-math"><span>{exams[examType].name} exam — With Purchase<small>{money(exams[examType].retail)} retail − {money(examDiscount)} purchase discount</small></span><strong>{money(examPrice)}</strong></div></section>}
      {additionalComplete && additionalFrame && additionalLens && <section className="print-section"><h2>Additional Pair</h2>
        <div className="print-line print-math"><span>Frame — {frames[additionalFrame].name}<small>{money(frames[additionalFrame].retail)} retail − {money(frames[additionalFrame].retail - additionalFramePrice)} discount</small></span><strong>{money(additionalFramePrice)}</strong></div>
        <div className="print-line print-math"><span>{lenses[additionalLens].name} lenses<small>{money(insuranceLensRetail[additionalLens])} retail − {money(insuranceLensRetail[additionalLens] - additionalLensPrice)} discount</small></span><strong>{money(additionalLensPrice)}</strong></div>
        {additionalModifiers.map((id) => { const item = modifiers.find((option) => option.id === id)!; const retail = item.id === "standard" ? 150 : item.price * 2; const price = retail * 0.35; return <div className="print-line print-option print-math" key={`print-additional-${id}`}><span>{item.id === "standard" ? "Anti-Reflective" : item.name}<small>{money(retail)} retail − {money(retail - price)} discount</small></span><strong>{price >= 0 ? "+" : "-"}{money(Math.abs(price))}</strong></div>; })}
        <div className="print-subtotal"><span>Additional-pair total</span><strong>{money(additionalBase + additionalModifierTotal)}</strong></div><p className="print-note">Same prescription required. Modifiers still apply.</p>
      </section>}
      <div className="print-total"><span>TOTAL</span><strong>{money(total)}</strong></div>
      <div className="print-total-discount"><span>TOTAL DISCOUNT</span><strong>{money(totalDiscount)}</strong></div>
      <footer className="print-footer"><strong>Complete-pair benefits</strong><p>Premium anti-reflective, scratch resistance, UV protection, and standard warranty are included unless modified.</p><div className="print-signatures"><span>Customer approval</span><span>Date</span></div></footer>
    </section>
  </main>;
}
