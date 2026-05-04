import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Flame, CalendarClock, Sparkles, ArrowRight, Camera, Timer, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

interface Profile {
  full_name: string | null;
  exam_name: string | null;
  exam_date: string | null;
  current_streak: number;
  daily_goal_hours: number;
}

function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todayScreen, setTodayScreen] = useState(0);
  const [missionsTotal, setMissionsTotal] = useState(0);
  const [missionsDone, setMissionsDone] = useState(0);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    (async () => {
      const { data: p } = await supabase.from("profiles").select("full_name, exam_name, exam_date, current_streak, daily_goal_hours").eq("id", user.id).maybeSingle();
      setProfile(p);
      const { data: sessions } = await supabase.from("study_sessions").select("study_minutes, screen_minutes").eq("user_id", user.id).eq("session_date", today);
      setTodayMinutes((sessions ?? []).reduce((a, s) => a + (s.study_minutes ?? 0), 0));
      setTodayScreen((sessions ?? []).reduce((a, s) => a + (s.screen_minutes ?? 0), 0));
      const { data: m } = await supabase.from("missions").select("completed").eq("user_id", user.id).eq("due_date", today);
      setMissionsTotal((m ?? []).length);
      setMissionsDone((m ?? []).filter((x) => x.completed).length);
    })();
  }, [user]);

  const goalMin = (profile?.daily_goal_hours ?? 4) * 60;
  const goalPct = Math.min(100, Math.round((todayMinutes / goalMin) * 100));
  const focusScore = todayMinutes + todayScreen > 0 ? Math.round((todayMinutes / (todayMinutes + todayScreen)) * 100) : 0;
  const daysToExam = profile?.exam_date ? Math.max(0, Math.ceil((new Date(profile.exam_date).getTime() - Date.now()) / 86400000)) : null;

  return (
    <>
      <PageHeader
        title={`Hey ${profile?.full_name?.split(" ")[0] ?? "there"} 👋`}
        description="Here's your focus snapshot for today."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Target} label="Today's Focus Score" value={`${focusScore}%`} hint={focusScore >= 70 ? "Focused 🔥" : focusScore >= 40 ? "Improving" : "Let's go!"} />
        <StatCard icon={Flame} label="Current Streak" value={`${profile?.current_streak ?? 0} days`} hint="Keep it alive" />
        <StatCard icon={CalendarClock} label="Exam Countdown" value={daysToExam !== null ? `${daysToExam} d` : "—"} hint={profile?.exam_name ?? "Set in Profile"} />
        <StatCard icon={Sparkles} label="Missions" value={`${missionsDone} / ${missionsTotal}`} hint={missionsTotal === 0 ? "Generate plan" : "Today"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 glass border-border bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Daily Goal
              <span className="text-sm font-normal text-muted-foreground">{(todayMinutes / 60).toFixed(1)}h / {profile?.daily_goal_hours ?? 4}h</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={goalPct} className="h-3" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="glass rounded-xl p-4">
                <div className="text-xs text-muted-foreground">Study time</div>
                <div className="text-2xl font-bold mt-1 gradient-text">{(todayMinutes / 60).toFixed(1)}h</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-xs text-muted-foreground">Screen time</div>
                <div className="text-2xl font-bold mt-1">{(todayScreen / 60).toFixed(1)}h</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border bg-gradient-card shadow-card">
          <CardHeader><CardTitle>Quick start</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <QuickLink to="/timer" icon={Timer} label="Start Pomodoro" />
            <QuickLink to="/camera" icon={Camera} label="Camera Focus" />
            <QuickLink to="/chatbot" icon={MessageSquare} label="Ask MIRA" />
            <QuickLink to="/planner" icon={Sparkles} label="Generate Plan" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint: string }) {
  return (
    <div className="glass border border-border rounded-2xl p-5 bg-gradient-card transition-smooth hover:shadow-glow">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <div className="text-3xl font-bold mt-2 gradient-text">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to as "/timer"}>
      <Button variant="outline" className="w-full justify-between glass border-border hover:bg-secondary">
        <span className="inline-flex items-center gap-3"><Icon className="h-4 w-4" />{label}</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}
