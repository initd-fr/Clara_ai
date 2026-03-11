"use client";

import { useState } from "react";
import { Trash2, X, LogOut, AlertTriangle, User } from "lucide-react";
import { Dialog, DialogPanel } from "@headlessui/react";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { cn } from "~/lib/utils";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();

  const { data: currentUser } = api.user.getCurrentUser.useQuery();

  const deleteAccountMutation = api.user.deleteOwnAccount.useMutation({
    onSuccess: () => {
      // Rediriger vers la page d'accueil après suppression
      router.push("/");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText !== "SUPPRIMER") return;

    try {
      await toast.promise(deleteAccountMutation.mutateAsync({}), {
        loading: "Suppression de votre compte en cours...",
        success: "Votre compte a été supprimé avec succès",
        error: (err) => err?.message || "Erreur lors de la suppression",
      });
    } catch (error) {
      // L'erreur est déjà gérée par toast.promise
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  if (!isOpen || !currentUser) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-[9999]">
      <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm transition-opacity" />

      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <DialogPanel className="relative w-full overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-2xl">
              {/* Header avec gradient Clara */}
              <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#ff4444]/10 via-[#cc0000]/20 to-[#990000]/30 p-8 py-12 shadow-lg dark:from-[#ff4444]/5 dark:via-[#cc0000]/10 dark:to-[#990000]/20">
                {/* Éléments décoratifs */}
                <div className="absolute left-0 top-0 h-full w-full opacity-10 dark:opacity-15">
                  <div className="absolute left-[5%] top-[10%] h-16 w-16 rounded-full bg-[#ff4444] blur-xl"></div>
                  <div className="absolute right-[15%] top-[30%] h-24 w-24 rounded-full bg-[#cc0000] blur-xl"></div>
                  <div className="absolute bottom-[20%] left-[25%] h-20 w-20 rounded-full bg-[#990000] blur-xl"></div>
                  <div className="absolute bottom-[10%] right-[10%] h-12 w-12 rounded-full bg-[#ff6666] blur-xl"></div>
                </div>

                {/* Contenu du header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-error/20 to-error/10 ring-1 ring-error/20">
                      <Trash2 className="h-6 w-6 text-error" />
                    </div>
                    <div>
                      <h3 className="title-medium text-2xl text-base-content">
                        Supprimer mon compte
                      </h3>
                      <p className="mt-1 text-base text-base-content/70">
                        Suppression définitive de votre compte Clara
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="relative z-10 rounded-lg p-2 text-base-content/70 transition-colors hover:bg-base-content/10 hover:text-base-content"
                    aria-label="Fermer la modale"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Avertissement critique */}
                  <div className="rounded-2xl border border-error/20 bg-gradient-to-br from-error/10 to-error/5 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-error/20 to-error/10 ring-1 ring-error/20">
                        <AlertTriangle className="h-5 w-5 text-error" />
                      </div>
                      <div>
                        <h3 className="title-medium text-lg text-error">
                          ATTENTION - SUPPRESSION DÉFINITIVE
                        </h3>
                        <p className="mt-2 text-base text-error/80">
                          Vous êtes sur le point de supprimer définitivement
                          votre compte Clara. Cette action ne peut pas être
                          annulée et toutes vos données seront perdues.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contenu en grille */}
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Colonne gauche */}
                    <div className="space-y-6">
                      {/* Informations utilisateur */}
                      <div className="rounded-2xl border border-base-content/10 bg-gradient-to-br from-base-100 to-base-200/50 p-6 shadow-sm">
                        <div className="mb-6 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/20">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="title-medium text-lg text-base-content">
                              Votre compte
                            </h3>
                            <p className="text-sm text-base-content/70">
                              Informations du compte à supprimer
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-base-content/70">
                                Nom complet
                              </p>
                              <p className="font-medium text-base-content">
                                {currentUser.firstName} {currentUser.lastName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-base-content/70">
                                Email
                              </p>
                              <p className="font-medium text-base-content">
                                {currentUser.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Confirmation par texte */}
                      <div className="rounded-2xl border border-base-content/10 bg-gradient-to-br from-base-100 to-base-200/50 p-6 shadow-sm">
                        <div className="mb-6 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-warning/10 to-warning/5 ring-1 ring-warning/20">
                            <AlertTriangle className="h-5 w-5 text-warning" />
                          </div>
                          <div>
                            <h3 className="title-medium text-lg text-base-content">
                              Confirmation de suppression
                            </h3>
                            <p className="text-sm text-base-content/70">
                              Validation finale requise
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-base text-base-content/80">
                            Pour confirmer la suppression, tapez{" "}
                            <strong className="text-error">SUPPRIMER</strong>{" "}
                            dans le champ ci-dessous :
                          </p>
                          <input
                            required
                            type="text"
                            className="input input-bordered w-full bg-base-100 text-base-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Tapez SUPPRIMER"
                            disabled={false}
                          />
                          <div className="flex justify-between text-xs">
                            <span className="text-base-content/50">
                              Confirmation requise pour continuer
                            </span>
                            <span
                              className={cn(
                                "font-medium",
                                confirmText === "SUPPRIMER"
                                  ? "text-success"
                                  : "text-error",
                              )}
                            >
                              {confirmText === "SUPPRIMER"
                                ? "✓ Valide"
                                : "✗ Invalide"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Colonne droite */}
                    <div className="space-y-6">
                      {/* Liste des données supprimées */}
                      <div className="rounded-2xl border border-error/20 bg-gradient-to-br from-error/10 to-error/5 p-6 shadow-sm">
                        <div className="mb-6 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-error/20 to-error/10 ring-1 ring-error/20">
                            <Trash2 className="h-5 w-5 text-error" />
                          </div>
                          <div>
                            <h3 className="title-medium text-lg text-error">
                              Données supprimées
                            </h3>
                            <p className="text-sm text-error/70">
                              Éléments qui seront définitivement perdus
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2 text-error/80">
                              <div className="h-1.5 w-1.5 rounded-full bg-error"></div>
                              Votre compte utilisateur et données personnelles
                            </li>
                            <li className="flex items-center gap-2 text-error/80">
                              <div className="h-1.5 w-1.5 rounded-full bg-error"></div>
                              Tous vos modèles personnels et documents
                            </li>
                            <li className="flex items-center gap-2 text-error/80">
                              <div className="h-1.5 w-1.5 rounded-full bg-error"></div>
                              Toutes vos conversations et messages
                            </li>
                            <li className="flex items-center gap-2 text-error/80">
                              <div className="h-1.5 w-1.5 rounded-full bg-error"></div>
                              Vos accès aux modèles store
                            </li>
                            <li className="flex items-center gap-2 text-error/80">
                              <div className="h-1.5 w-1.5 rounded-full bg-error"></div>
                              Votre accès plateforme (résilié)
                            </li>
                            <li className="flex items-center gap-2 text-error/80">
                              <div className="h-1.5 w-1.5 rounded-full bg-error"></div>
                              Vos accès aux modèles store (résiliés)
                            </li>
                            <li className="flex items-center gap-2 text-error/80">
                              <div className="h-1.5 w-1.5 rounded-full bg-error"></div>
                              Vos tickets de support
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end border-t border-base-content/10 bg-base-100/80 p-6">
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-base-200/50 to-base-100 px-6 py-3 text-base-content/70 transition-all hover:from-base-200/70 hover:to-base-200/30 hover:text-base-content hover:shadow-md"
                      >
                        <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
                        <span className="relative z-10">Annuler</span>
                      </button>
                      <button
                        type="submit"
                        disabled={confirmText !== "SUPPRIMER"}
                        className={cn(
                          "title-medium group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-base-200/50 to-base-100 px-6 py-3 text-base-content/70 transition-all hover:from-base-200/70 hover:to-base-200/30 hover:text-base-content hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
                          confirmText === "SUPPRIMER"
                            ? "from-error/20 to-error/10 text-error ring-1 ring-error/20"
                            : "cursor-not-allowed bg-base-300 text-base-content/50",
                        )}
                      >
                        <div className="absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100" />
                        <div className="relative z-10 flex items-center gap-2">
                          <LogOut className="h-4 w-4" />
                          <span>Supprimer mon compte</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
