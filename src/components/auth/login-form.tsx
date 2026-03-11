"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  TrendingUp,
  CreditCard,
  PieChart,
  LayoutDashboard,
  Target,
  Wallet,
  BarChart3,
  Receipt,
  LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { useTheme } from "@/contexts";

interface BouncingIcon {
  Icon: LucideIcon;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// Ícones animados com física de rebote
function BackgroundIcons() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [icons, setIcons] = useState<BouncingIcon[]>([]);
  const animationRef = useRef<number | null>(null);

  const iconConfigs = [
    { Icon: TrendingUp, size: 32 },
    { Icon: CreditCard, size: 28 },
    { Icon: PieChart, size: 26 },
    { Icon: LayoutDashboard, size: 30 },
    { Icon: Target, size: 28 },
    { Icon: Wallet, size: 26 },
    { Icon: BarChart3, size: 24 },
    { Icon: Receipt, size: 22 },
  ];

  // Inicializa os ícones com posições e velocidades aleatórias
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();

    const initialIcons = iconConfigs.map(({ Icon, size }) => ({
      Icon,
      size,
      x: Math.random() * (width - size),
      y: Math.random() * (height - size),
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
    }));

    setIcons(initialIcons);
  }, []);

  // Loop de animação
  const animate = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();

    setIcons((prevIcons) => {
      // Cria cópia dos ícones para manipular
      const newIcons = prevIcons.map((icon) => ({ ...icon }));

      // Atualiza posições
      for (const icon of newIcons) {
        icon.x += icon.vx;
        icon.y += icon.vy;

        // Rebote nas bordas horizontais
        if (icon.x <= 0) {
          icon.x = 0;
          icon.vx = Math.abs(icon.vx);
        } else if (icon.x >= width - icon.size) {
          icon.x = width - icon.size;
          icon.vx = -Math.abs(icon.vx);
        }

        // Rebote nas bordas verticais
        if (icon.y <= 0) {
          icon.y = 0;
          icon.vy = Math.abs(icon.vy);
        } else if (icon.y >= height - icon.size) {
          icon.y = height - icon.size;
          icon.vy = -Math.abs(icon.vy);
        }
      }

      // Detecta e resolve colisões entre ícones
      for (let i = 0; i < newIcons.length; i++) {
        for (let j = i + 1; j < newIcons.length; j++) {
          const a = newIcons[i];
          const b = newIcons[j];

          // Centro de cada ícone
          const ax = a.x + a.size / 2;
          const ay = a.y + a.size / 2;
          const bx = b.x + b.size / 2;
          const by = b.y + b.size / 2;

          // Distância entre centros
          const dx = bx - ax;
          const dy = by - ay;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Raio de colisão (soma dos "raios" dos ícones)
          const minDist = (a.size + b.size) / 2;

          // Se estão colidindo
          if (distance < minDist && distance > 0) {
            // Normaliza o vetor de colisão
            const nx = dx / distance;
            const ny = dy / distance;

            // Velocidade relativa
            const dvx = a.vx - b.vx;
            const dvy = a.vy - b.vy;

            // Velocidade relativa na direção da colisão
            const dvn = dvx * nx + dvy * ny;

            // Só resolve se estão se aproximando
            if (dvn > 0) {
              // Troca as velocidades na direção da colisão
              a.vx -= dvn * nx;
              a.vy -= dvn * ny;
              b.vx += dvn * nx;
              b.vy += dvn * ny;

              // Separa os ícones para evitar sobreposição
              const overlap = minDist - distance;
              a.x -= (overlap / 2) * nx;
              a.y -= (overlap / 2) * ny;
              b.x += (overlap / 2) * nx;
              b.y += (overlap / 2) * ny;
            }
          }
        }
      }

      return newIcons;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (icons.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [icons.length, animate]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {icons.map(({ Icon, size, x, y }, index) => (
        <div
          key={index}
          className="absolute transition-opacity duration-300"
          style={{
            left: x,
            top: y,
            opacity: 0.15,
          }}
        >
          <Icon size={size} className="text-primary-color" strokeWidth={1.5} />
        </div>
      ))}
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const t = useTranslations("auth");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("loginError"));
      } else {
        const hasExplicitCallback = searchParams.has("callbackUrl");
        if (hasExplicitCallback) {
          router.push(callbackUrl);
        } else {
          try {
            const prefsRes = await fetch("/api/user/preferences");
            if (prefsRes.ok) {
              const prefs = await prefsRes.json();
              const pageMap: Record<string, string> = {
                dashboard: "/",
                cards: "/cartoes",
                investments: "/investimentos",
              };
              const target = pageMap[prefs.general?.defaultPage] || "/";
              router.push(target);
            } else {
              router.push("/");
            }
          } catch {
            router.push("/");
          }
        }
        router.refresh();
      }
    } catch {
      setError(t("loginGenericError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex shadow-2xl"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-color)",
          borderWidth: "1px",
        }}
      >
        {/* Lado esquerdo - Ícones decorativos */}
        <div
          className="hidden md:block w-1/2 h-[600px] relative overflow-hidden"
          style={{
            borderRight: "1px solid var(--border-color)",
            background: isDark
              ? "linear-gradient(to bottom right, rgba(139, 92, 246, 0.08), rgba(99, 102, 241, 0.08))"
              : "linear-gradient(to bottom right, rgba(139, 92, 246, 0.04), rgba(99, 102, 241, 0.08))",
          }}
        >
          <BackgroundIcons />

          {/* Logo e texto overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-2"
            >
              <Logo size="xl" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-3xl font-bold mb-2 text-center"
              style={{ color: "var(--text-primary)" }}
            >
              CifraCash
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-sm text-center max-w-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {t("loginSubtitle")}
            </motion.p>
          </div>
        </div>

        {/* Lado direito - Formulário */}
        <div
          className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header mobile */}
            <div className="md:hidden text-center mb-6">
              <Logo size="lg" className="mx-auto mb-3" />
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                CifraCash
              </h1>
            </div>

            <h1
              className="text-2xl md:text-3xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {t("welcomeBack")}
            </h1>
            <p style={{ color: "var(--text-muted)" }} className="mb-8">
              {t("loginTitle")}
            </p>

            {/* Erro */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-500 text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("email")} <span className="text-primary-color">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                  className="w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("password")} <span className="text-primary-color">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 transition-colors hover:opacity-80"
                    style={{ color: "var(--text-muted)" }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="pt-2"
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl bg-primary-gradient text-white font-medium relative overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                    isHovered ? "shadow-lg shadow-primary" : "shadow-md shadow-primary"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("loggingIn")}
                    </>
                  ) : (
                    <>
                      {t("login")}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                  {isHovered && !isLoading && (
                    <motion.span
                      initial={{ left: "-100%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      style={{ filter: "blur(8px)" }}
                    />
                  )}
                </button>
              </motion.div>

              <div className="text-center mt-4">
                <Link
                  href="/forgot-password"
                  className="text-primary-color hover:opacity-80 text-sm transition-colors"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
            </form>

            {/* Link para registro */}
            <p
              className="mt-8 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              {t("noAccount")}{" "}
              <Link
                href="/register"
                className="text-primary-color hover:opacity-80 font-medium transition-colors"
              >
                {t("register")}
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
