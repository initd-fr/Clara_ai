"use client";
//////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////
import { useRef, useState, useEffect, useCallback, useMemo, memo } from "react";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, FileText, Image } from "lucide-react";
import { useTheme } from "next-themes";
import { CircleArrowDown } from "lucide-react";
import { cn } from "~/lib/utils";
//////////////////////////////////////////////////////////////////////////////////IMPORTS///////////////////////////////////////////////////////////////////////////////////////

// ? /////////////////////////////////////////////////////////////////////////////TYPES/////////////////////////////////////////////////////////////////////////////////////////
export type MessageType = {
  isBot: boolean;
  text: string;
  isLoading?: boolean;
  id?: string;
  isTyping?: boolean;
  fullText?: string;
  timestamp?: number; // Timestamp pour la fusion intelligente des messages
  document?: {
    title: string;
    content: string;
    url?: string;
    mimeType?: string;
  };
};

///////////////////////////////////////////////////////////////////////////////TYPES/////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Message copié dans le presse-papiers");
  } catch (err) {
    toast.error("Erreur lors de la copie du message");
  }
};

const DocumentPreview = memo(
  ({ document }: { document: MessageType["document"] }) => {
    const fileIcon = useMemo(() => {
      if (!document) return null;

      const extension = document.title.toLowerCase().split(".").pop() || "";
      const isImage =
        document.mimeType?.startsWith("image/") ||
        ["png", "jpg", "jpeg", "gif", "webp"].includes(extension);
      const fileType = isImage ? "image" : extension;

      const iconColors = {
        pdf: "text-red-500",
        csv: "text-green-500",
        txt: "text-blue-500",
        docx: "text-blue-500",
        image: "text-purple-500",
        default: "text-gray-500",
      };

      return isImage ? (
        <Image
          className={cn("h-4 w-4", iconColors.image)}
          stroke="currentColor"
        />
      ) : (
        <FileText
          className={cn(
            "h-4 w-4",
            iconColors[fileType as keyof typeof iconColors] ||
              iconColors.default,
          )}
          stroke="currentColor"
        />
      );
    }, [document]);

    if (!document?.title) return null;

    return (
      <div className="mb-2 flex items-center gap-2 rounded-lg border border-base-300/10 bg-base-100/80 p-2 shadow-md shadow-base-300 backdrop-blur-sm sm:p-3">
        {fileIcon}
        <span className="text-sm font-medium text-base-content">
          {document.title}
        </span>
      </div>
    );
  },
);

DocumentPreview.displayName = "DocumentPreview";

