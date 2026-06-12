"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
        signal: controller.signal,
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Error al iniciar sesión");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setError("El inicio de sesión tardó demasiado. Intenta de nuevo.");
      } else {
        setError("No se pudo conectar con el servidor");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#f8f6f3] px-4">
      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[var(--brand-primary)] opacity-[0.15] blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[var(--brand-secondary)] opacity-[0.08] blur-[120px]"
      />

      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-primary)] shadow-[0_8px_30px_rgba(210,255,30,0.35)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2c2c2c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#2c2c2c]">
            CRM Inmobiliario
          </h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-[#d9e9dd] bg-white/90 p-8 shadow-[0_20px_60px_rgba(20,16,35,0.1)] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6b7280]"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@empresa.com"
                className="h-12 w-full rounded-2xl border border-[#d9e9dd] bg-[#f8f6f3] px-4 text-sm text-[#2c2c2c] outline-none placeholder:text-[#6b7280]/60 transition focus:border-[var(--brand-secondary)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-secondary)]/10"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6b7280]"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-2xl border border-[#d9e9dd] bg-[#f8f6f3] px-4 pr-12 text-sm text-[#2c2c2c] outline-none placeholder:text-[#6b7280]/60 transition focus:border-[var(--brand-secondary)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-secondary)]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#6b7280] transition hover:text-[#2c2c2c]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#2c2c2c] text-sm font-semibold tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1a1a1a] hover:shadow-md active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando sesión…
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[#6b7280]">
          Acceso restringido · Solo personal autorizado
        </p>
      </div>
    </main>
  );
}
