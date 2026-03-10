"use client";

import { useState } from "react";
import { Send, CheckCircle, ArrowLeft } from "lucide-react";

interface ContactFormProps {
  onBack: () => void;
}

export default function ContactForm({ onBack }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // États pour la validation
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [accountCount, setAccountCount] = useState("");

  // États de validation
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [lastNameTouched, setLastNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [accountCountTouched, setAccountCountTouched] = useState(false);

  // Validation
  const isFirstNameValid = firstName.trim().length >= 2;
  const isLastNameValid = lastName.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhoneValid = /^[0-9+\-\s()]{10,}$/.test(phone);
  const isDescriptionValid = description.trim().length >= 10;
  const isAccountCountValid =
    /^[0-9]+$/.test(accountCount) && parseInt(accountCount) > 0;

  const isFormValid =
    isFirstNameValid &&
    isLastNameValid &&
    isEmailValid &&
    isPhoneValid &&
    isDescriptionValid &&
    isAccountCountValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          description,
          accountCount: parseInt(accountCount),
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        throw new Error("Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'envoi du message. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/20">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-center text-lg font-medium text-base-content sm:text-xl">
            Demande envoyée !
          </h3>
          <p className="mb-6 text-base-content/70">
            Nous avons bien reçu votre demande. Notre équipe vous contactera
            dans les plus brefs délais.
          </p>
          <button
            onClick={onBack}
            className="btn h-12 w-full rounded-xl bg-primary px-4 font-medium text-primary-content shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/30 sm:h-14 sm:px-6"
          >
            Retour à l&apos;inscription
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <h3 className="text-center text-lg font-medium text-base-content sm:text-xl">
        Besoin spécifique ?
      </h3>

      {/* Nom et Prénom */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-base-content">
            Prénom *
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onBlur={() => setFirstNameTouched(true)}
            className={`input input-bordered w-full ${
              firstNameTouched && !isFirstNameValid ? "input-error" : ""
            }`}
            placeholder="Votre prénom"
          />
          {firstNameTouched && !isFirstNameValid && (
            <p className="mt-1 text-sm text-error">
              Le prénom doit contenir au moins 2 caractères
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-base-content">
            Nom *
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onBlur={() => setLastNameTouched(true)}
            className={`input input-bordered w-full ${
              lastNameTouched && !isLastNameValid ? "input-error" : ""
            }`}
            placeholder="Votre nom"
          />
          {lastNameTouched && !isLastNameValid && (
            <p className="mt-1 text-sm text-error">
              Le nom doit contenir au moins 2 caractères
            </p>
          )}
        </div>
      </div>

      {/* Email et Téléphone */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-base-content">
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            className={`input input-bordered w-full ${
              emailTouched && !isEmailValid ? "input-error" : ""
            }`}
            placeholder="votre@email.com"
          />
          {emailTouched && !isEmailValid && (
            <p className="mt-1 text-sm text-error">
              Format d&apos;email invalide
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-base-content">
            Téléphone *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => setPhoneTouched(true)}
            className={`input input-bordered w-full ${
              phoneTouched && !isPhoneValid ? "input-error" : ""
            }`}
            placeholder="06 12 34 56 78"
          />
          {phoneTouched && !isPhoneValid && (
            <p className="mt-1 text-sm text-error">
              Format de téléphone invalide
            </p>
          )}
        </div>
      </div>

      {/* Nombre de comptes */}
      <div>
        <label className="mb-2 block text-sm font-medium text-base-content">
          Nombre de comptes demandés *
        </label>
        <input
          type="number"
          value={accountCount}
          onChange={(e) => setAccountCount(e.target.value)}
          onBlur={() => setAccountCountTouched(true)}
          className={`input input-bordered w-full ${
            accountCountTouched && !isAccountCountValid ? "input-error" : ""
          }`}
          placeholder="5"
          min="1"
        />
        {accountCountTouched && !isAccountCountValid && (
          <p className="mt-1 text-sm text-error">
            Veuillez entrer un nombre valide (minimum 1)
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium text-base-content">
          Description de vos besoins *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => setDescriptionTouched(true)}
          className={`textarea textarea-bordered h-24 w-full ${
            descriptionTouched && !isDescriptionValid ? "textarea-error" : ""
          }`}
          placeholder="Décrivez vos besoins spécifiques, le contexte d'utilisation, etc."
        />
        {descriptionTouched && !isDescriptionValid && (
          <p className="mt-1 text-sm text-error">
            La description doit contenir au moins 10 caractères
          </p>
        )}
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="btn h-12 rounded-xl bg-base-200/30 px-4 font-medium shadow-sm transition-all hover:bg-base-200/50 hover:shadow-base-content/20 sm:h-14 sm:px-6"
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
          disabled={isSubmitting || !isFormValid}
          className="btn h-12 rounded-xl bg-primary px-4 font-medium text-primary-content shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:px-6"
          aria-describedby={!isFormValid ? "form-validation-error" : undefined}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <span className="loading loading-spinner loading-sm mr-2"></span>
              <span className="animate-pulse">Envoi en cours...</span>
            </div>
          ) : (
            <>
              Envoyer
              <Send className="ml-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
