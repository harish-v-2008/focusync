import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generatePlan } from "@/server/mira.functions";
import { Sparkles, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/planner")({
  component: PlannerPage,
});

interface Mission {
  id: string;
  title: string;
  subject: string | null;
  priority: string | null;
  duration_minutes: number | null;
  completed: boolean;
}

function PlannerPage() {
  const { user } = useAuth();
  const gen = useServerFn(generatePlan);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [subjects, setSubjects] = useState("");
  const [hours, setHours] = useState("4");
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("missions").select("id, title, subject, priority, duration_minutes, completed")
      .eq("user_id", user.id).eq("due_date", today).order("created_at");
    setMissions((data ?? []) as Mission[]);
  };
  useEffect(() => { load(); }, [user]); // eslint-disable-line

  const generate = async () => {
    if (!user) return;
    setLoading(true);
    const { data: profile } = await supabase.from("profiles").select("exam_name, exam_date").eq("id", user.id).maybeSingle();
    const days = profile?.exam_date ? Math.max(0, Math.ceil((new Date(profile.exam_date).getTime() - Date.now()) / 86400000)) : undefined;
    const result = await gen({ data: { examName: profile?.exam_name ?? undefined, daysToExam: days, subjects, hoursPerDay: parseFloat(hours) || 4 } });
    setLoading(false);
    if (result.error || !result.missions?.length) return toast.error(result.error || "No plan generated");
    const rows = result.missions.map((m: { title: string; subject: string; priority: string; duration_minutes: number }) => ({
      user_id: user.id, title: m.title, subject: m.subject, priority: m.priority, duration_minutes: m.duration_minutes, due_date: today,
    }));
    const { error } = await supabase.from("missions").insert(rows);
    if (error) return toast.error("Save failed");
    toast.success("Plan generated!");
    load();
  };

  const toggle = async (m: Mission) => {
    await supabase.from("missions").update({ completed: !m.completed }).eq("id", m.id);
    load();
  };
  const remove = async (id: string) => { await supabase.from("missions").delete().eq("id", id); load(); };

  const done = missions.filter((m) => m.completed).length;

  return (
    <>
      <PageHeader title="AI Planner" description="Generate today's missions tuned to your exam and goals." />

      <Card className="glass border-border bg-gradient-card mb-5">
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Generate today's plan</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2"><Label className="text-xs">Subjects (comma separated)</Label><Input value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="Math, Physics, Biology" /></div>
            <div><Label className="text-xs">Hours today</Label><Input type="number" min={0.5} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} /></div>
          </div>
          <Button onClick={generate} disabled={loading} className="mt-4 bg-gradient-primary border-0 shadow-glow">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "MIRA is thinking..." : "Generate with MIRA"}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass border-border bg-gradient-card">
        <CardHeader><CardTitle className="flex items-center justify-between">Today's missions <span className="text-sm font-normal text-muted-foreground">{done}/{missions.length}</span></CardTitle></CardHeader>
        <CardContent>
          {missions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No missions yet. Generate a plan above.</p>
          ) : (
            <div className="space-y-2">
              {missions.map((m) => (
                <div key={m.id} className="glass rounded-xl p-4 flex items-center gap-3">
                  <Checkbox checked={m.completed} onCheckedChange={() => toggle(m)} />
                  <div className="flex-1">
                    <div className={`font-medium ${m.completed ? "line-through text-muted-foreground" : ""}`}>{m.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.subject} · {m.duration_minutes} min · {m.priority}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
