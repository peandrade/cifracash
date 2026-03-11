"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  UserPlus,
  Mail,
  Lock,
  User,
  Coins,
  Info,
  ChevronDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { useTheme } from "@/contexts";
import { locales, type Locale } from "@/i18n/config";

interface FloatingOrb {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

const currencies = [
  { code: "BRL", symbol: "R$", flag: "🇧🇷" },
  { code: "USD", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", flag: "🇬🇧" },
] as const;

type Currency = (typeof currencies)[number]["code"];

// Orbs flutuantes com blur
function FloatingOrbs() {
  const orbColors = [
    "rgba(56, 189, 248, 0.4)",   // sky
    "rgba(139, 92, 246, 0.4)",   // violet
    "rgba(34, 211, 238, 0.35)",  // cyan
    "rgba(99, 102, 241, 0.35)",  // indigo
    "rgba(45, 212, 191, 0.3)",   // teal
  ];

  const orbs: FloatingOrb[] = [
    { id: 1, x: 10, y: 15, size: 120, color: orbColors[0], duration: 20, delay: 0 },
    { id: 2, x: 70, y: 60, size: 100, color: orbColors[1], duration: 25, delay: 2 },
    { id: 3, x: 30, y: 70, size: 80, color: orbColors[2], duration: 18, delay: 4 },
    { id: 4, x: 80, y: 20, size: 90, color: orbColors[3], duration: 22, delay: 1 },
    { id: 5, x: 50, y: 40, size: 70, color: orbColors[4], duration: 24, delay: 3 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(30px)",
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -25, 15, -10, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
            opacity: [0.6, 0.8, 0.5, 0.7, 0.6],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Painel decorativo com logo
function DecorativePanel({ isLogin }: { isLogin: boolean }) {
  const t = useTranslations("auth");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background: isDark
          ? "linear-gradient(to bottom right, rgba(139, 92, 246, 0.05), rgba(99, 102, 241, 0.05))"
          : "linear-gradient(to bottom right, rgba(139, 92, 246, 0.03), rgba(99, 102, 241, 0.05))",
      }}
    >
      <FloatingOrbs />

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
          {isLogin ? t("loginSubtitle") : t("registerSubtitle")}
        </motion.p>
      </div>
    </div>
  );
}

interface AuthCardProps {
  initialMode?: "login" | "register";
}

export function AuthCard({ initialMode = "login" }: AuthCardProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const router = useRouter();
  const t = useTranslations("auth");
  const tCurrencies = useTranslations("currencies");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Register state
  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [language, setLanguage] = useState<Locale>("pt");
  const [currency, setCurrency] = useState<Currency>("BRL");
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);

  useEffect(() => {
    const getLocaleFromCookie = () => {
      const cookieLocale = document.cookie
        .split("; ")
        .find((row) => row.startsWith("locale="))
        ?.split("=")[1] as Locale | undefined;
      if (cookieLocale && locales.includes(cookieLocale)) {
        setLanguage(cookieLocale);
      }
    };
    getLocaleFromCookie();
  }, []);

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(registerPassword);
  const strengthLabels = [
    t("passwordStrength.veryWeak"),
    t("passwordStrength.weak"),
    t("passwordStrength.medium"),
    t("passwordStrength.strong"),
    t("passwordStrength.veryStrong"),
  ];
  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoginLoading(true);

    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        setLoginError(t("loginError"));
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
        router.refresh();
      }
    } catch {
      setLoginError(t("loginGenericError"));
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");

    if (registerPassword !== confirmPassword) {
      setRegisterError(t("passwordsDontMatch"));
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError(t("passwordMinLength"));
      return;
    }

    setIsRegisterLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: registerEmail,
          password: registerPassword,
          language,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(data.error || t("registerError"));
        return;
      }

      const result = await signIn("credentials", {
        email: registerEmail,
        password: registerPassword,
        redirect: false,
      });

      if (result?.error) {
        setRegisterError(t("registerLoginError"));
      } else {
        document.cookie = `locale=${language}; path=/; max-age=31536000`;
        router.push("/");
        router.refresh();
      }
    } catch {
      setRegisterError(t("registerGenericError"));
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    // Limpa erros ao trocar
    setLoginError("");
    setRegisterError("");
  };

  const isLogin = mode === "login";

  return (
    <div className="flex w-full h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl overflow-hidden rounded-2xl flex shadow-2xl relative"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--border-color)",
          borderWidth: "1px",
          minHeight: "700px",
        }}
      >
        {/* Painel decorativo - se move de lado */}
        <motion.div
          className="hidden md:block absolute top-0 bottom-0 w-1/2 z-20"
          initial={false}
          animate={{
            left: isLogin ? 0 : "50%",
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          style={{
            borderRight: isLogin ? "1px solid var(--border-color)" : "none",
            borderLeft: isLogin ? "none" : "1px solid var(--border-color)",
          }}
        >
          <DecorativePanel isLogin={isLogin} />
        </motion.div>

        {/* Container dos formulários */}
        <div className="flex w-full">
          {/* Login Form */}
          <motion.div
            className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center overflow-y-auto"
            initial={false}
            animate={{
              x: isLogin ? "100%" : 0,
              opacity: isLogin ? 0 : 1,
              pointerEvents: isLogin ? "none" : "auto",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
            }}
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
              {t("registerTitle")}
            </h1>
            <p style={{ color: "var(--text-muted)" }} className="mb-6">
              {t("registerSubtitle")}
            </p>

            {registerError && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-500 text-sm">{registerError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("name")}
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("currency")}
                </label>
                <div className="relative">
                  <Coins
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full pl-12 pr-10 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 cursor-pointer"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                      appearance: "none",
                    }}
                  >
                    {currencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.flag} {curr.symbol} {tCurrencies(curr.code)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                    style={{ color: "var(--text-muted)" }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("email")} <span className="text-primary-color">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    required
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label
                    htmlFor="register-password"
                    className="block text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {t("password")} <span className="text-primary-color">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPasswordInfo(!showPasswordInfo)}
                      onBlur={() => setTimeout(() => setShowPasswordInfo(false), 150)}
                      className="w-4 h-4 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--bg-hover)]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    {showPasswordInfo && (
                      <div
                        className="absolute left-0 top-6 z-50 w-64 p-3 rounded-lg shadow-lg border text-xs"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          borderColor: "var(--border-color)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <p className="font-medium mb-2">{t("passwordRequirements")}</p>
                        <ul className="space-y-1" style={{ color: "var(--text-muted)" }}>
                          <li>• {t("passwordReqMinLength")}</li>
                          <li>• {t("passwordReqUppercase")}</li>
                          <li>• {t("passwordReqLowercase")}</li>
                          <li>• {t("passwordReqNumber")}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    id="register-password"
                    type={showRegisterPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {registerPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-colors"
                          style={{
                            backgroundColor:
                              i < passwordStrength ? strengthColors[passwordStrength - 1] : "var(--border-color)",
                          }}
                        />
                      ))}
                    </div>
                    <p
                      className="text-xs"
                      style={{
                        color: passwordStrength > 0 ? strengthColors[passwordStrength - 1] : "var(--text-muted)",
                      }}
                    >
                      {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : t("enterPassword")}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("confirmPassword")} <span className="text-primary-color">*</span>
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: registerPassword === confirmPassword ? "#22c55e" : "#ef4444" }}
                  >
                    {registerPassword === confirmPassword ? `✓ ${t("passwordsMatch")}` : `✗ ${t("passwordsDontMatchShort")}`}
                  </p>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isRegisterLoading}
                  className="w-full py-3 px-4 rounded-xl bg-primary-gradient text-white font-medium shadow-md shadow-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRegisterLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("registering")}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      {t("register")}
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              {t("hasAccount")}{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-primary-color hover:opacity-80 font-medium transition-colors"
              >
                {t("login")}
              </button>
            </p>
          </motion.div>

          {/* Register Form (aparece na direita quando login está ativo) */}
          <motion.div
            className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center"
            initial={false}
            animate={{
              x: isLogin ? 0 : "-100%",
              opacity: isLogin ? 1 : 0,
              pointerEvents: isLogin ? "auto" : "none",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
            }}
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

            {loginError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-500 text-sm">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("email")} <span className="text-primary-color">*</span>
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("password")} <span className="text-primary-color">*</span>
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
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
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                  disabled={isLoginLoading}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl bg-primary-gradient text-white font-medium relative overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                    isHovered ? "shadow-lg shadow-primary" : "shadow-md shadow-primary"
                  )}
                >
                  {isLoginLoading ? (
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
                  {isHovered && !isLoginLoading && (
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
                <a
                  href="/forgot-password"
                  className="text-primary-color hover:opacity-80 text-sm transition-colors"
                >
                  {t("forgotPassword")}
                </a>
              </div>
            </form>

            <p className="mt-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              {t("noAccount")}{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="text-primary-color hover:opacity-80 font-medium transition-colors"
              >
                {t("register")}
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
