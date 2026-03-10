"use client";

// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { memo } from "react";
import { User, Building2, Mail } from "lucide-react";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface RegisterTypeSelectorProps {
  isDark: boolean;
  onSelect: (type: "personal" | "professional") => void;
  onContactClick: () => void;
}
// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
const RegisterTypeSelector = memo(
  ({ isDark, onSelect, onContactClick }: RegisterTypeSelectorProps) => (
    //////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-6">
        <div className="mt-6 flex flex-col justify-center gap-6 sm:mt-8 sm:flex-row sm:gap-8 md:gap-10">
          <div
            onClick={() => onSelect("personal")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect("personal");
              }
            }}
            aria-label="Choisir un compte personnel"
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-base-content/10 bg-base-200/50 p-6 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-base-300 hover:bg-base-300/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:p-8"
          >
            <div
              aria-hidden="true"
              className={`absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent opacity-0 transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100 ${isDark ? "via-secondary/10" : "via-primary/10"} to-transparent`}
            />
            <div className="relative flex flex-col items-center gap-6 sm:gap-8">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl sm:h-20 sm:w-20 ${isDark ? "bg-base-200" : "bg-base-300/30"} text-base-content/70 transition-all duration-200 group-hover:scale-110 group-hover:text-base-content`}
              >
                <User className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" />
              </div>
              <div className="text-center">
                <h4 className="text-xl font-semibold text-base-content/70 transition-colors duration-200 group-hover:text-base-content sm:text-2xl">
                  Compte Personnel
                </h4>
                <p className="mt-2 text-sm text-base-content/70 transition-colors duration-200 group-hover:text-base-content sm:mt-3 sm:text-base">
                  Parfait pour les utilisateurs individuels
                </p>
              </div>
            </div>
          </div>
          <div
            onClick={() => onSelect("professional")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect("professional");
              }
            }}
            aria-label="Choisir un compte professionnel"
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-base-content/10 bg-base-200/50 p-6 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-base-300 hover:bg-base-300/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:p-8"
          >
            <div
              aria-hidden="true"
              className={`absolute inset-0 -translate-x-full rotate-12 scale-x-150 bg-gradient-to-r from-transparent opacity-0 transition-all duration-300 group-hover:translate-x-full group-hover:opacity-100 ${isDark ? "via-secondary/10" : "via-primary/10"} to-transparent`}
            />
            <div className="relative flex flex-col items-center gap-6 sm:gap-8">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl sm:h-20 sm:w-20 ${isDark ? "bg-base-200" : "bg-base-300/30"} text-base-content/70 transition-all duration-200 group-hover:scale-110 group-hover:text-base-content`}
              >
                <Building2
                  className="h-8 w-8 sm:h-10 sm:w-10"
                  aria-hidden="true"
                />
              </div>
              <div className="text-center">
                <h4 className="text-xl font-semibold text-base-content/70 transition-colors duration-200 group-hover:text-base-content sm:text-2xl">
                  Compte Professionnel
                </h4>
                <p className="mt-2 text-sm text-base-content/70 transition-colors duration-200 group-hover:text-base-content sm:mt-3 sm:text-base">
                  Pour les professionnels et entreprises
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lien pour besoins spécifiques */}
        <div className="mt-8 text-center">
          <p className="mb-4 text-sm text-base-content/60">
            Besoin de plusieurs comptes ou d&apos;une solution personnalisée ?
          </p>
          <button
            onClick={onContactClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80 hover:underline"
          >
            <Mail className="h-4 w-4" />
            Contactez-nous
          </button>
        </div>
      </div>
    </div>
  ),
  //////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
);
// ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

RegisterTypeSelector.displayName = "RegisterTypeSelector";

export default RegisterTypeSelector;
