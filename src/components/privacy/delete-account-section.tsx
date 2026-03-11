"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function DeleteAccountSection() {
  const router = useRouter();
  const t = useTranslations("privacy");
  const tc = useTranslations("common");
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const canDelete = confirmText === "EXCLUIR" || confirmText === "DELETE" || confirmText === "ELIMINAR";

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      // Fazer logout e redirecionar para a página inicial
      await signOut({ redirect: false });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir conta");
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl border border-red-500/30 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-xl bg-red-500/10">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-red-400">{t("deleteAccount")}</h2>
          <p className="text-sm text-[var(--text-dimmed)]">{t("deleteAccountDesc")}</p>
        </div>
      </div>

      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-4 rounded-xl border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-medium"
        >
          {t("deleteMyAccount")}
        </button>
      ) : (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-[var(--text-primary)] font-medium">{t("irreversibleAction")}</p>
              <p className="text-xs text-[var(--text-dimmed)] mt-1">
                {t("deleteAccountWarning")}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-3 p-3 rounded-xl bg-red-500/20 border border-red-500/30">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <input
            type="text"
            placeholder={t("typeDeleteConfirm")}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            disabled={isDeleting}
            className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-red-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:outline-none focus:border-red-500 mb-3 disabled:opacity-50"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setIsExpanded(false);
                setConfirmText("");
                setError("");
              }}
              disabled={isDeleting}
              className="p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
            >
              {tc("cancel")}
            </button>
            <button
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              className="p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {tc("deleting")}
                </>
              ) : (
                tc("delete")
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
