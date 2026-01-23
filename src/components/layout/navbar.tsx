"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, TrendingUp, CreditCard, FileBarChart, Sun, Moon, LogOut, User } from "lucide-react";
import { useTheme } from "@/contexts";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Investimentos",
    href: "/investimentos",
    icon: TrendingUp,
  },
  {
    label: "Cartões",
    href: "/cartoes",
    icon: CreditCard,
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: FileBarChart,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();
  const { data: session } = useSession();

  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    return null;
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <nav
      className="sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-colors duration-300"
      style={{
        backgroundColor: "var(--navbar-bg)",
        borderColor: "var(--border-color)"
      }}
    >
      <style>{`
        .nav-link {
          color: var(--text-muted);
          background-color: transparent;
        }
        .nav-link:hover {
          color: var(--text-primary);
          background-color: var(--bg-hover);
        }
        .nav-button {
          color: var(--text-muted);
          background-color: transparent;
        }
        .nav-button:hover {
          color: var(--text-primary);
          background-color: var(--bg-hover);
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <span className="text-lg">💰</span>
            </div>
            <span
              className="text-xl font-bold bg-clip-text text-transparent"
              style={{
                backgroundImage: !mounted || theme === "dark"
                  ? "linear-gradient(to right, #ffffff, #9ca3af)"
                  : "linear-gradient(to right, #0f172a, #475569)"
              }}
            >
              FinControl
            </span>
          </Link>

          {}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                      : "nav-link"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}

            {}
            <button
              onClick={toggleTheme}
              className="nav-button ml-2 p-2 rounded-xl transition-all"
              title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
            >
              {mounted ? (
                theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            {}
            {session?.user && (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/perfil"
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                    pathname === "/perfil"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                      : "nav-link"
                  }`}
                  style={pathname !== "/perfil" ? { backgroundColor: "var(--bg-hover)" } : undefined}
                  title="Meu Perfil"
                >
                  <User className="w-4 h-4" />
                  <span
                    className="text-sm font-medium hidden sm:inline"
                  >
                    {session.user.name || session.user.email?.split("@")[0]}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="nav-button p-2 rounded-xl transition-all hover:bg-red-500/10 hover:text-red-500"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
