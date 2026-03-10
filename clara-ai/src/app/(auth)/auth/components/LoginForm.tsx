"use client";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { memo } from "react";
import Image from "next/image";
// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface LoginFormProps {
  loginEmail: string;
  loginPassword: string;
  showLoginPassword: boolean;
  isLoading: boolean;
  isDark: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
}
// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

const LoginForm = memo(
  ({
    loginEmail,
    loginPassword,
    showLoginPassword,
    isLoading,
    isDark,
    onEmailChange,
    onPasswordChange,
    onTogglePassword,
    onSubmit,
    onGoogleSignIn,
  }: LoginFormProps) => {
    // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
    return (
      <form
        onSubmit={onSubmit}
        className="flex h-full flex-col space-y-6 sm:space-y-8"
        noValidate
      >
        <div className="space-y-6 sm:space-y-8">
          <div className="form-control">
            <input
              type="email"
              value={loginEmail}
              onChange={onEmailChange}
              className="input h-12 w-full rounded-xl border border-base-content/10 bg-base-200/50 px-4 text-base-content transition-all duration-200 placeholder:text-base-content/50 focus:border-primary focus:bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:h-14"
              placeholder="E-mail"
              required
              aria-label="Adresse e-mail"
              autoComplete="email"
              name="email"
            />
          </div>

          <div className="form-control relative">
            <input
              type={showLoginPassword ? "text" : "password"}
              value={loginPassword}
              onChange={onPasswordChange}
              className="input h-12 w-full rounded-xl border border-base-content/10 bg-base-200/50 px-4 pr-12 text-base-content transition-all duration-200 placeholder:text-base-content/50 focus:border-primary focus:bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:h-14"
              placeholder="Mot de passe"
              required
              aria-label="Mot de passe"
              autoComplete="current-password"
              name="password"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute inset-y-0 right-3 flex items-center text-base-content/50 transition-colors duration-200 hover:text-base-content"
              aria-label={
                showLoginPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showLoginPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="hover:bg-primary-focus btn h-12 w-full rounded-xl bg-primary font-medium text-primary-content shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14"
            aria-label="Se connecter"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm" />
                <span className="animate-pulse">Connexion en cours...</span>
              </div>
            ) : (
              "Se connecter"
            )}
          </button>
        </div>

        <div className="flex-1 space-y-6 sm:space-y-8">
          <div className="relative">
            <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-full bg-base-content/10"></div>
              <div className="text-base-content/60">ou</div>
              <div className="h-[1px] w-full bg-base-content/10"></div>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoogleSignIn}
            className={`btn h-12 w-full rounded-xl bg-base-100/90 font-medium shadow-sm transition-all duration-200 hover:bg-base-100/70 hover:shadow-lg hover:shadow-base-content/5 sm:h-14 ${
              isDark
                ? ""
                : "border border-base-content/5 bg-base-300/35 hover:bg-base-300/55"
            }`}
            aria-label="Continuer avec Google"
          >
            <Image
              src="/icons/google.svg"
              alt="Logo Google"
              width={20}
              height={20}
              className="mr-2"
              unoptimized={true}
            />
            Continuer avec Google
          </button>
        </div>
      </form>
    );
    // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  },
);

LoginForm.displayName = "LoginForm";

export default LoginForm;
