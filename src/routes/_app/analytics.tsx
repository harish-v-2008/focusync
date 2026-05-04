import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const Route = createFileRoute("/_app/analytics")({
  component: AnalyticsPage,
});

interface Row { session_date: string; study_minutes: number; screen_minutes: number; focus_score: number | null }

function AnalyticsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
      const { data } = await supabase.from("study_sessions").select("session_date, study_minutes, screen_minutes, focus_score")
        .eq("user_id", user.id).gte("session_date", since).order("session_date");
      setRows((data ?? []) as Row[]);
    })();
  }, [user]);

  // Group by date
  const byDate = new Map<string, { date: string; study: number; screen: number; scores: number[] }>();
  rows.forEach((r) => {
    const e = byDate.get(r.session_date) ?? { date: r.session_date, study: 0, screen: 0, scores: [] };
    e.study += r.study_minutes;
    e.screen += r.screen_minutes;
    if (r.focus_score !== null) e.scores.push(r.focus_score);
    byDate.set(r.session_date, e);
  });
  const daily = Array.from(byDate.values()).map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    Study: +(d.study / 60).toFixed(1),
    Screen: +(d.screen / 60).toFixed(1),
    Focus: d.scores.length ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
  }));

  // Past 7 vs previous 7
  const last7 = daily.slice(-7);
  const prev7 = daily.slice(-14, -7);
  const avg = (arr: typeof daily, k: "Study" | "Focus") => arr.length ? arr.reduce((a, b) => a + b[k], 0) / arr.length : 0;
  const studyDelta = avg(last7, "Study") - avg(prev7, "Study");
  const focusDelta = avg(last7, "Focus") - avg(prev7, "Focus");

  return (
    <>
      <PageHeader title="Analytics" description="Compare your past 7 days with the previous week and see trends." />

      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        <DeltaCard label="Avg study / day" value={`${avg(last7, "Study").toFixed(1)}h`} delta={studyDelta} unit="h" />
        <DeltaCard label="Avg focus score" value={`${Math.round(avg(last7, "Focus"))}%`} delta={focusDelta} unit="%" />
        <DeltaCard label="Days tracked" value={`${last7.length}/7`} delta={last7.length - prev7.length} unit="" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="glass border-border bg-gradient-card">
          <CardHeader><CardTitle>Focus Score trend</CardTitle></CardHeader>
          <CardContent className="h-72">
            {daily.length === 0 ? <Empty /> : (
              <ResponsiveContainer>
                <AreaChart data={daily}>
                  <defs>
                    <linearGradient id="fc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.62 0.22 275)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.62 0.22 275)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.05 270 / 0.4)" />
                  <XAxis dataKey="date" stroke="oklch(0.7 0.03 265)" fontSize={12} />
                  <YAxis stroke="oklch(0.7 0.03 265)" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="Focus" stroke="oklch(0.62 0.22 275)" strokeWidth={2} fill="url(#fc)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border bg-gradient-card">
          <CardHeader><CardTitle>Study vs Screen (hours)</CardTitle></CardHeader>
          <CardContent className="h-72">
            {daily.length === 0 ? <Empty /> : (
              <ResponsiveContainer>
                <BarChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.05 270 / 0.4)" />
                  <XAxis dataKey="date" stroke="oklch(0.7 0.03 265)" fontSize={12} />
                  <YAxis stroke="oklch(0.7 0.03 265)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="Study" fill="oklch(0.62 0.22 275)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Screen" fill="oklch(0.65 0.2 25)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 glass border-border bg-gradient-card">
          <CardHeader><CardTitle>Daily study hours</CardTitle></CardHeader>
          <CardContent className="h-72">
            {daily.length === 0 ? <Empty /> : (
              <ResponsiveContainer>
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.05 270 / 0.4)" />
                  <XAxis dataKey="date" stroke="oklch(0.7 0.03 265)" fontSize={12} />
                  <YAxis stroke="oklch(0.7 0.03 265)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="Study" stroke="oklch(0.72 0.2 195)" strokeWidth={3} dot={{ fill: "oklch(0.72 0.2 195)" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

const tooltipStyle = { background: "oklch(0.13 0.045 268)", border: "1px solid oklch(0.25 0.05 270)", borderRadius: 12 };

function Empty() {
  return <div className="h-full grid place-items-center text-sm text-muted-foreground">Log study sessions to see analytics.</div>;
}

function DeltaCard({ label, value, delta, unit }: { label: string; value: string; delta: number; unit: string }) {
  const Icon = delta > 0.05 ? TrendingUp : delta < -0.05 ? TrendingDown : Minus;
  const color = delta > 0.05 ? "text-success" : delta < -0.05 ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="glass rounded-2xl p-5 border border-border bg-gradient-card">
      <div className="text-xs uppercase text-muted-foreground tracking-wide">{label}</div>
      <div className="text-3xl font-bold mt-2 gradient-text">{value}</div>
      <div className={`text-xs mt-2 inline-flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" /> {delta > 0 ? "+" : ""}{delta.toFixed(1)}{unit} vs previous 7d
      </div>
    </div>
  );
}
