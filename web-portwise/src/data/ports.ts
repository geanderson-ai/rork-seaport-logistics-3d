export const PORTS = [
  {
    id: "singapore",
    name: "Pasir Panjang Terminal",
    location: "Singapore",
    path: "/",
    mode: "Interactive simulation",
  },
  {
    id: "portonave",
    name: "Portonave",
    location: "Navegantes, Brazil",
    path: "/portonave",
    mode: "Digital twin in preparation",
  },
] as const;

export type PortId = (typeof PORTS)[number]["id"];

export function portForPath(pathname: string) {
  return pathname === "/portonave" ? PORTS[1] : PORTS[0];
}
