"use client";

// ~ ///////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { memo, useState, useCallback, useMemo } from "react";
import { ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

// ~ ///////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
interface RegisterProfessionalFormProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  passwordTouched: boolean;
  confirmPasswordTouched: boolean;
  isPasswordValid: boolean;
  isConfirmPasswordValid: boolean;
  isLoading: boolean;
  isDark: boolean;
  // Champs professionnels
  denomination: string;
  address: string;
  siret: string;
  tva: string;
  billingAddress: string;
  // États de validation pour les champs professionnels
  emailTouched: boolean;
  denominationTouched: boolean;
  addressTouched: boolean;
  siretTouched: boolean;
  tvaTouched: boolean;
  billingAddressTouched: boolean;
  isEmailValid: boolean;
  isDenominationValid: boolean;
  isAddressValid: boolean;
  isSiretValid: boolean;
  isTvaValid: boolean;
  isBillingAddressValid: boolean;
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
  // Handlers pour les champs professionnels
  onDenominationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSiretChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTvaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBillingAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDenominationBlur: () => void;
  onAddressBlur: () => void;
  onSiretBlur: () => void;
  onTvaBlur: () => void;
  onBillingAddressBlur: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  getPasswordValidationMessage: (pwd: string) => string;
  passwordInputStyle: string;
  confirmPasswordInputStyle: string;
  // Fonctions de validation pour les champs professionnels
  getEmailValidationMessage: (email: string) => string;
  getSiretValidationMessage: (siret: string) => string;
  getTvaValidationMessage: (tva: string) => string;
  emailInputStyle: string;
  denominationInputStyle: string;
  addressInputStyle: string;
  siretInputStyle: string;
  tvaInputStyle: string;
  billingAddressInputStyle: string;
}
/////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

