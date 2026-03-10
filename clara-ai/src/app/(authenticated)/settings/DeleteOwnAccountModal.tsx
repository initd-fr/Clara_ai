"use client";

import { useState } from "react";
import { Trash2, X, AlertTriangle, LogOut } from "lucide-react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

interface DeleteOwnAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export function DeleteOwnAccountModal({
  isOpen,
  onClose,
  user,
}: DeleteOwnAccountModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();

  const deleteAccountMutation = api.user.deleteOwnAccount.useMutation({
    onSuccess: () => {
      // Rediriger vers la page d'accueil après suppression
      router.push("/");
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression:", error);
      setIsConfirming(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== "SUPPRIMER") return;

    setIsConfirming(true);
    deleteAccountMutation.mutate({});
  };

  const handleClose = () => {
    if (!isConfirming) {
      setConfirmText("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-[9999]">
      <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity" />

      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md">
            <DialogPanel className="relative w-full overflow-hidden rounded-2xl bg-base-100/95 shadow-2xl backdrop-blur-xl">
              {/* Header */}
              <div className="border-b border-base-content/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/20">
                      <Trash2 className="h-6 w-6 text-error" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-base-content">
                        Supprimer mon compte
                      </h2>
                      <p className="text-sm text-base-content/60">
                        Cette action est irréversible
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isConfirming}
                    className="btn btn-circle btn-ghost btn-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  {/* Avertissement critique */}
                  <div className="rounded-lg border border-error/20 bg-error/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-error" />
                      <div>
                        <h3 className="font-medium text-error">
                          ⚠️ ATTENTION - SUPPRESSION DÉFINITIVE
                        </h3>
                        <p className="mt-1 text-sm text-error/80">
                          Vous êtes sur le point de supprimer définitivement
                          votre compte Clara. Cette action ne peut pas être
                          annulée.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Informations utilisateur */}
                  <div className="rounded-lg border border-base-300 p-4">
                    <h3 className="mb-2 font-medium text-base-content">
                      Votre compte :
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Nom :</strong> {user.firstName} {user.lastName}
                      </p>
                      <p>
                        <strong>Email :</strong> {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Liste des données supprimées */}
                  <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                    <h3 className="mb-2 font-medium text-warning">
                      Toutes ces données seront définitivement supprimées :
                    </h3>
                    <ul className="space-y-1 text-sm text-warning/80">
                      <li>
                        • Votre compte utilisateur et données personnelles
                      </li>
                      <li>• Tous vos modèles personnels et documents</li>
                      <li>• Toutes vos conversations et messages</li>
                      <li>• Vos accès aux modèles store</li>
                      <li>• Votre abonnement plateforme (résilié)</li>
                      <li>• Vos abonnements aux modèles store (résiliés)</li>
                      <li>• Vos tickets de support</li>
                    </ul>
                  </div>

                  {/* Confirmation par texte */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">
                        Confirmation de suppression
                      </span>
                    </label>
                    <p className="mb-2 text-sm text-base-content/60">
                      Pour confirmer la suppression, tapez{" "}
                      <strong>SUPPRIMER</strong> dans le champ ci-dessous :
                    </p>
                    <input
                      required
                      type="text"
                      className="input input-bordered w-full"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Tapez SUPPRIMER"
                      disabled={isConfirming}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isConfirming}
                      className="btn btn-ghost"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={confirmText !== "SUPPRIMER" || isConfirming}
                      className="btn btn-error"
                    >
                      {isConfirming ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      Supprimer mon compte
                    </button>
                  </div>
                </div>
              </form>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
