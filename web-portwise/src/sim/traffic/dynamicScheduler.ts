import type { BerthBooking, Vessel } from "@/data/types";
import { BERTH_COUNT, BERTH_SCHEDULE, VESSELS, vesselById } from "@/data/port";
import { AIS_STATIC, type ShipStaticData } from "@/sim/ais/static";
import { registerDynamicAisDef } from "@/sim/ais/tracker";
import { PORT_CALLS, type PortCall } from "@/sim/ais/portCalls";
import { buildVoyage } from "@/sim/ais/voyage";
import { berthX, SHIP_Z } from "@/data/layout";
import { fmtClock } from "@/sim/constants";
import { toast } from "sonner";

export interface CandidateVessel {
  name: string;
  short: string;
  line: string;
  flag: string;
  from: string;
  to: string;
  hull: string;
  length: number;
}

const CANDIDATE_POOL: CandidateVessel[] = [
  { name: "MV CAP SAN NICOLAS", short: "CAP SAN NICOLAS", line: "Hamburg Süd", flag: "Liberia", from: "Santos", to: "Rotterdam", hull: "#B5463A", length: 42 },
  { name: "MV MAERSK ITAJAI", short: "MAERSK ITAJAI", line: "Maersk", flag: "Denmark", from: "Itajaí", to: "Port Klang", hull: "#4F6D8F", length: 40 },
  { name: "MV CMA CGM JACQUES SAADE", short: "CMA CGM SAADE", line: "CMA CGM", flag: "France", from: "Singapore", to: "Le Havre", hull: "#1E3A66", length: 44 },
  { name: "MV MSC BRASIL", short: "MSC BRASIL", line: "MSC", flag: "Panama", from: "Paranaguá", to: "Valencia", hull: "#D9B26A", length: 38 },
  { name: "MV ALIANCA VERA CRUZ", short: "ALIANCA VERA CRUZ", line: "Aliança", flag: "Brazil", from: "Santos", to: "Buenos Aires", hull: "#2F5D4E", length: 36 },
  { name: "MV ONE STORK", short: "ONE STORK", line: "ONE", flag: "Japan", from: "Tokyo", to: "Singapore", hull: "#FF66B2", length: 42 },
  { name: "MV RIO DE JANEIRO EXPRESS", short: "RIO DE JANEIRO EXP", line: "Hapag-Lloyd", flag: "Germany", from: "Rio de Janeiro", to: "Hamburg", hull: "#F2622E", length: 40 },
  { name: "MV LOG-IN POLARIS", short: "LOG-IN POLARIS", line: "Log-In", flag: "Brazil", from: "Navegantes", to: "Santos", hull: "#2C6FB0", length: 32 },
  { name: "MV EVER GIVEN", short: "EVER GIVEN", line: "Evergreen", flag: "Panama", from: "Taipei", to: "Rotterdam", hull: "#4E7A5A", length: 44 },
  { name: "MV COSCO TAURUS", short: "COSCO TAURUS", line: "COSCO", flag: "Hong Kong", from: "Shanghai", to: "Singapore", hull: "#1E3A66", length: 42 },
];

let candidateIndex = 0;
let nextImo = 9912000;
let nextMmsi = 563990000;

function nextCandidate(): CandidateVessel {
  const c = CANDIDATE_POOL[candidateIndex % CANDIDATE_POOL.length];
  candidateIndex++;
  return c;
}