// ~ ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
const RegisterProfessionalForm = memo(
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
    isPasswordValid,
    isConfirmPasswordValid,
    isLoading,
    isDark,
    denomination,
    address,
    siret,
    tva,
    billingAddress: _billingAddress,
    emailTouched,
    denominationTouched,
    addressTouched,
    siretTouched,
    tvaTouched,
    billingAddressTouched: _billingAddressTouched,
    isEmailValid,
    isDenominationValid,
    isAddressValid,
    isSiretValid,
    isTvaValid,
    isBillingAddressValid,
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
    onDenominationChange,
    onAddressChange,
    onSiretChange,
    onTvaChange,
    onBillingAddressChange: _onBillingAddressChange,
    onDenominationBlur,
    onAddressBlur,
    onSiretBlur,
    onTvaBlur,
    onBillingAddressBlur: _onBillingAddressBlur,
    onSubmit,
    onBack,
    getPasswordValidationMessage,
    passwordInputStyle,
    confirmPasswordInputStyle,
    getEmailValidationMessage,
    getSiretValidationMessage,
    getTvaValidationMessage,
    emailInputStyle,
    denominationInputStyle,
    addressInputStyle,
    siretInputStyle,
    tvaInputStyle,
    billingAddressInputStyle: _billingAddressInputStyle,
  }: RegisterProfessionalFormProps) => {
    const [acceptCGU, setAcceptCGU] = useState(false);
    const [showCGUModal, setShowCGUModal] = useState(false);

    // ~ ///////////////////////////////////////////////////////////////////////////////FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////
    const handleCGUToggle = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setAcceptCGU(e.target.checked);
      },
      [],
    );

    const handleOpenCGUModal = useCallback(() => {
      setShowCGUModal(true);
    }, []);

    const handleCloseCGUModal = useCallback(() => {
      setShowCGUModal(false);
    }, []);

    // ~ ///////////////////////////////////////////////////////////////////////////////MEMOIZED VALUES///////////////////////////////////////////////////////////////////////////////////////
    const baseInputClasses = useMemo(
      () =>
        "input h-12 w-full rounded-xl border border-base-content/10 bg-base-200/50 px-4 text-base-content outline-none ring-0 placeholder:text-base-content/50 focus:border-base-content/10 focus:outline-none focus:ring-0 sm:h-14",
      [],
    );

    const isFormValid = useMemo(
      () =>
        isEmailValid &&
        isPasswordValid &&
        isConfirmPasswordValid &&
        acceptCGU &&
        isDenominationValid &&
        isAddressValid &&
        isSiretValid &&
        isBillingAddressValid,
      [
        isEmailValid,
        isPasswordValid,
        isConfirmPasswordValid,
        acceptCGU,
        isDenominationValid,
        isAddressValid,
        isSiretValid,
        isBillingAddressValid,
      ],
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
            autoComplete="email"
            aria-label="Adresse e-mail"
            aria-describedby="email-error"
            aria-invalid={emailTouched && !isEmailValid}
            maxLength={128}
          />
          {emailTouched && !isEmailValid && (
            <p id="email-error" className="mt-1 text-sm text-error">
              {getEmailValidationMessage(email)}
            </p>
          )}
        </div>

        {/* Champs professionnels */}
        <div className="space-y-4">
          <h4 className="text-center text-base font-medium text-base-content sm:text-lg">
            Informations professionnelles
          </h4>

          <div>
            <input
              type="text"
              value={denomination}
              onChange={onDenominationChange}
              onBlur={onDenominationBlur}
              className={`${baseInputClasses} ${denominationInputStyle}`}
              placeholder="Dénomination de l'entreprise"
              required
              name="denomination"
              aria-label="Dénomination de l'entreprise"
              aria-describedby="denomination-error"
              aria-invalid={denominationTouched && !isDenominationValid}
            />
            {denominationTouched && !isDenominationValid && (
              <p id="denomination-error" className="mt-1 text-sm text-error">
                La dénomination est requise
              </p>
            )}
          </div>

          <div>
            <input
              type="text"
              value={address}
              onChange={onAddressChange}
              onBlur={onAddressBlur}
              className={`${baseInputClasses} ${addressInputStyle}`}
              placeholder="Adresse de l'entreprise"
              required
              name="address"
              aria-label="Adresse de l'entreprise"
              aria-describedby="address-error"
              aria-invalid={addressTouched && !isAddressValid}
            />
            {addressTouched && !isAddressValid && (
              <p id="address-error" className="mt-1 text-sm text-error">
                L&apos;adresse est requise
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <div>
              <input
                type="text"
                value={siret}
                onChange={onSiretChange}
                onBlur={onSiretBlur}
                className={`${baseInputClasses} ${siretInputStyle}`}
                placeholder="SIRET (14 chiffres)"
                required
                name="siret"
                aria-label="SIRET"
                aria-describedby="siret-error"
                aria-invalid={siretTouched && !isSiretValid}
                maxLength={14}
              />
              {siretTouched && !isSiretValid && (
                <p id="siret-error" className="mt-1 text-sm text-error">
                  {getSiretValidationMessage(siret)}
                </p>
              )}
            </div>
            <div>
              <input
                type="text"
                value={tva}
                onChange={onTvaChange}
                onBlur={onTvaBlur}
                className={`${baseInputClasses} ${tvaInputStyle}`}
                placeholder="TVA (optionnel)"
                name="tva"
                aria-label="TVA"
                aria-describedby="tva-error"
                aria-invalid={tvaTouched && !isTvaValid}
              />
              {tvaTouched && !isTvaValid && tva.trim() !== "" && (
                <p id="tva-error" className="mt-1 text-sm text-error">
                  {getTvaValidationMessage(tva)}
                </p>
              )}
            </div>
          </div>

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

        {/* Case à cocher CGU */}
        <div className="flex items-center space-x-2">
          <input
            id="accept-cgu"
            type="checkbox"
            checked={acceptCGU}
            onChange={handleCGUToggle}
            className="checkbox-primary checkbox"
            required
            aria-describedby="cgu-description"
          />
          <label htmlFor="accept-cgu" className="text-sm text-base-content">
            En vous inscrivant, vous acceptez les{" "}
            <button
              type="button"
              className="rounded text-primary underline hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
              onClick={handleOpenCGUModal}
              aria-describedby="cgu-description"
            >
              CGU
            </button>
          </label>
        </div>
        <p id="cgu-description" className="sr-only">
          Vous devez accepter les conditions générales d&apos;utilisation pour
          continuer
        </p>

        {/* Modale CGU */}
        <Dialog
          open={showCGUModal}
          onClose={handleCloseCGUModal}
          className="relative z-50"
          aria-modal="true"
          aria-labelledby="cgu-modal-title"
          aria-describedby="cgu-modal-content"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-4xl rounded-2xl bg-base-100 p-6 shadow-xl">
              <DialogTitle
                id="cgu-modal-title"
                className="mb-4 text-lg font-bold text-base-content"
              >
                Conditions Générales d&apos;Utilisation
              </DialogTitle>
              <div
                id="cgu-modal-content"
                className="prose mb-6 max-h-96 max-w-none overflow-y-auto text-base-content/80"
              >
                <p className="mb-4 text-sm font-semibold">
                  En vigueur au 1 septembre 2025
                </p>

                <h4 className="mb-2 mt-4 font-bold text-base-content">
                  Article 1 – Éditeur et mentions légales
                </h4>
                <p className="mb-3">
                  La plateforme Clara AI a été initialement développée par
                  SAVWINK SOFTWARE (SAS, 5 rue du Calvaire, 44410 Asserac,
                  France). Ce projet est publié sous licence MIT.
                </p>

                <h4 className="mb-2 mt-4 font-bold text-base-content">
                  Article 2 – Objet
                </h4>
                <p className="mb-3">
                  Les présentes CGU définissent les conditions d&apos;accès et
                  d&apos;utilisation de la plateforme d&apos;intelligence
                  artificielle hybride Clara AI, accessible via abonnement,
                  proposée aux utilisateurs professionnels et
                  semi-professionnels.
                </p>

                <h4 className="mb-2 mt-4 font-bold text-base-content">
                  Article 3 – Services proposés
                </h4>
                <ul className="mb-3 list-disc pl-5">
                  <li>
                    Création de modèles IA via méthodes assistée (rapide) ou
                    manuelle (avancée).
                  </li>
                  <li>
                    Interaction avec agents conversationnels ou &quot;Experts
                    Clara&quot;, enrichis de documents utilisateurs ou métiers.
                  </li>
                  <li>
                    Téléversement de documents permanents (pour entraînement) ou
                    temporaires (usage unique en chat).
                  </li>
                  <li>
                    Accès au catalogue de Modèles Clara.
                  </li>
                  <li>
                    Système de tickets de support intégré avec suivi des
                    demandes.
                  </li>
                  <li>
                    En version locale, l&apos;accès est régi par la
                    configuration de l&apos;instance (plans gérés par
                    l&apos;administrateur).
                  </li>
                </ul>

                <h4 className="mb-2 mt-4 font-bold text-base-content">
                  Article 4 – Accès et plan
                </h4>
                <p className="mb-3">
                  En version locale, aucun abonnement payant n&apos;est requis.
                  Votre plan est attribué à l&apos;inscription et peut être
                  consulté dans les paramètres. Les modèles du catalogue sont
                  accessibles selon la configuration de votre instance.
                </p>

                <h4 className="mb-2 mt-4 font-bold text-base-content">
                  Article 5 – Droits et propriété intellectuelle
                </h4>
                <ul className="mb-3 list-disc pl-5">
                  <li>
                    L&apos;utilisateur conserve la totalité des droits de
                    propriété intellectuelle sur les modèles et créations
                    qu&apos;il génère via Clara AI, sauf disposition contraire
                    expressément acceptée.
                  </li>
                  <li>
                    Savwink Software reste propriétaire de la plateforme, de ses
                    contenus, interfaces, bibliothèques, et expertises métiers.
                  </li>
                </ul>

                <h4 className="mb-2 mt-4 font-bold text-base-content">
                  Article 6 – Données personnelles et RGPD
                </h4>

                <h5 className="mb-2 mt-3 font-semibold text-base-content">
                  6.1 Données utilisateur
                </h5>
                <p className="mb-3">
                  Les données fournies (documents, prompts, conversations) sont
                  utilisées uniquement dans le cadre du fonctionnement de la
                  plateforme. Elles ne sont jamais revendues, ni exploitées à
                  des fins publicitaires ou d&apos;entraînement
                  d&apos;algorithmes tiers.
                </p>
                <p className="mb-3">
                  Les documents temporaires sont automatiquement supprimés à la
                  fin de la session. Les documents permanents sont conservés
                  uniquement sur demande explicite de l&apos;utilisateur, dans
                  un espace sécurisé, et peuvent être supprimés à tout moment.
                </p>
                <p className="mb-3">
                  Les données de tickets de support sont conservées pour le
                  suivi des demandes. Les logs d&apos;activité utilisateur sont
                  conservés pour la sécurité et l&apos;audit.
                </p>

                <h5 className="mb-2 mt-3 font-semibold text-base-content">
                  6.2 Confidentialité et sécurité
                </h5>
                <p className="mb-2">
                  Savwink Software met en œuvre des mesures techniques et
                  organisationnelles robustes pour garantir la sécurité et la
                  confidentialité des données :
                </p>
                <ul className="mb-3 list-disc pl-5">
                  <li>Authentification sécurisée</li>
                  <li>Chiffrement des données en transit et au repos</li>
                  <li>Segmentation des accès</li>
                  <li>Journalisation des actions sensibles</li>
                </ul>

                <h5 className="mb-2 mt-3 font-semibold text-base-content">
                  6.3 Traitement des données par les fournisseurs LLM
                </h5>
                <p className="mb-3">
                  La plateforme Clara AI repose sur l&apos;intégration de
                  plusieurs modèles LLM via API. Savwink Software a activé
                  l&apos;option &quot;Zero Data Retention&quot; auprès de tous
                  ses fournisseurs, garantissant que :
                </p>
                <ul className="mb-3 list-disc pl-5">
                  <li>
                    Aucune donnée utilisateur (prompts, fichiers, réponses)
                    n&apos;est conservée par les fournisseurs d&apos;IA.
                  </li>
                  <li>
                    Aucune donnée n&apos;est utilisée pour l&apos;entraînement
                    ou l&apos;amélioration des modèles.
                  </li>
                  <li>
                    Aucune donnée n&apos;est stockée au-delà de la session, y
                    compris pour la modération ou le suivi.
                  </li>
                </ul>
                <p className="mb-3">Ces fournisseurs incluent notamment :</p>
                <ul className="mb-3 list-disc pl-5">
                  <li>OpenAI (via endpoints européens – eu.api.openai.com)</li>
                  <li>
                    Anthropic (Claude), y compris sous BAA étendue avec ZDR
                  </li>
                  <li>
                    Mistral AI, selon leur politique de non-conservation sous
                    ZDR activé
                  </li>
                  <li>
                    Google Gemini, avec API en version payante et options de
                    désactivation de tout traitement à des fins
                    d&apos;amélioration
                  </li>
                </ul>
                <p className="mb-3">
                  L&apos;ensemble des flux transitent exclusivement via des
                  infrastructures situées dans l&apos;Espace économique européen
                  (EEE) ou validées RGPD.
                </p>

                <h5 className="mb-2 mt-3 font-semibold text-base-content">
                  6.4 Exercice des droits
                </h5>
                <p className="mb-3">
                  Conformément au Règlement général sur la protection des
                  données (RGPD – UE 2016/679), chaque utilisateur dispose
                  d&apos;un droit d&apos;accès, rectification, suppression,
                  limitation, portabilité et opposition.
                </p>
                <p className="mb-3">
                  Toute demande peut être adressée à l&apos;adresse suivante :
                  <br />
                  <strong>
                    {process.env.NEXT_PUBLIC_SUPPORT_EMAIL ??
                      "support@example.com"}
                  </strong>
                  <br />
                  ou par courrier à :<br />
                  <strong>
                    SAVWINK SOFTWARE – 5 rue du Calvaire, 44410 Asserac, France.
                  </strong>
                </p>

                <h4 className="mb-2 mt-4 font-bold text-base-content">
                  Article 7 – Responsabilité
                </h4>
                <ul className="mb-3 list-disc pl-5">
                  <li>
                    Savwink Software s&apos;engage à fournir Clara AI conforme à
                    sa documentation.
                  </li>
                  <li>
                    L&apos;utilisateur est seul responsable du contenu uploadé
                    (droits, licéité), de l&apos;utilisation des réponses IA, et
                    de leur diffusion.
                  </li>
                  <li>
                    La plateforme est fournie &quot;en l&apos;état&quot;, sans
                    garantie de disponibilité non interrompue, performances,
                    suppression d&apos;erreurs, ni résultats parfaits.
                  </li>
                  <li>
                    Savwink renonçait à toute responsabilité pour dommages
                    indirects, perte de données ou chiffrage.
                  </li>
                  <li>
                    Savwink Software n&apos;est pas responsable des
                    dysfonctionnements des services tiers (fournisseurs IA,
                    hébergement).
                  </li>
                  <li>
                    L&apos;utilisateur est responsable de l&apos;usage de la
                    plateforme.
                  </li>
                </ul>

                <h4 className="mb-2 mt-4 font-bold text-base-content">
                  Article 8 – Règles d&apos;usage et interdictions
                </h4>
                <p className="mb-2">
                  L&apos;utilisateur s&apos;engage à ne pas :
                </p>
                <ul className="mb-3 list-disc pl-5">
                  <li>
                    utiliser Clara AI à des fins illégales, illicites,
                    haineuses, violentes, pédopornographiques, incitants au
                    terrorisme, etc.
                  </li>
                  <li>
                    téléverser du contenu protégé sans autorisation ou de nature
                    délictueuse.
                  </li>
                  <li>
                    contourner les protections de droits d&apos;auteur, reverse
                    engineer la plateforme ou API.
                  </li>
                  <li>
                    utiliser l&apos;IA pour de la pratique médicale,
                    diagnostique légal ou autre nécessitant compétences
                    certifiées.
                  </li>
                </ul>

                <h5 className="mb-2 mt-3 font-semibold text-base-content">
                  8.1 Usages dans le domaine médical, juridique ou réglementé
                </h5>
                <p className="mb-3">
                  La plateforme Clara AI peut être utilisée pour concevoir ou
                  exploiter des modèles à visée médicale, juridique ou
                  réglementée uniquement par des professionnels qualifiés et
                  habilités, dans les limites fixées par la réglementation
                  applicable (ex. : code de déontologie médicale, obligation
                  d&apos;information, secret médical, supervision humaine).
                </p>
                <ul className="mb-3 list-disc pl-5">
                  <li>
                    Clara AI n&apos;est pas un dispositif médical au sens du
                    Règlement (UE) 2017/745.
                  </li>
                  <li>
                    Les résultats produits par les modèles IA ne peuvent en
                    aucun cas se substituer à un avis médical ou juridique
                    délivré par un professionnel compétent.
                  </li>
                  <li>
                    L&apos;utilisateur est seul responsable de l&apos;usage des
                    résultats générés dans ces contextes, notamment en matière
                    de diagnostic, de traitement, de prescription ou de décision
                    juridique.
                  </li>
                </ul>
                <p className="mb-3">
                  Savwink Software décline toute responsabilité en cas de
                  mauvaise interprétation ou d&apos;usage non conforme aux
                  obligations professionnelles ou légales applicables.
                </p>

                <h4 className="mb-2 mt-4 font-bold text-base-content">
                  Article 9 – Durée et suspension
                </h4>
                <ul className="mb-3 list-disc pl-5">
                  <li>
                    Les CGU entrent en vigueur dès acceptation par
                    l&apos;utilisateur.
                  </li>
                  <li>
                    Savwink peut suspendre ou résilier un compte en cas de
                    violation grave des CGU, activité illégale ou risque pour
                    la plateforme.
                  </li>
                  <li>
                    L&apos;utilisateur peut supprimer son compte à tout moment
                    depuis les paramètres.
                  </li>
                </ul>

                <h4 className="mb-2 mt-4 font-bold text-base-content">
                  Article 10 – Modification des CGU
                </h4>
                <p className="mb-3">
                  Savwink se réserve le droit de modifier les CGU à tout moment,
                  avec information préalable de 30 jours avant application.
                  L&apos;usage de la plateforme après modification implique
                  acceptation tacite.
                </p>

                <h4 className="mb-2 mt-4 font-bold text-base-content">
                  Article 11 – Catalogue de Modèles Clara
                </h4>
                <p className="mb-3">
                  En version locale, l&apos;accès au catalogue de modèles Clara
                  est régi par le plan attribué à votre compte (configuration
                  de l&apos;instance). Les modèles sont activables depuis la
                  page Store et la gestion des accès se fait dans les
                  paramètres, section &quot;Gestion des modèles Clara&quot;.
                </p>

                <h4 className="mb-2 mt-4 font-bold text-base-content">
                  Article 12 – Système de Support
                </h4>

                <h5 className="mb-2 mt-3 font-semibold text-base-content">
                  12.1 Tickets de Support
                </h5>
                <p className="mb-3">
                  Clara AI dispose d&apos;un système de tickets de support
                  intégré accessible via le Centre d&apos;Aide.
                </p>

                <h5 className="mb-2 mt-3 font-semibold text-base-content">
                  12.2 Processus de Résolution
                </h5>
                <p className="mb-3">
                  Les tickets suivent un processus de résolution avec
                  notifications email automatiques.
                </p>

                <h5 className="mb-2 mt-3 font-semibold text-base-content">
                  12.3 Responsabilité du Support
                </h5>
                <p className="mb-3">
                  Le support s&apos;engage à traiter les demandes dans les
                  meilleurs délais.
                </p>

                <h4 className="mb-2 mt-4 font-bold text-base-content">
                  Article 13 – Droit applicable et juridiction compétente
                </h4>
                <p className="mb-3">
                  Les relations entre l&apos;utilisateur et Savwink sont
                  soumises au droit français. En cas de litige, les parties
                  s&apos;efforcent d&apos;abord d&apos;une résolution amiable. À
                  défaut, les tribunaux compétents sont ceux de Nantes (44).
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={handleCloseCGUModal}
                aria-label="Fermer les conditions générales d'utilisation"
              >
                Fermer
              </button>
            </DialogPanel>
          </div>
        </Dialog>

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
            Veuillez remplir tous les champs requis et accepter les conditions
            générales d&apos;utilisation
          </p>
        )}
      </form>
    );
  },
  //////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
);

RegisterProfessionalForm.displayName = "RegisterProfessionalForm";

export default RegisterProfessionalForm;
