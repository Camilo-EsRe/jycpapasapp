import { useEffect, useState, type ReactNode } from "react";
import { Lock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AUTH_KEY = "jc-papas-auth-v1";
const USERNAME = "JYCPAPAS";
const PASSWORD = "AlexelAragan";

export function useAuth() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      setAuthed(localStorage.getItem(AUTH_KEY) === "1");
    } catch {}
    setReady(true);
  }, []);
  const login = (u: string, p: string) => {
    if (u.trim() === USERNAME && p === PASSWORD) {
      try { localStorage.setItem(AUTH_KEY, "1"); } catch {}
      setAuthed(true);
      return true;
    }
    return false;
  };
  const logout = () => {
    try { localStorage.removeItem(AUTH_KEY); } catch {}
    setAuthed(false);
  };
  return { authed, ready, login, logout };
}

export function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onLogout} className="gap-1.5">
      <LogOut className="size-4" />
      <span className="hidden sm:inline">Salir</span>
    </Button>
  );
}

export function LoginGate({ children }: { children: ReactNode }) {
  const { authed, ready, login, logout } = useAuth();
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  if (!ready) return null;

  if (!authed) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <Card className="w-full max-w-sm border-border/60">
          <CardHeader className="text-center space-y-2">
            <div
              className="mx-auto grid h-12 w-12 place-items-center rounded-xl text-2xl"
              style={{ background: "var(--gradient-amber)", boxShadow: "var(--shadow-glow-amber)" }}
            >
              🥔
            </div>
            <CardTitle className="text-xl">J&amp;C Papas · Ingreso</CardTitle>
            <CardDescription className="flex items-center justify-center gap-1.5">
              <Lock className="size-3.5" /> Acceso privado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!login(u, p)) {
                  toast.error("Usuario o contraseña incorrectos");
                  setP("");
                } else {
                  toast.success("Bienvenido");
                }
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="user">Usuario</Label>
                <Input
                  id="user"
                  autoFocus
                  autoComplete="username"
                  value={u}
                  onChange={(e) => setU(e.target.value)}
                  placeholder="Usuario"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pass">Contraseña</Label>
                <Input
                  id="pass"
                  type="password"
                  autoComplete="current-password"
                  value={p}
                  onChange={(e) => setP(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full">
                Ingresar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-40">
        <LogoutButton onLogout={logout} />
      </div>
    </>
  );
}
