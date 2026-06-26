import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Boxes,
  Download,
  Factory,
  FileSpreadsheet,
  Flame,
  History,
  LogIn,
  LogOut,
  Snowflake,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  APP_PASSWORD,
  FREEZERS,
  POTATOES,
  type FreezerId,
  type PotatoId,
  addMovement,
  addProduction,
  deleteMovement,
  deleteProduction,
  downloadXLSX,
  freezerTotal,
  stockFor,
  totalStock,
  useDB,
} from "@/lib/jc-store";
import { sfx } from "@/lib/jc-sounds";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "J&C Papas · Panel de Producción" },
      {
        name: "description",
        content:
          "Dashboard de inventario y rendimiento para J&C Papas: gestión de congeladores, movimientos y producción diaria.",
      },
      { property: "og:title", content: "J&C Papas · Panel de Producción" },
      {
        property: "og:description",
        content: "Inventario en tiempo real, movimientos y rendimiento de producción.",
      },
    ],
  }),
  component: Dashboard,
});

const POT_LABEL: Record<PotatoId, string> = Object.fromEntries(
  POTATOES.map((p) => [p.id, `${p.emoji} ${p.label}`]),
) as Record<PotatoId, string>;
const FRZ_LABEL: Record<FreezerId, string> = Object.fromEntries(
  FREEZERS.map((f) => [f.id, `${f.emoji} ${f.label}`]),
) as Record<FreezerId, string>;

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function fmtDateTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Dashboard() {
  const db = useDB();
  const today = new Date();
  const todayStr = today.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 backdrop-blur-xl bg-background/60 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
              style={{ background: "var(--gradient-amber)", boxShadow: "var(--shadow-glow-amber)" }}>
              🥔
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg sm:text-xl font-bold tracking-tight">
                J&amp;C Papas <span className="text-muted-foreground font-normal">· Panel</span>
              </h1>
              <p className="truncate text-xs text-muted-foreground capitalize">{todayStr}</p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 gap-1.5 border-emerald-brand/40 text-emerald-brand">
            <span className="size-1.5 rounded-full bg-emerald-brand animate-pulse" />
            En línea
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <KPISection />

        <Tabs defaultValue="movimientos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-card/60 border border-border">
            <TabsTrigger value="movimientos" className="gap-2 py-2.5">
              <Snowflake className="size-4" />
              <span className="hidden sm:inline">Movimientos</span>
            </TabsTrigger>
            <TabsTrigger value="produccion" className="gap-2 py-2.5">
              <Factory className="size-4" />
              <span className="hidden sm:inline">Producción</span>
            </TabsTrigger>
            <TabsTrigger value="inventario" className="gap-2 py-2.5">
              <BarChart3 className="size-4" />
              <span className="hidden sm:inline">Inventario</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movimientos" className="mt-6">
            <MovementForm />
          </TabsContent>
          <TabsContent value="produccion" className="mt-6">
            <ProductionForm />
          </TabsContent>
          <TabsContent value="inventario" className="mt-6 space-y-6">
            <InventoryMatrix />
            <FreezerChart />
          </TabsContent>
        </Tabs>

        <HistorySection />

        <footer className="pt-4 pb-8 text-center text-xs text-muted-foreground">
          {db.movements.length} movimientos · {db.productions.length} registros de producción
        </footer>
      </main>
    </div>
  );
}

