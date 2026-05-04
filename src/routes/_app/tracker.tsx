import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tracker")({
  component: TrackerPage,
});

interface Session {
  id: string;
  study_minutes: number;
  screen_minutes: number;
  subject: string | null;
  focus_score: number | null;
  session_date: string;
  notes: string | null;
}

function TrackerPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [study, setStudy] = useState("60");
  const [screen, setScreen] = useState("30");
  const [subject, setSubject] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("study_sessions").select("id, study_minutes, screen_minutes, subject, focus_score, session_date, notes")
      .eq("user_id", user.id).order("session_date", { ascending: false }).order("created_at", { ascending: false }).limit(30);
    setSessions((data ?? []) as Session[]);
  };

  useEffect(() => { load(); }, [user]); // eslint-disable-line

  const add = async () => {
    if (!user) return;
    const s = parseInt(study || "0");
    const sc = parseInt(screen || "0");
    if (s + sc === 0) return toast.error("Enter time first");
    const focus_score = s + sc > 0 ? Math.round((s / (s + sc)) * 100) : null;
    const { error } = await supabase.from("study_sessions").insert({
      user_id: user.id, study_minutes: s, screen_minutes: sc, subject: subject || null, focus_score,
    });
    if (error) return toast.error("Failed to log");
    toast.success("Logged!");
    setStudy("60"); setScreen("30"); setSubject("");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("study_sessions").delete().eq("id", id);
    load();
  };

  return (
    <>
      <PageHeader title="Study Tracker" description="Log every session and watch progress add up." />

      <Card className="glass border-border bg-gradient-card mb-5">
        <CardHeader><CardTitle>Log a session</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-3">
            <div><Label className="text-xs">Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Math, Bio..." /></div>
            <div><Label className="text-xs">Study (min)</Label><Input type="number" min={0} value={study} onChange={(e) => setStudy(e.target.value)} /></div>
            <div><Label className="text-xs">Screen (min)</Label><Input type="number" min={0} value={screen} onChange={(e) => setScreen(e.target.value)} /></div>
            <div className="flex items-end"><Button onClick={add} className="w-full bg-gradient-primary border-0 shadow-glow"><Plus className="h-4 w-4" /> Add</Button></div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border bg-gradient-card">
        <CardHeader><CardTitle>Recent sessions</CardTitle></CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No sessions yet. Log your first study block above.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="glass rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.subject ?? "Study"}{s.notes ? ` · ${s.notes}` : ""}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(s.session_date).toLocaleDateString()} · {s.study_minutes} min study · {s.screen_minutes} min screen
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.focus_score !== null && <span className="text-sm font-bold gradient-text">{s.focus_score}%</span>}
                    <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
