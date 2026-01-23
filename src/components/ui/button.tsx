import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Variantes do botão usando CVA (Class Variance Authority)
 * Isso permite criar variações tipadas do componente
 */
const buttonVariants = cva(
  // Classes base - aplicadas em todas as variantes
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Botão principal - gradiente roxo
        default:
          "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 focus-visible:ring-violet-500",
        
        // Botão de sucesso - para receitas/ações positivas
        success:
          "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 focus-visible:ring-emerald-500",
        
        // Botão de perigo - para despesas/exclusões
        danger:
          "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-400 hover:to-orange-400 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 focus-visible:ring-red-500",
        
        // Botão secundário - fundo transparente
        secondary:
          "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white focus-visible:ring-white/50",
        
        // Botão fantasma - sem fundo
        ghost:
          "text-gray-400 hover:text-white hover:bg-white/10 focus-visible:ring-white/50",
        
        // Botão de outline
        outline:
          "border border-white/10 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white hover:border-white/20 focus-visible:ring-white/50",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        default: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * Props do botão
 * Extende os atributos nativos do HTML + variantes do CVA
 */
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

/**
 * Componente Button
 * 
 * Uso:
 * <Button>Clique aqui</Button>
 * <Button variant="success">Salvar</Button>
 * <Button variant="danger" size="sm">Excluir</Button>
 * <Button variant="ghost" size="icon"><Icon /></Button>
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Carregando...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };