"use client";
import { cn } from "~/lib/utils";
import React, {
  useState,
  createContext,
  useContext,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;

  // Fonction pour empêcher la fermeture si la sidebar est verrouillée
  const setOpen = useCallback(
    (newOpen: boolean | ((prev: boolean) => boolean)) => {
      if (setOpenProp) {
        // Si on a une fonction externe, on l'utilise
        setOpenProp(newOpen);
      } else {
        // Sinon on utilise l'état local
        setOpenState(newOpen);
      }
    },
    [setOpenProp],
  );

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = ({
  locked,
  ...props
}: React.ComponentProps<typeof motion.div> & { locked?: boolean }) => {
  return (
    <>
      <DesktopSidebar {...props} locked={locked} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  locked = false,
  ...props
}: React.ComponentProps<typeof motion.div> & { locked?: boolean }) => {
  const { open, setOpen, animate } = useSidebar();

  // Utiliser useRef pour éviter les dépendances dans useEffect
  const openRef = useRef(open);
  const setOpenRef = useRef(setOpen);

  // Mettre à jour les refs quand les valeurs changent
  openRef.current = open;
  setOpenRef.current = setOpen;

  // Fonction pour gérer le mouseLeave avec vérification du verrouillage
  const handleMouseLeave = useCallback(() => {
    // Ne jamais fermer la sidebar si elle est verrouillée
    if (!locked) {
      setOpen(false);
    }
  }, [locked, setOpen]);

  // Forcer l'ouverture si la sidebar est verrouillée (sans animation visible)
  useEffect(() => {
    if (locked && !openRef.current) {
      setOpenRef.current(true);
    }
  }, [locked]); // Seulement quand locked change, pas quand open change

  return (
    <>
      <motion.div
        className={cn(
          "hidden h-screen w-[300px] shrink-0 border-r border-base-200 bg-base-200 md:flex md:flex-col",
          className,
        )}
        animate={{
          width: animate ? (open ? "300px" : "60px") : "300px",
        }}
        transition={{
          type: "spring",
          stiffness: 80,
          damping: 18,
          duration: 0.6,
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "0 mt-2 flex h-10 w-full flex-row items-center justify-start border-r border-base-200 bg-transparent px-4 py-4 md:hidden",
          className,
        )}
        {...props}
      >
        <div className="z-20 flex items-center justify-center">
          <IconMenu2
            className="text-base-content"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed inset-0 z-[9999] flex h-full w-full flex-col justify-between bg-base-100 p-10",
                className,
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-base-content"
                onClick={() => setOpen(!open)}
              >
                <IconX className="text-base-content" />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  return (
    <a
      href={link.href}
      className={cn(
        "group/sidebar flex items-center justify-start  gap-2 py-2",
        className,
      )}
      {...props}
    >
      {/* Icône DaisyUI, clonée seulement si c'est un composant fonction, avec cast explicite pour TypeScript */}
      {isValidElement(link.icon) && typeof link.icon.type === "function"
        ? React.cloneElement(
            link.icon as React.ReactElement<{ className?: string }>,
            {
              className: cn(
                "h-5 w-5 shrink-0 text-base-content",
                link.icon.props.className,
              ),
            },
          )
        : link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="!m-0 inline-block whitespace-pre !p-0 text-sm text-base-content transition duration-150 group-hover/sidebar:translate-x-1"
      >
        {link.label}
      </motion.span>
    </a>
  );
};
