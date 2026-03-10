////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
"use client";

import { useState, ChangeEvent, FormEvent, useCallback } from "react";
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  TriangleAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { api } from "~/trpc/react";
import { handleError } from "~/app/utils/error";
import SecondaryLoader from "~/components/SecondaryLoader";
import DeleteAccountModal from "./DeleteAccountModal";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
export default function SettingsForm() {
  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  const { update } = useSession();
  const router = useRouter();

  const { data: currentUser, isLoading } = api.user.getCurrentUser.useQuery();

  const { isPending, mutateAsync: updatePasswordAndApiKeyAsync } =
    api.user.updatePassword.useMutation();

  const [userData, setUserData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const updateUser = useCallback(
    async (data: typeof userData) => {
      try {
        const updatedUser = await updatePasswordAndApiKeyAsync(data);
        await update({ user: { ...updatedUser } });
        setUserData({ currentPassword: "", newPassword: "" });
        router.refresh();
      } catch (error) {
        throw error;
      }
    },
    [updatePasswordAndApiKeyAsync, update, router],
  );

  const handleUpdateUser = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!userData.currentPassword) {
        toast.error("Veuillez saisir votre mot de passe actuel.");
        return;
      }

      if (!userData.newPassword) {
        toast.error("Veuillez saisir un nouveau mot de passe.");
        return;
      }

      void toast.promise(updateUser(userData), {
        loading: "Mise à jour du mot de passe en cours...",
        success: "Votre mot de passe a été mis à jour avec succès.",
        error: (err) => handleError(err),
      });
    },
    [userData, updateUser],
  );

  const handleUserDataChange = useCallback(
    ({ target: { name, value } }: ChangeEvent<HTMLInputElement>) => {
      setUserData((prevUserData) => ({
        ...prevUserData,
        [name]: value,
      }));
    },
    [],
  );

  const toggleCurrentPassword = useCallback(() => {
    setShowCurrentPassword(!showCurrentPassword);
  }, [showCurrentPassword]);

  const toggleNewPassword = useCallback(() => {
    setShowNewPassword(!showNewPassword);
  }, [showNewPassword]);

  const openDeleteModal = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
  }, []);
  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <SecondaryLoader />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Informations du compte (lecture seule) */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <UserIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base-content">
              Informations personnelles
            </h3>
            <p className="text-sm text-base-content/70">
              Vos informations de base
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Prénom */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-base-content/70">
              Prénom
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <UserIcon className="h-4 w-4 text-base-content/40" />
              </div>
              <input
                type="text"
                readOnly
                value={currentUser?.firstName || ""}
                className="block w-full rounded-lg border border-base-300 bg-base-200 py-2 pl-10 pr-4 text-base-content/60"
              />
            </div>
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-base-content/70">
              Nom
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <UserIcon className="h-4 w-4 text-base-content/40" />
              </div>
              <input
                type="text"
                readOnly
                value={currentUser?.lastName || ""}
                className="block w-full rounded-lg border border-base-300 bg-base-200 py-2 pl-10 pr-4 text-base-content/60"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-base-content/70">
            Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-4 w-4 text-base-content/40" />
            </div>
            <input
              type="email"
              readOnly
              value={currentUser?.email || ""}
              className="block w-full rounded-lg border border-base-300 bg-base-200 py-2 pl-10 pr-4 text-base-content/60"
            />
          </div>
          <p className="text-xs text-base-content/50">
            Pour modifier votre email, veuillez contacter le support
          </p>
        </div>
      </div>

      {/* Séparateur */}
      <div className="border-t border-base-300/50"></div>

      {/* Modification du mot de passe */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
            <Shield className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-base-content">
              Sécurité du compte
            </h3>
            <p className="text-sm text-base-content/70">
              Modifiez votre mot de passe
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateUser} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-1">
            {/* Mot de passe actuel */}
            <div className="space-y-2">
              <label
                htmlFor="currentPassword"
                className="text-sm font-medium text-base-content/70"
              >
                Mot de passe actuel
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-base-content/40" />
                </div>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  id="currentPassword"
                  required
                  placeholder="Votre mot de passe actuel"
                  value={userData.currentPassword}
                  onChange={handleUserDataChange}
                  maxLength={40}
                  className="block w-full rounded-lg border border-base-300 bg-base-100 py-2 pl-10 pr-12 text-base-content placeholder:text-base-content/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={toggleCurrentPassword}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-base-content/40 hover:text-base-content/60"
                  aria-label={
                    showCurrentPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div className="space-y-2">
              <label
                htmlFor="newPassword"
                className="text-sm font-medium text-base-content/70"
              >
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-base-content/40" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  id="newPassword"
                  required
                  placeholder="Nouveau mot de passe"
                  value={userData.newPassword}
                  onChange={handleUserDataChange}
                  maxLength={40}
                  className="block w-full rounded-lg border border-base-300 bg-base-100 py-2 pl-10 pr-12 text-base-content placeholder:text-base-content/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={toggleNewPassword}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-base-content/40 hover:text-base-content/60"
                  aria-label={
                    showNewPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="rounded-lg bg-info/10 p-3">
                <p className="text-xs text-info">
                  <strong>Exigences :</strong> Au moins 8 caractères, une
                  majuscule, une minuscule, un chiffre et un caractère spécial
                </p>
              </div>
            </div>
          </div>

          {/* Bouton de soumission */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary btn-sm sm:btn-md"
            >
              {isPending ? (
                <>
                  <SecondaryLoader />
                  Mise à jour...
                </>
              ) : (
                "Mettre à jour le mot de passe"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Section Suppression de compte */}
      <div className="space-y-6">
        <div className="border-t border-base-300/50 pt-8">
          <div className="mb-4 flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-warning" />
            <h3 className="text-lg font-semibold text-base-content">
              Zone dangereuse !
            </h3>
          </div>
          <div className="rounded-lg border border-base-300/50 bg-base-100 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <Shield className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <h4 className="mb-2 font-semibold text-base-content">
                  Supprimer mon compte
                </h4>
                <p className="mb-4 text-sm text-base-content/70">
                  Cette action est irréversible. Toutes vos données, modèles,
                  chats et fichiers seront définitivement supprimés et ne
                  pourront plus être récupérés !
                </p>
                <button
                  onClick={openDeleteModal}
                  className="btn btn-error btn-sm text-white"
                >
                  Supprimer mon compte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de suppression de compte */}
      <DeleteAccountModal isOpen={showDeleteModal} onClose={closeDeleteModal} />
    </div>
    ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  );
}
////////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
