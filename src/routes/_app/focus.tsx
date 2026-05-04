import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calculator, Save } from "lucide-react";

export const Route = createFileRoute("/_app/focus")({
  component: FocusPage,
});

function FocusPage() {
  const { user } = useAuth();
  const [studyHours, setStudyHours] = useState("2");
  const [studyMins, setStudyMins] = useState("0");
  const [screenHours, setScreenHours] = useState("3");
  const [screenMins, setScreenMins] = useState("0");
  const [score, setScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const calculate = () => {
    const study = parseInt(studyHours || "0") * 60 + parseInt(studyMins || "0");
    const screen = parseInt(screenHours || "0") * 60 + parseInt(screenMins || "0");
    if (study + screen === 0) { toast.error("Enter at least some time"); return; }
    setScore(Math.round((study / (study + screen)) * 100));
  };

  const save = async () => {
    if (score === null || !user) return;
    setSaving(true);
    const study = parseInt(studyHours || "0") * 60 + parseInt(studyMins || "0");
    const screen = parseInt(screenHours || "0") * 60 + parseInt(screenMins || "0");
    const { error } = await supabase.from("study_sessions").insert({
      user_id: user.id, study_minutes: study, screen_minutes: screen, focus_score: score,
    });
    setSaving(false);
    if (error) toast.error("Save failed"); else toast.success("Saved to your tracker!");
  };

  const study = parseInt(studyHours || "0") * 60 + parseInt(studyMins || "0");
  const screen = parseInt(screenHours || "0") * 60 + parseInt(screenMins || "0");
  const pieData = [
    { name: "Study", value: study, color: "oklch(0.62 0.22 275)" },
    { name: "Screen", value: screen, color: "oklch(0.65 0.2 25)" },
  ];
  const barData = [{ name: "Today", Study: study, Screen: screen }];

  const category = score === null ? null : score >= 70 ? "Focused" : score >= 40 ? "Improving" : "Distracted";
  const catColor = category === "Focused" ? "text-success" : category === "Improving" ? "text-warning" : "text-destructive";
  const suggestion = category === "Focused" ? "Outstanding! Maintain this rhythm and keep your streak alive." : category === "Improving" ? "Solid progress. Increase study consistency and reduce social apps." : "Reduce screen time aggressively. Try a 25-min Pomodoro right now.";

  return (
    <>
      <PageHeader title="Focus Score" description="Calculate your focus ratio from study vs screen time." />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="glass border-border bg-gradient-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-accent" /> Your day</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="text-sm mb-2 block">Study time</Label>
              <div className="grid grid-cols-2 gap-3">
                <div><Input type="number" min={0} value={studyHours} onChange={(e) => setStudyHours(e.target.value)} placeholder="Hours" /><div className="text-xs text-muted-foreground mt-1">Hours</div></div>
                <div><Input type="number" min={0} max={59} value={studyMins} onChange={(e) => setStudyMins(e.target.value)} placeholder="Minutes" /><div className="text-xs text-muted-foreground mt-1">Minutes</div></div>
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Screen time (non-study)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div><Input type="number" min={0} value={screenHours} onChange={(e) => setScreenHours(e.target.value)} placeholder="Hours" /><div className="text-xs text-muted-foreground mt-1">Hours</div></div>
                <div><Input type="number" min={0} max={59} value={screenMins} onChange={(e) => setScreenMins(e.target.value)} placeholder="Minutes" /><div className="text-xs text-muted-foreground mt-1">Minutes</div></div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={calculate} className="flex-1 bg-gradient-primary text-primary-foreground border-0 shadow-glow">Calculate Focus Score</Button>
              {score !== null && <Button onClick={save} disabled={saving} variant="outline" className="glass border-border"><Save className="h-4 w-4" /></Button>}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border bg-gradient-card">
          <CardHeader><CardTitle>Result</CardTitle></CardHeader>
          <CardContent>
            {score === null ? (
              <div className="h-64 grid place-items-center text-muted-foreground text-sm">Enter times and calculate to see your score.</div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-7xl font-bold gradient-text">{score}%</div>
                  <div className={`text-lg font-semibold mt-2 ${catColor}`}>{category}</div>
                  <p className="text-sm text-muted-foreground mt-3">{suggestion}</p>
                </div>
                <div className="h-48">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "oklch(0.13 0.045 268)", border: "1px solid oklch(0.25 0.05 270)", borderRadius: 12 }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {score !== null && (
        <Card className="mt-5 glass border-border bg-gradient-card">
          <CardHeader><CardTitle>Time breakdown (minutes)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="oklch(0.7 0.03 265)" />
                <YAxis stroke="oklch(0.7 0.03 265)" />
                <Tooltip contentStyle={{ background: "oklch(0.13 0.045 268)", border: "1px solid oklch(0.25 0.05 270)", borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="Study" fill="oklch(0.62 0.22 275)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Screen" fill="oklch(0.65 0.2 25)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}
