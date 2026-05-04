import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Flame } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hours, setHours] = useState("4");
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setName(data.full_name ?? "");
      setExamName(data.exam_name ?? "");
      setExamDate(data.exam_date ?? "");
      setHours(String(data.daily_goal_hours ?? 4));
      setStreak(data.current_streak ?? 0);
      setLongest(data.longest_streak ?? 0);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: name || null,
      exam_name: examName || null,
      exam_date: examDate || null,
      daily_goal_hours: parseFloat(hours) || 4,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Save failed"); else toast.success("Profile updated");
  };

  return (
    <>
      <PageHeader title="Profile" description="Your goals, exam date, and streak stats." />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 glass border-border bg-gradient-card">
          <CardHeader><CardTitle>Your details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
            <div><Label>Email</Label><Input value={user?.email ?? ""} disabled className="mt-1.5 opacity-60" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Exam name</Label><Input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g. JEE Mains" className="mt-1.5" /></div>
              <div><Label>Exam date</Label><Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="mt-1.5" /></div>
            </div>
            <div><Label>Daily goal (hours)</Label><Input type="number" min={0.5} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} className="mt-1.5 max-w-[150px]" /></div>
            <Button onClick={save} disabled={saving} className="bg-gradient-primary border-0 shadow-glow"><Save className="h-4 w-4" /> Save changes</Button>
          </CardContent>
        </Card>

        <Card className="glass border-border bg-gradient-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5 text-warning" /> Streak</CardTitle></CardHeader>
          <CardContent className="text-center py-6">
            <div className="text-6xl font-bold gradient-text">{streak}</div>
            <div className="text-sm text-muted-foreground mt-1">current streak (days)</div>
            <div className="mt-6 pt-6 border-t border-border">
              <div className="text-3xl font-bold">{longest}</div>
              <div className="text-xs text-muted-foreground mt-1">longest streak</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