const Message = memo(({ message }: { message: MessageType }) => {
  const { theme } = useTheme();

  const handleCopy = useCallback(() => {
    copyToClipboard(message.text);
  }, [message.text]);

  // Fonction simplifiée pour formater le texte de l'IA
  const formatAIText = useCallback((text: string) => {
    // Si le texte contient déjà du Markdown formaté, ne rien faire
    if (
      text.includes("```") ||
      text.includes("##") ||
      text.includes("###") ||
      text.includes("**") ||
      text.includes("- ") ||
      text.includes("1. ") ||
      text.includes("* ") ||
      text.includes("> ") ||
      text.includes("| ") ||
      text.includes("`")
    ) {
      return text;
    }

    // Seulement pour les cas où il n'y a vraiment aucun formatage
    // et que le texte semble être du code Python brut
    const lines = text.split("\n");
    const hasCodePattern = lines.some(
      (line) =>
        line.match(
          /^(def\s+|class\s+|import\s+|from\s+|if\s+|for\s+|while\s+|print\(|return\s+)/,
        ) ||
        line.match(
          /^\s+(def\s+|class\s+|if\s+|for\s+|while\s+|print\(|return\s+)/,
        ),
    );

    // Si on détecte du code Python brut sans formatage, l'entourer de ```
    if (hasCodePattern && !text.includes("```")) {
      return `\`\`\`python\n${text}\n\`\`\``;
    }

    return text;
  }, []);

  const markdownComponents = useMemo(
    () => ({
      h1: ({ children, ...props }: any) => (
        <h1
          {...props}
          className="mb-6 border-b-2 border-primary/40 pb-3 text-2xl font-bold text-base-content sm:text-3xl"
        >
          {children}
        </h1>
      ),
      h2: ({ children, ...props }: any) => (
        <h2
          {...props}
          className="mb-4 mt-6 text-xl font-semibold text-base-content sm:text-2xl"
        >
          {children}
        </h2>
      ),
      h3: ({ children, ...props }: any) => (
        <h3
          {...props}
          className="mb-3 mt-5 text-lg font-medium text-base-content sm:text-xl"
        >
          {children}
        </h3>
      ),
      h4: ({ children, ...props }: any) => (
        <h4
          {...props}
          className="mb-2 mt-4 text-base font-medium text-base-content/80 sm:text-lg"
        >
          {children}
        </h4>
      ),
      p: ({ children, ...props }: any) => (
        <p
          {...props}
          className="mb-5 text-base leading-relaxed text-base-content/90"
        >
          {children}
        </p>
      ),
      ul: ({ children, ...props }: any) => (
        <ul {...props} className="mb-6 space-y-2 pl-6">
          {children}
        </ul>
      ),
      ol: ({ children, ...props }: any) => (
        <ol {...props} className="mb-6 space-y-2 pl-6">
          {children}
        </ol>
      ),
      li: ({ children, ...props }: any) => (
        <li {...props} className="mb-2 leading-relaxed text-base-content/90">
          {children}
        </li>
      ),
      code: ({ children, className, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || "");
        const handleCodeCopy = () => {
          copyToClipboard(String(children).replace(/\n$/, ""));
        };

        return match ? (
          <div className="relative my-4 overflow-hidden rounded-lg border border-base-content/20 bg-base-100">
            <div className="flex items-center justify-between border-b border-base-content/20 bg-base-200 px-3 py-2 sm:px-4">
              <span className="text-xs font-medium text-base-content">
                {match[1]?.toUpperCase()}
              </span>
              <button
                onClick={handleCodeCopy}
                className="hover:bg-base-400 rounded-md bg-base-300 p-1 text-xs text-base-content"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <SyntaxHighlighter
              style={theme === "dark" ? oneDark : oneLight}
              language={match[1]}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: "1rem",
                background: "transparent",
              }}
              codeTagProps={{
                style: { background: "transparent" },
              }}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          </div>
        ) : (
          <code {...props} className="font-mono text-[0.9em] text-primary">
            {children}
          </code>
        );
      },
      pre: ({ children, ...props }: any) => <pre {...props}>{children}</pre>,
      blockquote: ({ children, ...props }: any) => (
        <blockquote
          {...props}
          className="mb-8 rounded-r-xl border-l-4 border-primary/70 bg-base-300/50 px-8 py-6 italic text-base-content/80 shadow-lg"
        >
          {children}
        </blockquote>
      ),
      table: ({ children, ...props }: any) => (
        <div className="mb-6 overflow-x-auto rounded-lg border border-base-content/20 bg-base-100 shadow-sm">
          <table {...props} className="w-full border-collapse text-left">
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...props }: any) => (
        <thead {...props} className="border-b-2 border-primary/30 bg-base-200">
          {children}
        </thead>
      ),
      th: ({ children, ...props }: any) => (
        <th
          {...props}
          className="px-4 py-3 text-sm font-bold text-base-content"
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }: any) => (
        <td
          {...props}
          className="border-t border-base-content/10 px-4 py-3 text-sm text-base-content/90"
        >
          {children}
        </td>
      ),
      a: ({ children, href, ...props }: any) => (
        <a
          {...props}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
        >
          {children}
        </a>
      ),
      img: ({ src, alt, ...props }: any) => (
        <img
          {...props}
          src={src}
          alt={alt || "Image"}
          className="my-4 rounded-lg border border-base-content/10"
        />
      ),
      strong: ({ children, ...props }: any) => (
        <strong {...props} className="font-bold text-primary">
          {children}
        </strong>
      ),
      em: ({ children, ...props }: any) => (
        <em {...props} className="italic text-base-content/70">
          {children}
        </em>
      ),
      hr: ({ ...props }: any) => (
        <hr {...props} className="my-8 border-t-2 border-base-content/30" />
      ),
    }),
    [theme],
  );

  return (
    <div
      className={cn(
        "chat flex w-full flex-col",
        message.isBot ? "items-start" : "items-end",
      )}
    >
      {!message.isBot && message.document?.title && (
        <DocumentPreview document={message.document} />
      )}
      <div
        className={cn(
          "chat-bubble relative overflow-hidden break-words rounded-2xl px-3 py-2 sm:px-4",
          message.isBot
            ? "max-w-[95%] rounded-bl-none bg-base-200 after:absolute after:-bottom-3 after:left-0 after:h-6 after:w-6 after:rounded-bl-full after:bg-base-200 after:content-[''] md:max-w-[80%]"
            : "max-w-[85%] rounded-br-none bg-primary after:absolute after:-bottom-3 after:right-0 after:h-6 after:w-6 after:rounded-br-full after:bg-primary after:content-[''] md:max-w-[65%] [&_*]:text-white",
        )}
      >
        {(() => {
          const fullText = formatAIText(message.text);
          const sourcesHeaderIndex = fullText.indexOf("## 📚 Sources");
          const hasSources = sourcesHeaderIndex !== -1;
          const answerText = hasSources
            ? fullText.slice(0, sourcesHeaderIndex).trimEnd()
            : fullText;
          const sourcesText = hasSources
            ? fullText.slice(sourcesHeaderIndex).trim()
            : "";

          // Nettoyer le markdown des sources pour éviter de répéter le titre
          const cleanedSources = hasSources
            ? sourcesText.replace(/^##[^\n]*\n+/, "").trim()
            : "";

          return (
            <>
              <div className="text-sm leading-relaxed [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-base-content [&_pre]:bg-transparent [&_pre]:p-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {answerText}
                </ReactMarkdown>
              </div>

              {hasSources && (
                <div className="mt-3">
                  <details className="collapse collapse-arrow overflow-hidden rounded-xl border border-base-300/40 bg-base-100/80 shadow-sm">
                    <summary className="collapse-title flex min-h-0 w-full items-center gap-2 px-4 py-3 text-left text-2xl font-semibold leading-none text-base-content sm:text-2xl">
                      📚 Sources
                    </summary>
                    <div className="collapse-content px-4 pb-4 pt-0">
                      <div className="text-sm leading-relaxed [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-base-content [&_pre]:bg-transparent [&_pre]:p-0">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {cleanedSources}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </>
          );
        })()}

        {message.isLoading && (
          <div className="chat-bubble absolute inset-0 flex items-center justify-center bg-base-200 backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-base-content [animation-delay:-0.3s]" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-base-content [animation-delay:-0.15s]" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-base-content" />
            </div>
          </div>
        )}
      </div>
      {message.isBot && !message.isLoading && (
        <div className="chat-footer opacity-50">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:bg-base-200"
          >
            <Copy className="h-3.5 w-3.5 text-base-content/70" />
          </button>
        </div>
      )}
    </div>
  );
});

Message.displayName = "Message";

// Composant ScrollButton optimisé
const ScrollButton = memo(
  ({
    showScrollButton,
    onScrollToBottom,
  }: {
    showScrollButton: boolean;
    onScrollToBottom: () => void;
  }) => {
    if (!showScrollButton) return null;

    return (
      <div className="fixed bottom-32 right-4 z-50 sm:right-8">
        <button
          onClick={onScrollToBottom}
          className="btn btn-circle btn-ghost bg-base-100/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-base-200/80"
          aria-label="Aller en bas"
        >
          <CircleArrowDown className="h-5 w-5 text-base-content/70 sm:h-6 sm:w-6" />
        </button>
      </div>
    );
  },
);

ScrollButton.displayName = "ScrollButton";

//////////////////////////////////////////////////////////////////////////FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////

// ////////////////////////////////////////////////////////////////////////RENDER/////////////////////////////////////////////////////////////////////////////////////////
const ChatContent = memo(({ messages }: { messages: MessageType[] }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isReloading, setIsReloading] = useState(false); // État pour détecter le rechargement

  const checkScroll = useCallback(() => {
    const container = document.querySelector(
      ".chat-messages-container .overflow-y-auto",
    );
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollButton(distanceFromBottom > 100);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = document.querySelector(
      ".chat-messages-container .overflow-y-auto",
    );
    if (container) {
      // 🔥 CORRECTION : Scroll uniquement dans la zone des messages, pas sur la page
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });

      setTimeout(() => {
        checkScroll();
      }, 500);
    }
  }, [checkScroll]);

  useEffect(() => {
    if (messages.length > 0) {
      // 🔥 CORRECTION : Ne pas faire de scroll automatique si on recharge depuis la DB
      // Détecter si c'est un rechargement (messages vides puis remplis rapidement)
      if (messages.length > 1 && !isReloading) {
        const timeoutId = setTimeout(() => {
          const container = document.querySelector(
            ".chat-messages-container .overflow-y-auto",
          );
          if (container) {
            // 🔥 CORRECTION : Scroll uniquement dans la zone des messages, pas sur la page
            container.scrollTo({
              top: container.scrollHeight,
              behavior: "smooth",
            });

            setTimeout(() => {
              checkScroll();
            }, 600);
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      } else if (messages.length === 1) {
        // Premier message ou rechargement - marquer comme rechargement
        setIsReloading(true);
        setTimeout(() => setIsReloading(false), 1000);
      }
    }
  }, [messages, checkScroll, isReloading]);

  useEffect(() => {
    const container = document.querySelector(
      ".chat-messages-container .overflow-y-auto",
    );
    if (container) {
      container.addEventListener("scroll", checkScroll);
      return () => container.removeEventListener("scroll", checkScroll);
    }
  }, [checkScroll]);

  useEffect(() => {
    checkScroll();
  }, [messages, checkScroll]);

  return (
    <>
      <div className="flex flex-col gap-2">
        {messages.map((message, index) => (
          <Message
            key={`${message.id || index}-${message.text.slice(0, 10)}`}
            message={message}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <ScrollButton
        showScrollButton={showScrollButton}
        onScrollToBottom={scrollToBottom}
      />
    </>
  );
});

ChatContent.displayName = "ChatContent";

export default ChatContent;
//////////////////////////////////////////////////////////////////////////RENDER/////////////////////////////////////////////////////////////////////////////////////////
