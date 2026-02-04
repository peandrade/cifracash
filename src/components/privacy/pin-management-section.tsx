"use client";

import { useState } from "react";
import { KeyRound, Shield, Trash2, RefreshCw, Loader2, AlertCircle, Check } from "lucide-react";
import { SetupPinModal } from "./setup-pin-modal";

interface PinManagementSectionProps {
  hasPin: boolean;
  onPinCreated: () => void;
  onPinDeleted: () => void;
}

export function PinManagementSection({ hasPin, onPinCreated, onPinDeleted }: PinManagementSectionProps) {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const handleDeletePin = async () => {
    if (!deletePassword) {
      setDeleteError("Digite sua senha da conta");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/user/discrete-pin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountPassword: deletePassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || "Erro ao remover PIN");
        return;
      }

      setDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteConfirm(false);
        setDeletePassword("");
        setDeleteSuccess(false);
        onPinDeleted();
      }, 1500);
    } catch {
      setDeleteError("Erro ao remover PIN. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletePassword("");
    setDeleteError("");
    setDeleteSuccess(false);
  };

  return (
    <>
      <div
        className="backdrop-blur rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-colors"
        style={{
          backgroundColor: "var(--card-bg)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-violet-500/10">
            <KeyRound className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
              PIN do Modo Discreto
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              PIN de 6 dígitos para proteger seus dados
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-hover)]">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${hasPin ? "text-emerald-400" : "text-amber-400"}`} />
              <span className="text-sm text-[var(--text-primary)]">
                {hasPin ? "PIN configurado" : "PIN não configurado"}
              </span>
            </div>
            {hasPin && (
              <div className="flex items-center gap-1 text-emerald-400">
                <Check className="w-4 h-4" />
                <span className="text-xs">Ativo</span>
              </div>
            )}
          </div>

          {/* Descrição */}
          <p className="text-sm text-[var(--text-dimmed)]">
            {hasPin
              ? "Seu PIN está configurado. Ele será solicitado quando você tentar desativar o modo discreto."
              : "Configure um PIN para adicionar uma camada extra de segurança ao modo discreto. Diferente da senha da sua conta, o PIN é exclusivo para proteger a visualização dos seus dados financeiros."}
          </p>

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-2">
            {hasPin ? (
              <>
                <button
                  onClick={() => setShowSetupModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Alterar PIN
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover PIN
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowSetupModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white hover:bg-violet-600 transition-colors text-sm font-medium"
              >
                <KeyRound className="w-4 h-4" />
                Criar PIN
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de criação/alteração de PIN */}
      <SetupPinModal
        open={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSuccess={() => {
          setShowSetupModal(false);
          onPinCreated();
        }}
      />

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              backgroundColor: "var(--card-bg)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Remover PIN
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Confirme com sua senha da conta
                </p>
              </div>
            </div>

            {deleteSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">PIN removido com sucesso!</span>
              </div>
            ) : (
              <>
                {deleteError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-red-500 text-sm">{deleteError}</span>
                  </div>
                )}

                <p className="text-sm text-[var(--text-dimmed)] mb-4">
                  Ao remover o PIN, o modo discreto será desativado e você precisará criar um novo PIN para usá-lo novamente.
                </p>

                <input
                  type="password"
                  placeholder="Digite sua senha da conta"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDeletePin()}
                  className="w-full p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-dimmed)] focus:outline-none focus:border-red-500 mb-4"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCloseDeleteConfirm}
                    disabled={isDeleting}
                    className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeletePin}
                    disabled={isDeleting || !deletePassword}
                    className="px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Removendo...
                      </>
                    ) : (
                      "Remover PIN"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
