import { ThemeProvider } from "@/contexts";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        {children}
      </div>
    </ThemeProvider>
  );
}
