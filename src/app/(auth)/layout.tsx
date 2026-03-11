import { ThemeProvider } from "@/contexts";
import { LanguageSelector } from "@/components/auth/language-selector";
import { BeamsBackground } from "@/components/ui/beams-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <BeamsBackground intensity="medium">
        {/* Global Language Selector for Auth Pages */}
        <div className="fixed top-4 right-4 z-50">
          <LanguageSelector size="sm" />
        </div>
        {children}
      </BeamsBackground>
    </ThemeProvider>
  );
}
