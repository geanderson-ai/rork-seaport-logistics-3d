import { ChevronDown, MapPin } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PORTS, portForPath } from "@/data/ports";

export function PortSelector() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = portForPath(pathname);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Select port, currently ${active.name}`}
        className="flex h-10 max-w-[230px] items-center gap-2 rounded-full border border-hairline bg-paper px-2.5 text-[12px] font-semibold text-ink hover:bg-sand sm:px-3"
      >
        <MapPin className="h-3.5 w-3.5 shrink-0 text-signal" aria-hidden="true" />
        <span className="truncate">{active.name}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-slate">Select port</DropdownMenuLabel>
        {PORTS.map((port) => (
          <DropdownMenuItem
            key={port.id}
            onSelect={() => navigate(port.path)}
            className="flex cursor-pointer items-center justify-between gap-3 py-2"
          >
            <span className="min-w-0">
              <span className="block font-semibold">{port.name}</span>
              <span className="block text-[11px] text-slate">{port.location} · {port.mode}</span>
            </span>
            {active.id === port.id && <span className="shrink-0 text-[11px] font-medium text-moss">Viewing</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
