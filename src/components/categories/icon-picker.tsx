"use client";

import * as LucideIcons from "lucide-react";
import { Check } from "lucide-react";

// Lista de ícones populares para categorias financeiras
const POPULAR_ICONS = [
  // Despesas gerais
  "ShoppingCart", "ShoppingBag", "Store", "Package",
  // Casa
  "Home", "Building", "Building2", "Key",
  // Alimentação
  "UtensilsCrossed", "Coffee", "Pizza", "Salad",
  // Transporte
  "Car", "Bus", "Bike", "Plane", "Train", "Fuel",
  // Utilidades
  "Lightbulb", "Droplets", "Wifi", "Phone", "Smartphone",
  // Entretenimento
  "Play", "Gamepad2", "Music", "Film", "Tv", "Ticket",
  // Saúde
  "Heart", "HeartPulse", "Pill", "Stethoscope", "Activity",
  // Educação
  "GraduationCap", "BookOpen", "Library", "PenTool",
  // Trabalho
  "Laptop", "Briefcase", "Wallet", "Calculator",
  // Finanças
  "CreditCard", "Banknote", "PiggyBank", "TrendingUp", "TrendingDown",
  "CircleDollarSign", "Receipt", "Landmark",
  // Compras
  "Shirt", "Gift", "Watch", "Gem",
  // Pets
  "Dog", "Cat", "PawPrint",
  // Outros
  "Tag", "Tags", "Star", "Zap", "ArrowLeftRight",
  "MoreHorizontal", "HelpCircle", "Sparkles",
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
}

export function IconPicker({ value, onChange, color = "#8B5CF6" }: IconPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1">
      {POPULAR_ICONS.map((iconName) => {
        const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;

        if (!IconComponent) return null;

        const isSelected = value === iconName;

        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              isSelected
                ? "ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)] ring-violet-500"
                : "hover:bg-[var(--bg-hover)]"
            }`}
            style={{
              backgroundColor: isSelected ? `${color}20` : undefined,
            }}
            title={iconName}
          >
            {isSelected ? (
              <div className="relative">
                <IconComponent className="w-5 h-5" />
                <Check
                  className="w-3 h-3 absolute -bottom-1 -right-1 rounded-full p-0.5"
                  style={{ backgroundColor: color, color: "white" }}
                />
              </div>
            ) : (
              <IconComponent className="w-5 h-5 text-[var(--text-muted)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Componente para renderizar um ícone pelo nome
 */
export function DynamicIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const IconComponent = LucideIcons[name as keyof typeof LucideIcons] as React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;

  if (!IconComponent) {
    const FallbackIcon = LucideIcons.Tag;
    return <FallbackIcon className={className} style={style} />;
  }

  return <IconComponent className={className} style={style} />;
}
