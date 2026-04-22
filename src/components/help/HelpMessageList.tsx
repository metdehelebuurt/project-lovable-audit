import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import type { HelpMessage } from "./useHelpChat";
import { Loader2 } from "lucide-react";

interface HelpMessageListProps {
  messages: HelpMessage[];
  isStreaming: boolean;
  onNavigate: () => void;
}

export function HelpMessageList({ messages, isStreaming, onNavigate }: HelpMessageListProps) {
  const navigate = useNavigate();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  const handleLink = (href: string | undefined) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!href) return;
    if (href.startsWith("/")) {
      e.preventDefault();
      navigate(href);
      onNavigate();
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Stel een vraag om te beginnen.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.map((m, i) => (
        <div
          key={i}
          className={
            m.role === "user"
              ? "ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              : "mr-auto max-w-[90%] rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
          }
        >
          {m.role === "assistant" ? (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-a:text-primary prose-a:underline">
              <ReactMarkdown
                components={{
                  a: ({ href, children, ...rest }) => (
                    <a href={href} onClick={handleLink(href)} {...rest}>
                      {children}
                    </a>
                  ),
                }}
              >
                {m.content || "…"}
              </ReactMarkdown>
            </div>
          ) : (
            <span className="whitespace-pre-wrap">{m.content}</span>
          )}
        </div>
      ))}
      {isStreaming && messages[messages.length - 1]?.role === "user" && (
        <div className="mr-auto flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Bezig met antwoorden…
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}