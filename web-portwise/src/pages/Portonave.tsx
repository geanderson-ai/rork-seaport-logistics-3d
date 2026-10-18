import { Anchor, ArrowRight, Container, MapPin, Ship, Workflow } from "lucide-react";
import { Link } from "react-router-dom";
import { PortSelector } from "@/components/PortSelector";

const FACTS = [
  { label: "Quay", value: "900 m", icon: Anchor },
  { label: "Berths", value: "3", icon: Ship },
  { label: "Annual capacity", value: "1.5M TEU", icon: Container },
];

export default function Portonave() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-paper px-4 py-3 sm:px-8">
        <Link to="/" className="flex items-center gap-2 font-extrabold">
          <img src="/icon.png" alt="" className="h-8 w-8 rounded-[9px]" />
          Portwise
        </Link>
        <PortSelector />
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-16">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-hairline bg-paper px-3 py-1.5 text-xs font-semibold text-slate">
          <MapPin className="h-3.5 w-3.5 text-signal" /> Navegantes, Santa Catarina · Brazil
        </div>
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">Portonave</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate">
          A new digital twin location for the Portonave terminal, Navegantes Airport and their surrounding territory.
          The local 3D scene and operational data are being prepared.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {FACTS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-hairline bg-paper p-5">
              <Icon className="h-5 w-5 text-signal" aria-hidden="true" />
              <p className="mt-4 text-3xl font-bold">{value}</p>
              <p className="mt-1 text-sm text-slate">{label}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 grid gap-6 rounded-2xl border border-hairline bg-paper p-6 md:grid-cols-[1fr_1.2fr] md:p-8">
          <div>
            <Workflow className="h-6 w-6 text-signal" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-bold">Twin workspace</h2>
            <p className="mt-3 leading-relaxed text-slate">
              The next layer will connect a georeferenced scene to identified berths, cranes, yard blocks and events.
              Scenario results will be shown here with their source and simulation status.
            </p>
          </div>
          <div className="rounded-xl border border-dashed border-hairline bg-canvas p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-signal">In preparation</p>
            <ol className="mt-4 space-y-4 text-sm text-ink">
              <li>01 · Build the port and airport territory from verified geographic data</li>
              <li>02 · Import optimized models from Blender with stable asset IDs</li>
              <li>03 · Add reproducible ship, crane, yard and gate scenarios</li>
              <li>04 · Validate observations and operational metrics before live integration</li>
            </ol>
          </div>
        </section>

        <p className="mt-6 text-sm text-slate">
          Public infrastructure reference: <a className="underline hover:text-ink" href="https://www.portonave.com.br/pt/infraestrutura" target="_blank" rel="noreferrer">Portonave infrastructure</a>.
          Figures describe published capacity, not a live feed. The Singapore simulation is a separate fictional scenario.
        </p>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-signal hover:underline">
          Open the Singapore demo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
