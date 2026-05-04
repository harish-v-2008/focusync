import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Camera, LineChart, Sparkles, Target, Timer, MessageSquare, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-hero text-foreground overflow-x-hidden">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 glass border-b border-border/40">
        <nav className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-glow grid place-items-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight">Focus Sync</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-smooth">Features</a>
            <a href="#mira" className="hover:text-foreground transition-smooth">MIRA</a>
            <a href="#how" className="hover:text-foreground transition-smooth">How it works</a>
          </div>
          <Link to="/auth">
            <Button className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 hover:scale-105 transition-smooth border-0">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative grid-pattern">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="container mx-auto px-6 py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-8 text-xs">
              <Sparkles className="h-3 w-3 text-accent" />
              <span className="text-muted-foreground">Now with MIRA — your AI study companion</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Don't scroll your <span className="gradient-text">dreams</span> away.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Focus Sync is an AI productivity ecosystem that tracks your study time, monitors concentration through your webcam, plans your day, and answers your doubts in real time.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:scale-105 transition-smooth border-0 h-12 px-8 text-base">
                  Start focusing free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="glass border-border h-12 px-8 text-base">
                  See features
                </Button>
              </a>
            </div>

            {/* Hero stats */}
            <div className="mt-20 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { v: "+47%", l: "Avg focus gain" },
                { v: "11", l: "Smart modules" },
                { v: "24/7", l: "MIRA support" },
              ].map((s) => (
                <div key={s.l} className="glass rounded-2xl p-4">
                  <div className="text-2xl md:text-3xl font-bold gradient-text">{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <div className="text-sm text-accent font-medium uppercase tracking-wider mb-3">Capabilities</div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Everything a focused student needs.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              From real-time webcam attention scoring to AI-generated daily missions — every tool in one elegant workspace.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Camera, t: "Webcam Concentration", d: "Real-time face detection scores your attention while you study. Stay focused, get rewarded.", c: "from-primary to-primary-glow" },
              { icon: Target, t: "Focus Score", d: "Convert study time vs screen time into a clear daily score with personalized suggestions.", c: "from-accent to-primary" },
              { icon: Brain, t: "AI Study Planner", d: "MIRA generates daily missions tuned to your exam date and weak subjects.", c: "from-primary-glow to-accent" },
              { icon: MessageSquare, t: "MIRA Chatbot", d: "Ask any concept, get instant explanations, summaries, and study strategies.", c: "from-primary to-accent" },
              { icon: Timer, t: "Pomodoro Timer", d: "Built-in focus timer with break management and session logging.", c: "from-accent to-primary-glow" },
              { icon: LineChart, t: "Smart Analytics", d: "Compare past vs present performance with beautiful interactive charts.", c: "from-primary-glow to-primary" },
            ].map((f) => (
              <div key={f.t} className="group glass rounded-2xl p-6 transition-smooth hover:scale-[1.02] hover:shadow-glow">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.c} shadow-glow mb-5`}>
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold">{f.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MIRA */}
      <section id="mira" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 mb-6 text-xs">
                <Sparkles className="h-3 w-3 text-accent" />
                <span>Meet MIRA</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Your <span className="gradient-text">intelligent</span> study companion.
              </h2>
              <p className="mt-5 text-muted-foreground text-lg">
                MIRA — My Intelligent Responsive Assistant — is a context-aware AI tutor. Ask questions, get strategies, and turn confusion into clarity in seconds.
              </p>
              <ul className="mt-8 space-y-3">
                {["Subject-based explanations", "Personalized study strategies", "Motivational support", "Real-time conversational tutoring"].map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-gradient-primary" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-strong rounded-3xl p-6 shadow-elegant animate-float">
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-gradient-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] text-sm shadow-glow">
                    Explain photosynthesis simply
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="glass rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm">
                    <span className="text-accent font-semibold">MIRA:</span> Photosynthesis is how plants make food using sunlight, water, and CO₂. Think of leaves as tiny solar kitchens 🌱
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-gradient-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] text-sm shadow-glow">
                    Make me a 2-hour plan for biology
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="glass rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] text-sm">
                    <span className="text-accent font-semibold">MIRA:</span> Got it! 30 min cells → 10 min break → 40 min photosynthesis → 10 min break → 30 min recap quiz. Ready?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center max-w-2xl mx-auto">
            Three steps to your <span className="gradient-text">best focus</span>.
          </h2>
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Sign in", d: "Continue with Google or email. We auto-create your profile." },
              { n: "02", t: "Set your goal", d: "Add your exam date and daily target. MIRA builds your plan." },
              { n: "03", t: "Stay focused", d: "Study with the camera on. Track scores. Improve every day." },
            ].map((s) => (
              <div key={s.n} className="glass rounded-2xl p-8">
                <div className="text-5xl font-bold gradient-text">{s.n}</div>
                <h3 className="mt-4 text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-muted-foreground text-sm">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:scale-105 transition-smooth border-0 h-12 px-8 text-base">
                Get started — it's free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 py-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-primary grid place-items-center">
              <Zap className="h-3 w-3 text-primary-foreground" />
            </div>
            <span>Focus Sync</span>
          </div>
          <div>© 2026 Focus Sync. Don't scroll your dreams away.</div>
        </div>
      </footer>
    </div>
  );
}
