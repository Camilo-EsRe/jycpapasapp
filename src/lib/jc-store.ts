import { useEffect, useState } from "react";

export const FREEZERS = [
  { id: "artico", label: "Congelador Ártico", emoji: "❄️" },
  { id: "glacial", label: "Congelador Glacial", emoji: "🏔️" },
  { id: "siberia", label: "Congelador Siberia", emoji: "🌌" },
] as const;

export const POTATOES = [
  { id: "francesa_normal", label: "Francesa Normal", emoji: "🍟" },
  { id: "francesa_gruesa_sc", label: "Francesa Gruesa s/Cáscara", emoji: "🍟" },
  { id: "francesa_gruesa_cc", label: "Francesa Gruesa c/Cáscara", emoji: "🍟" },
  { id: "cascos", label: "Cascos", emoji: "🥔" },
] as const;

export type FreezerId = (typeof FREEZERS)[number]["id"];
export type PotatoId = (typeof POTATOES)[number]["id"];

export type Movement = {
  id: string;
  ts: number;
  operario: string;
  freezer: FreezerId;
  potato: PotatoId;
  kind: "ingreso" | "retiro";
  qty: number;
};

export type Production = {
  id: string;
  ts: number;
  operario: string;
  potato: PotatoId;
  bultos: number;
  paquetes: number;
};

type DB = { movements: Movement[]; productions: Production[] };
const KEY = "jc-papas-db-v1";

function load(): DB {
  if (typeof window === "undefined") return { movements: [], productions: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { movements: [], productions: [] };
}
function save(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {}
}

const listeners = new Set<() => void>();
let cache: DB | null = null;
function getDB(): DB {
  if (!cache) cache = load();
  return cache;
}
function setDB(next: DB) {
  cache = next;
  save(next);
  listeners.forEach((l) => l());
}

export function useDB() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    // Hydrate after mount
    cache = load();
    fn();
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return getDB();
}

export function addMovement(m: Omit<Movement, "id" | "ts">) {
  const db = getDB();
  setDB({ ...db, movements: [{ ...m, id: crypto.randomUUID(), ts: Date.now() }, ...db.movements] });
}
export function addProduction(p: Omit<Production, "id" | "ts">) {
  const db = getDB();
  setDB({ ...db, productions: [{ ...p, id: crypto.randomUUID(), ts: Date.now() }, ...db.productions] });
}
export function deleteMovement(id: string) {
  const db = getDB();
  setDB({ ...db, movements: db.movements.filter((m) => m.id !== id) });
}
export function deleteProduction(id: string) {
  const db = getDB();
  setDB({ ...db, productions: db.productions.filter((p) => p.id !== id) });
}

export const APP_PASSWORD = "NOLOSABRAN";


export function stockFor(db: DB, freezer: FreezerId, potato: PotatoId): number {
  return db.movements.reduce((sum, m) => {
    if (m.freezer !== freezer || m.potato !== potato) return sum;
    return sum + (m.kind === "ingreso" ? m.qty : -m.qty);
  }, 0);
}
export function totalStock(db: DB, potato: PotatoId): number {
  return FREEZERS.reduce((s, f) => s + stockFor(db, f.id, potato), 0);
}
export function freezerTotal(db: DB, freezer: FreezerId): number {
  return POTATOES.reduce((s, p) => s + stockFor(db, freezer, p.id), 0);
}

export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export function downloadCSV(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