/* ---------------- KPI ---------------- */
function KPISection() {
  const db = useDB();
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {POTATOES.map((p, i) => {
        const total = totalStock(db, p.id);
        return (
          <Card key={p.id} className="surface-card overflow-hidden relative">
            <div
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ background: "var(--gradient-amber)" }}
            />
            <CardHeader className="pb-1.5">
              <CardDescription className="flex items-center justify-between text-xs">
                <span className="truncate">{p.label}</span>
                <span className="text-base">{p.emoji}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold tabular-nums" style={{ color: "var(--amber-glow)" }}>
                {total}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">paquetes en stock</div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

/* ---------------- Movement form ---------------- */
function MovementForm() {
  const db = useDB();
  const [operario, setOperario] = useState("");
  const [freezer, setFreezer] = useState<FreezerId | "">("");
  const [potato, setPotato] = useState<PotatoId | "">("");
  const [kind, setKind] = useState<"ingreso" | "retiro">("ingreso");
  const [qty, setQty] = useState("");

  const currentStock =
    freezer && potato ? stockFor(db, freezer as FreezerId, potato as PotatoId) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(qty);
    if (!operario.trim() || !freezer || !potato || !n || n <= 0) {
      sfx.error();
      toast.error("Completa todos los campos correctamente");
      return;
    }
    if (kind === "retiro") {
      const stock = stockFor(db, freezer as FreezerId, potato as PotatoId);
      if (n > stock) {
        sfx.error();
        toast.error(`Stock insuficiente`, {
          description: `Solo hay ${stock} paquete(s) de ${POT_LABEL[potato as PotatoId]} en ${FRZ_LABEL[freezer as FreezerId]}.`,
        });
        return;
      }
    }
    addMovement({
      operario: operario.trim(),
      freezer: freezer as FreezerId,
      potato: potato as PotatoId,
      kind,
      qty: n,
    });
    if (kind === "ingreso") {
      sfx.ingreso();
      toast.success(`Ingreso registrado`, {
        description: `+${n} ${POT_LABEL[potato as PotatoId]} → ${FRZ_LABEL[freezer as FreezerId]}`,
      });
    } else {
      sfx.retiro();
      toast.success(`Retiro registrado`, {
        description: `-${n} ${POT_LABEL[potato as PotatoId]} ← ${FRZ_LABEL[freezer as FreezerId]}`,
      });
    }
    setQty("");
  }

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Snowflake className="size-5 text-emerald-brand" />
          Movimiento de Congelador
        </CardTitle>
        <CardDescription>Registra ingresos y retiros con validación de stock en tiempo real.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Operario">
            <Input
              placeholder="Nombre del operario"
              value={operario}
              onChange={(e) => setOperario(e.target.value)}
              maxLength={60}
            />
          </Field>

          <Field label="Tipo de Movimiento">
            <div className="grid grid-cols-2 gap-2">
              <ToggleBtn
                active={kind === "ingreso"}
                onClick={() => setKind("ingreso")}
                tone="emerald"
                icon={<LogIn className="size-4" />}
              >
                Ingreso
              </ToggleBtn>
              <ToggleBtn
                active={kind === "retiro"}
                onClick={() => setKind("retiro")}
                tone="amber"
                icon={<LogOut className="size-4" />}
              >
                Retiro
              </ToggleBtn>
            </div>
          </Field>

          <Field label="Congelador">
            <Select value={freezer} onValueChange={(v) => setFreezer(v as FreezerId)}>
              <SelectTrigger><SelectValue placeholder="Selecciona un congelador" /></SelectTrigger>
              <SelectContent>
                {FREEZERS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.emoji} {f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Variedad de Papa">
            <Select value={potato} onValueChange={(v) => setPotato(v as PotatoId)}>
              <SelectTrigger><SelectValue placeholder="Selecciona variedad" /></SelectTrigger>
              <SelectContent>
                {POTATOES.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.emoji} {p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Cantidad de paquetes">
            <Input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </Field>

          <div className="flex items-end">
            <div className={cn(
              "w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm",
              currentStock !== null ? "" : "text-muted-foreground"
            )}>
              {currentStock !== null ? (
                <>
                  <span className="text-muted-foreground">Stock actual: </span>
                  <span className="font-bold tabular-nums" style={{ color: "var(--amber-glow)" }}>
                    {currentStock}
                  </span>{" "}
                  paquete(s)
                </>
              ) : (
                "Selecciona congelador y variedad para ver stock"
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <Button
              type="submit"
              size="lg"
              className={cn(
                "w-full font-semibold text-base h-12",
                kind === "ingreso" ? "glow-emerald" : "glow-amber",
              )}
              style={{
                background: kind === "ingreso" ? "var(--gradient-emerald)" : "var(--gradient-amber)",
                color: "oklch(0.18 0.02 250)",
              }}
            >
              {kind === "ingreso" ? <LogIn className="size-5 mr-2" /> : <LogOut className="size-5 mr-2" />}
              Registrar {kind === "ingreso" ? "Ingreso" : "Retiro"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ---------------- Production form ---------------- */
function ProductionForm() {
  const [operario, setOperario] = useState("");
  const [potato, setPotato] = useState<PotatoId | "">("");
  const [bultos, setBultos] = useState("");
  const [paquetes, setPaquetes] = useState("");

  const now = new Date();
  const dia = DAYS[now.getDay()];
  const fecha = now.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });

  const b = Number(bultos);
  const p = Number(paquetes);
  const ratio = b > 0 && p > 0 ? (p / b).toFixed(2) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!operario.trim() || !potato || !b || b <= 0 || !p || p <= 0) {
      sfx.error();
      toast.error("Completa todos los campos correctamente");
      return;
    }
    addProduction({ operario: operario.trim(), potato: potato as PotatoId, bultos: b, paquetes: p });
    sfx.rendimiento();
    toast.success("Producción registrada", {
      description: `${p} paquetes de ${POT_LABEL[potato as PotatoId]} desde ${b} bulto(s) · ${(p / b).toFixed(2)} pq/bulto`,
    });
    setBultos("");
    setPaquetes("");
  }

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="size-5 text-emerald-brand" />
          Rendimiento de Producción Diaria
        </CardTitle>
        <CardDescription>
          {dia}, {fecha} · Calculado automáticamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Operario">
            <Input
              placeholder="Nombre del operario"
              value={operario}
              onChange={(e) => setOperario(e.target.value)}
              maxLength={60}
            />
          </Field>

          <Field label="Variedad de papa procesada">
            <Select value={potato} onValueChange={(v) => setPotato(v as PotatoId)}>
              <SelectTrigger><SelectValue placeholder="Selecciona variedad" /></SelectTrigger>
              <SelectContent>
                {POTATOES.map((pp) => (
                  <SelectItem key={pp.id} value={pp.id}>{pp.emoji} {pp.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Bultos gastados (decimal)">
            <Input
              type="number"
              min={0}
              step="0.1"
              inputMode="decimal"
              placeholder="Ej: 1.5"
              value={bultos}
              onChange={(e) => setBultos(e.target.value)}
            />
          </Field>

          <Field label="Paquetes obtenidos">
            <Input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="0"
              value={paquetes}
              onChange={(e) => setPaquetes(e.target.value)}
            />
          </Field>

          <div className="sm:col-span-2 rounded-lg border border-emerald-brand/30 bg-emerald-brand/5 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="size-4 text-emerald-brand" />
              Eficiencia estimada
            </div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--emerald-glow)" }}>
              {ratio ?? "—"}{" "}
              <span className="text-xs font-normal text-muted-foreground">pq / bulto</span>
            </div>
          </div>

          <div className="sm:col-span-2">
            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold text-base h-12 glow-emerald"
              style={{ background: "var(--gradient-emerald)", color: "oklch(0.18 0.02 250)" }}
            >
              <Sparkles className="size-5 mr-2" />
              Guardar Rendimiento
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ---------------- Inventory matrix ---------------- */
function InventoryMatrix() {
  const db = useDB();
  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Boxes className="size-5" style={{ color: "var(--amber-brand)" }} />
          Inventario por Congelador
        </CardTitle>
        <CardDescription>Existencias detalladas (paquetes)</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Congelador</TableHead>
              {POTATOES.map((p) => (
                <TableHead key={p.id} className="text-center whitespace-nowrap">
                  {p.emoji} {p.label}
                </TableHead>
              ))}
              <TableHead className="text-center">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FREEZERS.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  {f.emoji} {f.label}
                </TableCell>
                {POTATOES.map((p) => {
                  const v = stockFor(db, f.id, p.id);
                  return (
                    <TableCell key={p.id} className="text-center tabular-nums">
                      <span className={cn(v === 0 && "text-muted-foreground")}>{v}</span>
                    </TableCell>
                  );
                })}
                <TableCell className="text-center font-bold tabular-nums" style={{ color: "var(--amber-glow)" }}>
                  {freezerTotal(db, f.id)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ---------------- Chart ---------------- */
function FreezerChart() {
  const db = useDB();
  const data = useMemo(
    () =>
      FREEZERS.map((f) => {
        const row: Record<string, string | number> = { name: `${f.emoji} ${f.label.split(" ")[1] ?? f.label}` };
        POTATOES.forEach((p) => {
          row[p.label] = stockFor(db, f.id, p.id);
        });
        return row;
      }),
    [db],
  );
  const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-5 text-emerald-brand" />
          Distribución por Congelador
        </CardTitle>
        <CardDescription>Stock actual de cada variedad</CardDescription>
      </CardHeader>
      <CardContent className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
            <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} allowDecimals={false} />
            <RTooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                color: "var(--color-foreground)",
              }}
              cursor={{ fill: "var(--color-accent)", opacity: 0.4 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {POTATOES.map((p, i) => (
              <Bar key={p.id} dataKey={p.label} fill={palette[i]} radius={[6, 6, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/* ---------------- History ---------------- */
function HistorySection() {
  const db = useDB();

  function exportMov() {
    const rows = db.movements.map((m) => ({
      Fecha: fmtDateTime(m.ts),
      Operario: m.operario,
      Congelador: FRZ_LABEL[m.freezer],
      Variedad: POT_LABEL[m.potato],
      Tipo: m.kind === "ingreso" ? "Ingreso" : "Retiro",
      Cantidad: m.qty,
    }));
    downloadCSV(`movimientos_jc_papas_${Date.now()}.csv`, toCSV(rows));
    toast.success("Movimientos exportados a CSV");
  }
  function exportProd() {
    const rows = db.productions.map((p) => {
      const d = new Date(p.ts);
      return {
        Fecha: d.toLocaleDateString("es-CO"),
        Dia: DAYS[d.getDay()],
        Operario: p.operario,
        Variedad: POT_LABEL[p.potato],
        Bultos: p.bultos,
        Paquetes: p.paquetes,
        "Paquetes_por_Bulto": (p.paquetes / p.bultos).toFixed(2),
      };
    });
    downloadCSV(`produccion_jc_papas_${Date.now()}.csv`, toCSV(rows));
    toast.success("Producción exportada a CSV");
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card className="surface-card">
        <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <History className="size-5" style={{ color: "var(--amber-brand)" }} />
              Últimos movimientos
            </CardTitle>
            <CardDescription>Historial de congeladores</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportMov} disabled={!db.movements.length}>
            <Download className="size-4 mr-1.5" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {db.movements.length === 0 ? (
            <EmptyState text="Sin movimientos aún" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Operario</TableHead>
                  <TableHead>Congelador</TableHead>
                  <TableHead>Variedad</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {db.movements.slice(0, 10).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {fmtDateTime(m.ts)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{m.operario}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{FRZ_LABEL[m.freezer]}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{POT_LABEL[m.potato]}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          m.kind === "ingreso" ? "text-emerald-brand" : "text-amber-brand",
                        )}
                        style={{
                          color:
                            m.kind === "ingreso"
                              ? "var(--emerald-glow)"
                              : "var(--amber-glow)",
                        }}
                      >
                        {m.kind === "ingreso" ? "+" : "−"}
                        {m.qty}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-5 text-emerald-brand" />
              Histórico de rendimiento
            </CardTitle>
            <CardDescription>Eficiencia diaria</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportProd} disabled={!db.productions.length}>
            <Download className="size-4 mr-1.5" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {db.productions.length === 0 ? (
            <EmptyState text="Sin registros de producción" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Día</TableHead>
                  <TableHead>Operario</TableHead>
                  <TableHead>Variedad</TableHead>
                  <TableHead className="text-right">Bultos</TableHead>
                  <TableHead className="text-right">Paquetes</TableHead>
                  <TableHead className="text-right">Pq/Bulto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {db.productions.slice(0, 10).map((p) => {
                  const d = new Date(p.ts);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {d.toLocaleDateString("es-CO")}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{DAYS[d.getDay()]}</TableCell>
                      <TableCell className="whitespace-nowrap">{p.operario}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{POT_LABEL[p.potato]}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.bultos}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.paquetes}</TableCell>
                      <TableCell
                        className="text-right tabular-nums font-bold"
                        style={{ color: "var(--emerald-glow)" }}
                      >
                        {(p.paquetes / p.bultos).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

/* ---------------- helpers ---------------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
  icon,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
  tone: "amber" | "emerald";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border h-10 text-sm font-medium transition-all",
        active
          ? "border-transparent text-background"
          : "border-border bg-muted/30 text-foreground hover:bg-muted/60",
      )}
      style={
        active
          ? {
              background:
                tone === "emerald" ? "var(--gradient-emerald)" : "var(--gradient-amber)",
              boxShadow:
                tone === "emerald" ? "var(--shadow-glow-emerald)" : "var(--shadow-glow-amber)",
              color: "oklch(0.18 0.02 250)",
            }
          : undefined
      }
    >
      {icon}
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-10 text-center text-sm text-muted-foreground">
      <Boxes className="size-8 mx-auto mb-2 opacity-40" />
      {text}
    </div>
  );
}
