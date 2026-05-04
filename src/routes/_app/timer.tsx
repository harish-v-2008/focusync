import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/timer")({
  component: TimerPage,
});

const PRESETS = [
  { label: "Pomodoro", focus: 25, brk: 5 },
  { label: "Deep Work", focus: 50, brk: 10 },
  { label: "Sprint", focus: 15, brk: 3 },
];

function TimerPage() {
  const { user } = useAuth();
  const [preset, setPreset] = useState(PRESETS[0]);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [seconds, setSeconds] = useState(PRESETS[0].focus * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (mode === "focus") {
            setCompleted((c) => c + 1);
            toast.success("Focus session complete! Take a break.");
            if (user) {
              supabase.from("study_sessions").insert({
                user_id: user.id, study_minutes: preset.focus, screen_minutes: 0, notes: `${preset.label} session`,
              });
            }
            setMode("break");
            return preset.brk * 60;
          } else {
            toast.info("Break over! Back to focus.");
            setMode("focus");
            return preset.focus * 60;
          }
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running, mode, preset, user]);

  const reset = () => {
    setRunning(false);
    setMode("focus");
    setSeconds(preset.focus * 60);
  };

  const choosePreset = (p: typeof PRESETS[0]) => {
    setPreset(p);
    setMode("focus");
    setSeconds(p.focus * 60);
    setRunning(false);
  };

  const total = mode === "focus" ? preset.focus * 60 : preset.brk * 60;
  const pct = ((total - seconds) / total) * 100;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <>
      <PageHeader title="Focus Timer" description="Pomodoro-style sessions to lock in deep work." />

      <Card className="glass border-border bg-gradient-card max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            {mode === "focus" ? <Brain className="h-5 w-5 text-accent" /> : <Coffee className="h-5 w-5 text-warning" />}
            {mode === "focus" ? "Focus" : "Break"} · {preset.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-72 h-72 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="oklch(0.2 0.05 270)" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none"
                stroke={mode === "focus" ? "url(#g)" : "oklch(0.78 0.16 75)"}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 282.7} 282.7`}
                style={{ transition: "stroke-dasharray 1s linear" }}
              />
              <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.62 0.22 275)" />
                  <stop offset="100%" stopColor="oklch(0.72 0.2 285)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-6xl font-bold tabular-nums">{mm}:{ss}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-2">{completed} done today</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-8">
            <Button onClick={() => setRunning(!running)} className="bg-gradient-primary border-0 shadow-glow h-12 px-8">
              {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
            </Button>
            <Button onClick={reset} variant="outline" className="glass border-border h-12 px-6">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-8">
            {PRESETS.map((p) => (
              <Button key={p.label} onClick={() => choosePreset(p)}
                variant={preset.label === p.label ? "default" : "outline"}
                className={preset.label === p.label ? "bg-gradient-primary border-0" : "glass border-border"}>
                {p.label}<span className="text-xs ml-1 opacity-70">{p.focus}/{p.brk}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
