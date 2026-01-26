"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, TrendingUp, CreditCard, FileBarChart, Sun, Moon, LogOut, User, ChevronDown } from "lucide-react";
import { useTheme, useUser } from "@/contexts";

const navItems = [
  {
    label: "Dashboard",
    shortLabel: "Home",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Investimentos",
    shortLabel: "Invest.",
    href: "/investimentos",
    icon: TrendingUp,
  },
  {
    label: "Cartões",
    shortLabel: "Cartões",
    href: "/cartoes",
    icon: CreditCard,
  },
  {
    label: "Relatórios",
    shortLabel: "Relat.",
    href: "/relatorios",
    icon: FileBarChart,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const { data: session } = useSession();
  const { profile } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideDesktop = desktopDropdownRef.current && !desktopDropdownRef.current.contains(target);
      const isOutsideMobile = mobileDropdownRef.current && !mobileDropdownRef.current.contains(target);

      if (isOutsideDesktop && isOutsideMobile) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const userName = profile?.name || session?.user?.name || session?.user?.email?.split("@")[0] || "U";
  const userEmail = profile?.email || session?.user?.email || "";
  const userImage = profile?.image;
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Desktop/Tablet Navbar */}
      <nav
        className="sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-colors duration-300 hidden md:block"
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
              <div className="w-9 h-9 rounded-xl bg-primary-gradient flex items-center justify-center shadow-lg shadow-primary">
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
                        ? "bg-primary-gradient text-white shadow-lg shadow-primary"
                        : "nav-link"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
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
                <div className="relative ml-2" ref={desktopDropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 p-1 rounded-xl transition-all hover:bg-[var(--bg-hover)]"
                  >
                    {userImage ? (
                      <img
                        src={userImage}
                        alt="Avatar"
                        className="w-9 h-9 rounded-full object-cover border-2"
                        style={{ borderColor: "var(--color-primary)" }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary-gradient flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary">
                        {userInitial}
                      </div>
                    )}
                    <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 rounded-xl border shadow-xl overflow-hidden"
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderColor: "var(--border-color)"
                      }}
                    >
                      <div className="p-3 border-b" style={{ borderColor: "var(--border-color)" }}>
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {userName}
                        </p>
                        <p className="text-xs text-[var(--text-dimmed)] truncate">
                          {userEmail}
                        </p>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            router.push("/conta");
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                        >
                          <User className="w-4 h-4" />
                          Minha Conta
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header - Simplified */}
      <header
        className="sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-colors duration-300 md:hidden"
        style={{
          backgroundColor: "var(--navbar-bg)",
          borderColor: "var(--border-color)"
        }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center shadow-lg shadow-primary">
              <span className="text-sm">💰</span>
            </div>
            <span
              className="text-lg font-bold bg-clip-text text-transparent"
              style={{
                backgroundImage: !mounted || theme === "dark"
                  ? "linear-gradient(to right, #ffffff, #9ca3af)"
                  : "linear-gradient(to right, #0f172a, #475569)"
              }}
            >
              FinControl
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all"
              style={{ color: "var(--text-muted)" }}
              title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
            >
              {mounted ? (
                theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
            {session?.user && (
              <div className="relative" ref={mobileDropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-8 h-8 rounded-full overflow-hidden"
                >
                  {userImage ? (
                    <img
                      src={userImage}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border-2"
                      style={{ borderColor: "var(--color-primary)" }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-gradient flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary">
                      {userInitial}
                    </div>
                  )}
                </button>

                {/* Mobile Dropdown Menu */}
                {isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-xl border shadow-xl overflow-hidden"
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--border-color)"
                    }}
                  >
                    <div className="p-3 border-b" style={{ borderColor: "var(--border-color)" }}>
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-[var(--text-dimmed)] truncate">
                        {userEmail}
                      </p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          router.push("/conta");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                      >
                        <User className="w-4 h-4" />
                        Minha Conta
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t transition-colors duration-300 md:hidden safe-area-bottom"
        style={{
          backgroundColor: "var(--navbar-bg)",
          borderColor: "var(--border-color)",
          paddingBottom: "env(safe-area-inset-bottom)"
        }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all"
                style={{ color: isActive ? "var(--color-primary)" : "var(--text-muted)" }}
              >
                <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className="text-[10px] font-medium">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