/** Finds empty slots across all berths within the rolling 24h window and adds incoming vessels. */
export function scheduleUpcomingVessels(currentHour: number, horizonHours = 24): Vessel[] {
  const added: Vessel[] = [];

  for (let berth = 1; berth <= BERTH_COUNT; berth++) {
    const bookings = BERTH_SCHEDULE.filter((b) => b.berth === berth).sort((a, b) => a.start - b.start);
    const lastBooking = bookings[bookings.length - 1];
    const lastEnd = lastBooking ? lastBooking.end : 0;

    // Se o berço ficar vago dentro do horizonte das próximas 24h:
    if (lastEnd < currentHour + horizonHours) {
      const startHour = Math.max(lastEnd + 1.0, currentHour + 1.5);
      const duration = 6.0 + (berth % 3) * 1.5; // Entre 6h e 9h de operação
      const endHour = startHour + duration;

      const candidate = nextCandidate();
      const id = `dyn-${candidate.short.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.floor(startHour)}`;

      if (vesselById(id)) continue;

      const etaHour = Math.max(0, startHour - 0.75);
      const isTomorrow = endHour >= 24;
      const endClock = fmtClock((endHour % 24) * 3600);
      const etdLabel = isTomorrow ? `${endClock} (+1)` : endClock;

      const newVessel: Vessel = {
        id,
        name: candidate.name,
        short: candidate.short,
        imo: String(nextImo++),
        line: candidate.line,
        flag: candidate.flag,
        voyage: `${candidate.short.slice(0, 2).toUpperCase()}${berth}-2601`,
        from: candidate.from,
        to: candidate.to,
        berth,
        status: "scheduled",
        dischargeTotal: 600 + (berth * 80),
        discharged: 0,
        loadTotal: 550 + (berth * 70),
        loaded: 0,
        eta: fmtClock(etaHour * 3600),
        etb: fmtClock(startHour * 3600),
        etd: etdLabel,
        cranes: [`STS-0${Math.min(14, berth * 2 - 1)}`, `STS-0${Math.min(14, berth * 2)}`],
        hull: candidate.hull,
        length: candidate.length,
        inScene: false,
      };

      // Registrar no catálogo de navios
      VESSELS.push(newVessel);
      added.push(newVessel);

      // Registrar na grade de agendamento de berços
      BERTH_SCHEDULE.push({
        berth,
        label: candidate.short,
        vesselId: id,
        start: Number(startHour.toFixed(2)),
        end: Number(endHour.toFixed(2)),
        kind: "planned",
      });

      // Registrar metadados de AIS
      AIS_STATIC[id] = {
        mmsi: nextMmsi++,
        callSign: `9V${candidate.short.slice(0, 3).toUpperCase()}`,
        shipType: 70,
        dimension: { A: Math.round(candidate.length * 3 * 0.8), B: Math.round(candidate.length * 3 * 0.2), C: 12, D: 12 },
        draught: 8.5,
        destination: "SGSIN",
        cls: "container",
      };

      // Registrar no AIS Tracker
      registerDynamicAisDef({
        id,
        name: newVessel.name,
        short: newVessel.short,
        static: AIS_STATIC[id],
        role: "call",
        berth,
        berthHeading: 90,
        moving: false,
        truth: (t, out) => {
          out.x = berthX(berth);
          out.z = SHIP_Z;
          out.heading = 90;
          out.status = 5; // Moored
          return out;
        },
        statusChanges: [],
      });
    }
  }

  return added;
}

/** Permite que sistemas externos (WebSocket AISStream, TOS Portonave) injetem um navio manualmente. */
export function injectExternalVessel(vessel: Vessel, booking: BerthBooking, portCallSpec?: PortCall): void {
  if (vesselById(vessel.id)) return;

  VESSELS.push(vessel);
  BERTH_SCHEDULE.push(booking);

  AIS_STATIC[vessel.id] = {
    mmsi: Number(vessel.imo) || nextMmsi++,
    callSign: `9V${vessel.short.slice(0, 3).toUpperCase()}`,
    shipType: 70,
    dimension: { A: Math.round(vessel.length * 3 * 0.8), B: Math.round(vessel.length * 3 * 0.2), C: 12, D: 12 },
    draught: 8.5,
    destination: "SGSIN",
    cls: "container",
  };

  if (portCallSpec) {
    PORT_CALLS.push(portCallSpec);
  }

  toast.info(`Novo navio adicionado à escala: ${vessel.name}`, {
    description: `Berço ${vessel.berth} · ETB ${vessel.etb} · ${vessel.line}`,
  });
}
