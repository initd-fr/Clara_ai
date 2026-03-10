////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  Suspense,
  lazy,
} from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { APP_CONFIG } from "~/app/config";
import { api } from "~/trpc/react";
import { Logo } from "../../_components/Logo";
////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////TYPES///////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
// Hook personnalisé pour le debounce avec optimisation
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
////////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

// Composants lazy loaded pour optimiser le bundle
const ThemeToggle = lazy(() => import("./components/ThemeToggle"));
const LoginForm = lazy(() => import("./components/LoginForm"));
const RegisterForm = lazy(() => import("./components/RegisterForm"));

// Composant de skeleton loading
const LoadingSkeleton = memo(() => (
  <div className="animate-pulse space-y-4">
    <div className="h-12 rounded-xl bg-base-300/50 sm:h-14" />
    <div className="h-12 rounded-xl bg-base-300/50 sm:h-14" />
    <div className="h-12 rounded-xl bg-base-300/50 sm:h-14" />
  </div>
));

// Composants optimisés avec React.memo
const TabNavigation = memo(
  ({
    activeTab,
    setActiveTab,
  }: {
    activeTab: "login" | "register";
    setActiveTab: (tab: "login" | "register") => void;
  }) => (
    <div
      className="tabs-boxed tabs relative bg-base-200 p-1"
      role="tablist"
      aria-label="Navigation authentification"
    >
      <div
        className={`absolute h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-lg bg-primary shadow-lg shadow-primary/20 transition-all duration-700 ease-out ${
          activeTab === "login" ? "left-1 top-1" : "left-[calc(50%-2px)] top-1"
        }`}
      />
      <button
        className={`tab relative z-10 flex-1 outline-none transition-all duration-700 ease-out ${
          activeTab === "login"
            ? "text-primary-content"
            : "hover:bg-base-100/50"
        }`}
        onClick={() => setActiveTab("login")}
        role="tab"
        aria-selected={activeTab === "login"}
        aria-controls="tab-login"
      >
        Connexion
      </button>
      <button
        className={`tab relative z-10 flex-1 outline-none transition-all duration-700 ease-out ${
          activeTab === "register"
            ? "text-primary-content"
            : "hover:bg-base-100/50"
        }`}
        onClick={() => setActiveTab("register")}
        role="tab"
        aria-selected={activeTab === "register"}
        aria-controls="tab-register"
      >
        Inscription
      </button>
    </div>
  ),
);

const BackgroundWaves = memo(() => (
  <div className="absolute inset-0">
    <div className="absolute bottom-0 left-0 right-0 h-[800px] bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 blur-3xl" />
    <div className="absolute -left-32 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-3xl" />
    <div className="absolute -right-32 top-64 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-secondary/10 to-accent/10 blur-3xl" />
  </div>
));

