"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  FileBarChart,
  LogOut,
  User,
  Github,
  Linkedin,
} from "lucide-react";
import { useTheme, useUser, useSidebar } from "@/contexts";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/logo";
import { AnimatedThemeToggle } from "@/components/ui/animated-theme-toggle";
import { motion } from "framer-motion";

const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const { data: session } = useSession();
  const { profile } = useUser();
  const { setIsHovered, isOpen } = useSidebar();
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  const navItems = [
    {
      label: t("dashboard"),
      href: "/",
      icon: LayoutDashboard,
    },
    {
      label: t("investments"),
      href: "/investimentos",
      icon: TrendingUp,
    },
    {
      label: t("cards"),
      href: "/cartoes",
      icon: CreditCard,
    },
    {
      label: t("reports"),
      href: "/relatorios",
      icon: FileBarChart,
    },
  ];

  if (authRoutes.includes(pathname)) {
    return null;
  }

  const userName = profile?.name || session?.user?.name || session?.user?.email?.split("@")[0] || "U";
  const userEmail = profile?.email || session?.user?.email || "";
  const userImage = profile?.image;
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen z-40 backdrop-blur-xl border-r hidden md:flex flex-col"
      style={{
        backgroundColor: "var(--navbar-bg)",
        borderColor: "var(--border-color)",
      }}
      initial={false}
      animate={{
        width: isOpen ? 240 : 64,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 border-b ${!isOpen ? "justify-center" : "px-4"}`} style={{ borderColor: "var(--border-color)" }}>
        <Link href="/" className={`flex items-center ${isOpen ? "gap-3" : ""}`}>
          <Logo size="md" />
          <motion.span
            className="text-xl font-bold bg-clip-text text-transparent whitespace-pre"
            style={{
              backgroundImage: !mounted || theme === "dark"
                ? "linear-gradient(to right, #ffffff, #9ca3af)"
                : "linear-gradient(to right, #0f172a, #475569)",
            }}
            initial={false}
            animate={{
              opacity: isOpen ? 1 : 0,
              width: isOpen ? "auto" : 0,
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            CifraCash
          </motion.span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-xl font-medium transition-colors ${
                !isOpen ? "justify-center p-3" : "gap-3 px-4 py-2.5"
              } ${
                isActive
                  ? "bg-primary-gradient text-white shadow-lg shadow-primary"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
              title={!isOpen ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <motion.span
                className="whitespace-pre"
                initial={false}
                animate={{
                  opacity: isOpen ? 1 : 0,
                  width: isOpen ? "auto" : 0,
                }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut",
                }}
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t px-2 py-3 space-y-1" style={{ borderColor: "var(--border-color)" }}>
        {/* Theme toggle */}
        <div
          className={`flex items-center w-full rounded-xl ${
            !isOpen ? "justify-center" : "gap-2 px-2"
          }`}
        >
          <AnimatedThemeToggle
            isDark={mounted ? theme === "dark" : true}
            onToggle={toggleTheme}
          />
          <motion.span
            className="text-sm font-medium whitespace-pre text-[var(--text-muted)]"
            initial={false}
            animate={{
              opacity: isOpen ? 1 : 0,
              width: isOpen ? "auto" : 0,
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            {mounted ? (theme === "dark" ? t("lightTheme") : t("darkTheme")) : t("theme")}
          </motion.span>
        </div>

        {/* User info */}
        {session?.user && (
          <>
            <div className={`flex items-center py-2 ${!isOpen ? "justify-center px-0" : "gap-3 px-2"}`}>
              {userImage ? (
                <img
                  src={userImage}
                  alt={tc("avatar")}
                  className="w-8 h-8 rounded-full object-cover border-2 shrink-0"
                  style={{ borderColor: "var(--color-primary)" }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-gradient flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary shrink-0">
                  {userInitial}
                </div>
              )}
              <motion.div
                className="min-w-0 overflow-hidden"
                initial={false}
                animate={{
                  opacity: isOpen ? 1 : 0,
                  width: isOpen ? "auto" : 0,
                }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut",
                }}
              >
                <p className="text-sm font-medium text-[var(--text-primary)] truncate whitespace-pre">
                  {userName}
                </p>
                <p className="text-[10px] text-[var(--text-dimmed)] truncate whitespace-pre">
                  {userEmail}
                </p>
              </motion.div>
            </div>

            {/* Minha Conta */}
            <button
              onClick={() => router.push("/conta")}
              className={`flex items-center w-full rounded-xl transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] ${
                !isOpen ? "justify-center p-3" : "gap-3 px-4 py-2.5"
              }`}
              title={!isOpen ? t("myAccount") : undefined}
            >
              <User className="w-5 h-5 shrink-0" />
              <motion.span
                className="text-sm font-medium whitespace-pre"
                initial={false}
                animate={{
                  opacity: isOpen ? 1 : 0,
                  width: isOpen ? "auto" : 0,
                }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut",
                }}
              >
                {t("myAccount")}
              </motion.span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`flex items-center w-full rounded-xl transition-colors text-red-400 hover:bg-red-500/10 ${
                !isOpen ? "justify-center p-3" : "gap-3 px-4 py-2.5"
              }`}
              title={!isOpen ? t("logout") : undefined}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <motion.span
                className="text-sm font-medium whitespace-pre"
                initial={false}
                animate={{
                  opacity: isOpen ? 1 : 0,
                  width: isOpen ? "auto" : 0,
                }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut",
                }}
              >
                {t("logout")}
              </motion.span>
            </button>
          </>
        )}

        {/* Social links */}
        <div className={`flex items-center pt-2 border-t ${!isOpen ? "justify-center" : "gap-3 px-2"}`} style={{ borderColor: "var(--border-color)" }}>
          <a
            href="https://github.com/peandrade"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg transition-all text-[var(--text-dimmed)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            title="GitHub"
            aria-label={t("visitGithub")}
          >
            <Github className="w-4 h-4" aria-hidden="true" />
          </a>
          <a
            href="https://www.linkedin.com/in/pedro-andrade-santos/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg transition-all text-[var(--text-dimmed)] hover:text-[#0A66C2] hover:bg-[var(--bg-hover)]"
            title="LinkedIn"
            aria-label={t("visitLinkedin")}
          >
            <Linkedin className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </motion.aside>
  );
}
