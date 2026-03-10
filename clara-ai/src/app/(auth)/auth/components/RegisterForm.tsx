"use client";

// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { memo, useMemo } from "react";
import { ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface RegisterFormProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  passwordTouched: boolean;
  confirmPasswordTouched: boolean;
  emailTouched: boolean;
  isPasswordValid: boolean;
  isConfirmPasswordValid: boolean;
  isEmailValid: boolean;
  isLoading: boolean;
  isDark: boolean;
  onFirstNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLastNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordBlur: () => void;
  onConfirmPasswordBlur: () => void;
  onEmailBlur: () => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  getPasswordValidationMessage: (pwd: string) => string;
  getEmailValidationMessage: (email: string) => string;
  passwordInputStyle: string;
  confirmPasswordInputStyle: string;
  emailInputStyle: string;
}
/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
const RegisterForm = memo(
  ({
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    passwordTouched,
    confirmPasswordTouched,
    emailTouched,
    isPasswordValid,
    isConfirmPasswordValid,
    isEmailValid,
    isLoading,
    isDark,
    onFirstNameChange,
    onLastNameChange,
    onEmailChange,
    onPasswordChange,
    onConfirmPasswordChange,
    onPasswordBlur,
    onConfirmPasswordBlur,
    onEmailBlur,
    onTogglePassword,
    onToggleConfirmPassword,
    onSubmit,
    onBack,
    getPasswordValidationMessage,
    getEmailValidationMessage,
    passwordInputStyle,
    confirmPasswordInputStyle,
    emailInputStyle,
  }: RegisterFormProps) => {
    // ~ ///////////////////////////////////////////////////////////////////////////////MEMOIZED VALUES///////////////////////////////////////////////////////////////////////////////////////
    const baseInputClasses = useMemo(
      () =>
        "input h-12 w-full rounded-xl border border-base-content/10 bg-base-200/50 px-4 text-base-content outline-none ring-0 placeholder:text-base-content/50 focus:border-base-content/10 focus:outline-none focus:ring-0 sm:h-14",
      [],
    );

    const isFormValid = useMemo(
      () =>
        isEmailValid && isPasswordValid && isConfirmPasswordValid,
      [isEmailValid, isPasswordValid, isConfirmPasswordValid],
    );

    const backButtonClasses = useMemo(
      () =>
        `btn h-12 rounded-xl bg-base-200/30 px-4 font-medium shadow-sm transition-all hover:bg-base-200/50 hover:shadow-base-content/20 sm:h-14 sm:px-6 ${
          isDark ? "" : "border border-base-content/10"
        }`,
      [isDark],
    );
    /////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

    // ~ ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
    return (
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <h3 className="text-center text-lg font-medium text-base-content sm:text-xl">
          Vos informations
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <input
            type="text"
            value={firstName}
            onChange={onFirstNameChange}
            className={baseInputClasses}
            placeholder="Prénom"
            required
            name="firstName"
            autoComplete="given-name"
            aria-label="Prénom"
            aria-describedby="firstName-error"
          />
          <input
            type="text"
            value={lastName}
            onChange={onLastNameChange}
            className={baseInputClasses}
            placeholder="Nom"
            required
            name="lastName"
            autoComplete="family-name"
            aria-label="Nom"
            aria-describedby="lastName-error"
          />
        </div>

        <div>
          <input
            type="email"
            value={email}
            onChange={onEmailChange}
            onBlur={onEmailBlur}
            className={`${baseInputClasses} ${emailInputStyle}`}
            placeholder="E-mail"
            required
            name="email"
            maxLength={128}
            autoComplete="email"
            aria-label="Adresse e-mail"
            aria-describedby="email-error"
            aria-invalid={emailTouched && !isEmailValid}
          />
          {emailTouched && !isEmailValid && (
            <p id="email-error" className="mt-1 text-sm text-error">
              {getEmailValidationMessage(email)}
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={onPasswordChange}
              onBlur={onPasswordBlur}
              className={`${baseInputClasses} pr-12 ${passwordInputStyle}`}
              placeholder="Mot de passe"
              required
              name="password"
              maxLength={40}
              autoComplete="new-password"
              aria-label="Mot de passe"
              aria-describedby="password-error"
              aria-invalid={passwordTouched && !isPasswordValid}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute inset-y-0 right-3 flex items-center rounded text-base-content/50 hover:text-base-content focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
          {passwordTouched && !isPasswordValid && (
            <p
              id="password-error"
              className="mt-2 text-xs text-error"
              role="alert"
            >
              {getPasswordValidationMessage(password)}
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={onConfirmPasswordChange}
              onBlur={onConfirmPasswordBlur}
              className={`${baseInputClasses} pr-12 ${confirmPasswordInputStyle}`}
              placeholder="Confirmer le mot de passe"
              required
              name="confirmPassword"
              maxLength={40}
              autoComplete="new-password"
              aria-label="Confirmer le mot de passe"
              aria-describedby="confirmPassword-error"
              aria-invalid={confirmPasswordTouched && !isConfirmPasswordValid}
            />
            <button
              type="button"
              onClick={onToggleConfirmPassword}
              className="absolute inset-y-0 right-3 flex items-center rounded text-base-content/50 hover:text-base-content focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label={
                showConfirmPassword
                  ? "Masquer la confirmation du mot de passe"
                  : "Afficher la confirmation du mot de passe"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
          {confirmPasswordTouched && !isConfirmPasswordValid && (
            <p
              id="confirmPassword-error"
              className="mt-2 text-xs text-error"
              role="alert"
            >
              Les mots de passe ne correspondent pas
            </p>
          )}
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            className={backButtonClasses}
            aria-label="Retour à l'étape précédente"
          >
            <ArrowLeft
              className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
              aria-hidden="true"
            />
            Retour
          </button>
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="btn h-12 rounded-xl bg-primary px-4 font-medium text-primary-content shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:px-6"
            aria-describedby={
              !isFormValid ? "form-validation-error" : undefined
            }
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span
                  className="loading loading-spinner loading-sm"
                  aria-hidden="true"
                />
                <span className="animate-pulse">Création en cours...</span>
              </div>
            ) : (
              <>
                Continuer
                <ArrowRight
                  className="ml-2 h-4 w-4 sm:h-5 sm:w-5"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </div>

        {!isFormValid && (
          <p id="form-validation-error" className="sr-only" role="alert">
            Veuillez remplir tous les champs requis
          </p>
        )}
      </form>
    );
  },
  //////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
);

RegisterForm.displayName = "RegisterForm";

export default RegisterForm;
