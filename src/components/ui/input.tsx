import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-400 mb-2"
          >
            {label}
          </label>
        )}

        {/* Container do input */}
        <div className="relative">
          {/* Ícone esquerdo */}
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            type={type}
            id={inputId}
            className={cn(
              // Base
              "w-full h-12 bg-white/5 border rounded-xl text-white placeholder-gray-500",
              // Padding
              "px-4 py-3",
              // Focus
              "focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500",
              // Transição
              "transition-all duration-200",
              // Border
              error ? "border-red-500/50" : "border-white/10",
              // Padding com ícones
              leftIcon && "pl-12",
              rightIcon && "pr-12",
              className
            )}
            ref={ref}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />

          {/* Ícone direito */}
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Mensagem de erro */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };