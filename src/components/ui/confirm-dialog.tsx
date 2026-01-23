"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "bg-red-500/20 text-red-400",
      button: "bg-gradient-to-r from-red-500 to-orange-500 shadow-red-500/25",
    },
    warning: {
      icon: "bg-yellow-500/20 text-yellow-400",
      button: "bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/25",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color-strong)] rounded-2xl w-full max-w-sm shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className={`p-3 rounded-xl ${styles.icon}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            {title}
          </h2>
          <p className="text-[var(--text-muted)] text-sm">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl font-medium bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all shadow-lg disabled:opacity-50 ${styles.button}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Excluindo...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
