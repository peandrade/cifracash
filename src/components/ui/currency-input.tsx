"use client";

import { useState, useEffect, useRef } from "react";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  min?: number;
}

function formatToCurrency(value: string): string {

  const numbers = value.replace(/\D/g, "");

  if (!numbers) return "";

  const numValue = parseInt(numbers, 10) / 100;

  return numValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseFromCurrency(formatted: string): string {
  if (!formatted) return "";

  const cleaned = formatted.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);

  if (isNaN(num)) return "";
  return num.toString();
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0,00",
  className = "",
  required = false,
  disabled = false,
  autoFocus = false,
  min,
}: CurrencyInputProps) {

  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {

      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setDisplayValue(
          numValue.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      }
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    const formatted = formatToCurrency(inputValue);
    setDisplayValue(formatted);

    const numericValue = parseFromCurrency(formatted);
    onChange(numericValue);
  };

  const handleFocus = () => {

    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={className}
      required={required}
      disabled={disabled}
      autoFocus={autoFocus}
      min={min}
    />
  );
}