// Optimisation des noms d'affichage
LoadingSkeleton.displayName = "LoadingSkeleton";
TabNavigation.displayName = "TabNavigation";
BackgroundWaves.displayName = "BackgroundWaves";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);

  // États du formulaire de connexion
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // États du formulaire d'inscription
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const searchParams = useSearchParams();

  // Optimisation avec debounce pour la validation
  const debouncedEmail = useDebounce(email, 300);
  const debouncedPassword = useDebounce(password, 300);
  const debouncedConfirmPassword = useDebounce(confirmPassword, 300);

  // Optimisation du thème avec useMemo
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        return savedTheme === "dark";
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////

  // Optimisation des effets avec useCallback
  const initializeTheme = useCallback(() => {
    const html = document.documentElement;
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      html.setAttribute("data-theme", savedTheme);
      setIsDark(savedTheme === "dark");
    } else {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      html.setAttribute("data-theme", systemDark ? "dark" : "light");
      setIsDark(systemDark);
      localStorage.setItem("theme", systemDark ? "dark" : "light");
    }
  }, []);

  const handleThemeChange = useCallback((e: MediaQueryListEvent) => {
    if (!localStorage.getItem("theme")) {
      const newTheme = e.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      setIsDark(e.matches);
      localStorage.setItem("theme", newTheme);
    }
  }, []);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", handleThemeChange);
    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, [handleThemeChange]);
  ///////////////////////////////////////////////////////////////////////////////EFFECTS///////////////////////////////////////////////////////////////////////////////////////

  const toggleTheme = useCallback(() => {
    const newTheme = !isDark;
    const html = document.documentElement;

    html.setAttribute("data-theme", newTheme ? "dark" : "light");
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    setIsDark(newTheme);
  }, [isDark]);

  // Optimisation des handlers avec useCallback et throttling
  const handleLoginSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        const login = await signIn("credentials", {
          email: loginEmail,
          password: loginPassword,
          redirect: false,
        });

        if (!login?.ok) {
          toast.error(
            login?.error || "Une erreur est survenue lors de la connexion",
          );
          return;
        }

        toast.success("Connecté avec succès !");
        window.location.href = searchParams.get("callbackUrl") ?? "/home";
      } catch (error) {
        console.error("Erreur de connexion:", error);
        toast.error("Une erreur est survenue lors de la connexion");
      } finally {
        setIsLoading(false);
      }
    },
    [loginEmail, loginPassword, searchParams],
  );

  const createUser = api.user.register.useMutation({
    onSuccess: async () => {
      try {
        const login = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (!login?.ok) {
          toast.error(
            login?.error || "Une erreur est survenue lors de la connexion",
          );
          return;
        }

        toast.success("Compte créé et connecté avec succès !");
        window.location.href = searchParams.get("callbackUrl") ?? "/home";
      } catch (error) {
        console.error("Erreur de connexion après inscription:", error);
        toast.error("Compte créé mais erreur lors de la connexion");
      }
    },
  });

  const handleRegisterSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        await createUser.mutateAsync({
          email,
          firstName,
          lastName,
          password,
          accountType: "personal",
        });
      } catch (error: any) {
        console.error("Erreur lors de l'inscription:", error);

        // Gestion des erreurs spécifiques
        if (error?.data?.code === "CONFLICT") {
          toast.error("Un compte avec cet email existe déjà");
        } else if (error?.data?.code === "BAD_REQUEST") {
          toast.error("Données invalides. Vérifiez vos informations");
        } else if (error?.message?.includes("email")) {
          toast.error("Adresse email invalide");
        } else if (error?.message?.includes("password")) {
          toast.error("Mot de passe invalide");
        } else {
          toast.error("Erreur lors de la création du compte. Réessayez.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [createUser, email, firstName, lastName, password],
  );

  // Optimisation de la validation avec useMemo
  const validatePassword = useCallback((pwd: string) => {
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[@$!%*?&]/.test(pwd);
    const hasMinLength = pwd.length >= 12;
    return (
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar &&
      hasMinLength
    );
  }, []);

  const isPasswordValid = useMemo(
    () => validatePassword(debouncedPassword),
    [validatePassword, debouncedPassword],
  );

  const isConfirmPasswordValid = useMemo(
    () => debouncedConfirmPassword === debouncedPassword,
    [debouncedConfirmPassword, debouncedPassword],
  );

  // Validation de l'email
  const isEmailValid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(debouncedEmail.trim());
  }, [debouncedEmail]);

  const getPasswordValidationMessage = useCallback((pwd: string) => {
    if (!pwd) return "";
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[@$!%*?&]/.test(pwd);
    const hasMinLength = pwd.length >= 12;

    if (
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar &&
      hasMinLength
    ) {
      return "";
    }

    const missing = [];
    if (!hasUpperCase) missing.push("une lettre majuscule (A-Z)");
    if (!hasLowerCase) missing.push("une lettre minuscule (a-z)");
    if (!hasNumbers) missing.push("un chiffre (0-9)");
    if (!hasSpecialChar) missing.push("un caractère spécial (@$!%*?&)");
    if (!hasMinLength)
      missing.push(
        `${12 - pwd.length} caractères supplémentaires (minimum 12)`,
      );

    return `Il manque : ${missing.join(", ")}`;
  }, []);

  // Optimisation des styles avec les valeurs mémorisées
  const passwordInputStyle = useMemo(() => {
    if (!passwordTouched) return "";
    return isPasswordValid
      ? "border-success focus:border-success"
      : "border-error focus:border-error";
  }, [passwordTouched, isPasswordValid]);

  const confirmPasswordInputStyle = useMemo(() => {
    if (!confirmPasswordTouched) return "";
    return isConfirmPasswordValid
      ? "border-success focus:border-success"
      : "border-error focus:border-error";
  }, [confirmPasswordTouched, isConfirmPasswordValid]);

  const emailInputStyle = useMemo(() => {
    if (!emailTouched) return "";
    return isEmailValid
      ? "border-success focus:border-success"
      : "border-error focus:border-error";
  }, [emailTouched, isEmailValid]);

  const getEmailValidationMessage = useCallback((emailValue: string) => {
    if (!emailValue) return "L'email est requis";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue.trim())) {
      return "Format d'email invalide";
    }
    return "";
  }, []);

  // Optimisation des handlers d'input avec throttling
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLoginEmail(e.target.value);
    },
    [],
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLoginPassword(e.target.value);
    },
    [],
  );

  const handleFirstNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFirstName(e.target.value);
    },
    [],
  );

  const handleLastNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLastName(e.target.value);
    },
    [],
  );

  const handleRegisterEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
    },
    [],
  );

  const handleRegisterPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
    },
    [],
  );

  const handleConfirmPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfirmPassword(e.target.value);
    },
    [],
  );

  const handlePasswordBlur = useCallback(() => {
    setPasswordTouched(true);
  }, []);

  const handleConfirmPasswordBlur = useCallback(() => {
    setConfirmPasswordTouched(true);
  }, []);

  const handleEmailBlur = useCallback(() => {
    setEmailTouched(true);
  }, []);

  const toggleLoginPassword = useCallback(() => {
    setShowLoginPassword(!showLoginPassword);
  }, [showLoginPassword]);

  const togglePassword = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  const toggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword(!showConfirmPassword);
  }, [showConfirmPassword]);

  const handleGoogleSignIn = useCallback(() => {
    signIn("google", { callbackUrl: "/home" });
  }, []);

  const handleTabChange = useCallback((tab: "login" | "register") => {
    setActiveTab(tab);
  }, []);

  ///////////////////////////////////////////////////////////////////////////////HOOKS///////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-base-300 via-base-100 to-base-300 p-4">
      {/* Bouton de thème optimisé */}
      <Suspense
        fallback={
          <div className="absolute right-4 top-4 z-10 h-6 w-6 animate-pulse rounded bg-base-300/50" />
        }
      >
        <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
      </Suspense>

      {/* Vagues de fond optimisées */}
      <BackgroundWaves />

      {/* Carte principale - Ultra-optimisée */}
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-base-content/10 bg-base-100/80 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-4xl">
        <div className="flex h-full min-h-[600px] flex-col sm:min-h-[650px] md:min-h-[700px] lg:min-h-[750px]">
          {/* Logo et contenu */}
          <div className="flex h-full flex-col px-6 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12 lg:px-12">
            <Logo />

            {/* Navigation par onglets optimisée */}
            <TabNavigation
              activeTab={activeTab}
              setActiveTab={handleTabChange}
            />

            {/* Contenu des formulaires avec lazy loading */}
            <div className="mt-8 flex-1 sm:mt-10 md:mt-12">
              <Suspense fallback={<LoadingSkeleton />}>
                {activeTab === "login" ? (
                  <LoginForm
                    loginEmail={loginEmail}
                    loginPassword={loginPassword}
                    showLoginPassword={showLoginPassword}
                    isLoading={isLoading}
                    isDark={isDark}
                    onEmailChange={handleEmailChange}
                    onPasswordChange={handlePasswordChange}
                    onTogglePassword={toggleLoginPassword}
                    onSubmit={handleLoginSubmit}
                    onGoogleSignIn={handleGoogleSignIn}
                  />
                ) : (
                  <RegisterForm
                    firstName={firstName}
                    lastName={lastName}
                    email={email}
                    password={password}
                    confirmPassword={confirmPassword}
                    showPassword={showPassword}
                    showConfirmPassword={showConfirmPassword}
                    passwordTouched={passwordTouched}
                    confirmPasswordTouched={confirmPasswordTouched}
                    emailTouched={emailTouched}
                    isPasswordValid={isPasswordValid}
                    isConfirmPasswordValid={isConfirmPasswordValid}
                    isEmailValid={isEmailValid}
                    isLoading={isLoading}
                    isDark={isDark}
                    onFirstNameChange={handleFirstNameChange}
                    onLastNameChange={handleLastNameChange}
                    onEmailChange={handleRegisterEmailChange}
                    onPasswordChange={handleRegisterPasswordChange}
                    onConfirmPasswordChange={handleConfirmPasswordChange}
                    onPasswordBlur={handlePasswordBlur}
                    onConfirmPasswordBlur={handleConfirmPasswordBlur}
                    onEmailBlur={handleEmailBlur}
                    onTogglePassword={togglePassword}
                    onToggleConfirmPassword={toggleConfirmPassword}
                    onSubmit={handleRegisterSubmit}
                    onBack={() => setActiveTab("login")}
                    getPasswordValidationMessage={getPasswordValidationMessage}
                    getEmailValidationMessage={getEmailValidationMessage}
                    passwordInputStyle={passwordInputStyle}
                    confirmPasswordInputStyle={confirmPasswordInputStyle}
                    emailInputStyle={emailInputStyle}
                  />
                )}
              </Suspense>
            </div>
          </div>
        </div>

        {/* Footer optimisé */}
        <div className="border-t border-base-content/10 p-4 text-center text-sm text-base-content/60">
          {APP_CONFIG.version} © {APP_CONFIG.year} Clara AI
        </div>
      </div>
    </div>
  );
  ///////////////////////////////////////////////////////////////////////////////RENDER///////////////////////////////////////////////////////////////////////////////////////
}
