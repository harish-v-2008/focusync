import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { chatWithMira } from "@/server/mira.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/chatbot")({
  component: ChatbotPage,
});

interface Msg { id?: string; role: "user" | "assistant"; content: string }

function ChatbotPage() {
  const { user } = useAuth();
  const chat = useServerFn(chatWithMira);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("chat_messages").select("id, role, content").eq("user_id", user.id)
      .order("created_at").limit(50).then(({ data }) => {
        if (data) setMessages(data as Msg[]);
      });
  }, [user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || !user || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: userMsg.content });

    const result = await chat({ data: { messages: newMsgs.map((m) => ({ role: m.role, content: m.content })) } });
    if (result.error) { toast.error(result.error); setLoading(false); return; }
    const reply: Msg = { role: "assistant", content: result.reply };
    setMessages((m) => [...m, reply]);
    await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: reply.content });
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-5rem)]">
      <PageHeader title="MIRA" description="My Intelligent Responsive Assistant — your AI tutor." />

      <Card className="glass border-border bg-gradient-card flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-gradient-primary shadow-glow grid place-items-center mb-4 animate-pulse-glow">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Hi, I'm MIRA</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">Ask me anything — concepts, study plans, motivation, or strategies.</p>
              <div className="grid sm:grid-cols-2 gap-2 mt-6 w-full max-w-md">
                {["Explain photosynthesis simply", "Make a 2h biology plan", "How do I beat procrastination?", "Summarize Newton's laws"].map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="glass rounded-xl px-3 py-2 text-xs text-left hover:bg-secondary transition-smooth">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={m.id ?? i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-gradient-primary text-primary-foreground rounded-tr-sm shadow-glow"
                  : "glass rounded-tl-sm"
              }`}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&_*]:text-foreground [&_code]:bg-secondary [&_code]:px-1 [&_code]:rounded">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> MIRA is thinking...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </CardContent>

        <div className="border-t border-border p-3 flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Ask MIRA anything..." disabled={loading} className="flex-1" />
          <Button onClick={send} disabled={!input.trim() || loading} className="bg-gradient-primary border-0 shadow-glow">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
