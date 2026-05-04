import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera as CameraIcon, Play, Square, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/camera")({
  component: CameraPage,
});

function CameraPage() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef({ total: 0, focused: 0 });
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<"idle" | "focused" | "distracted" | "absent">("idle");
  const [score, setScore] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [tick, setTick] = useState(0);

  // Load face-api.js models from CDN
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingModels(true);
      try {
        const faceapi = await import("face-api.js");
        const url = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
        await faceapi.nets.tinyFaceDetector.loadFromUri(url);
        if (!cancelled) setModelsLoaded(true);
      } catch (e) {
        toast.error("Failed to load face detection models");
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
    })();
    return () => { cancelled = true; stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    if (!modelsLoaded) { toast.error("Models still loading..."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      elapsedRef.current = { total: 0, focused: 0 };
      setRunning(true);
      setStatus("focused");

      const faceapi = await import("face-api.js");
      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });

      intervalRef.current = setInterval(async () => {
        if (!videoRef.current) return;
        const detection = await faceapi.detectSingleFace(videoRef.current, opts);
        elapsedRef.current.total += 1;
        if (!detection) {
          setStatus("absent");
        } else {
          // Check if face is roughly centered → focused
          const box = detection.box;
          const cx = box.x + box.width / 2;
          const vw = videoRef.current.videoWidth;
          const offset = Math.abs(cx - vw / 2) / vw;
          if (offset < 0.22) {
            setStatus("focused");
            elapsedRef.current.focused += 1;
          } else {
            setStatus("distracted");
          }
        }
        const s = elapsedRef.current.total > 0
          ? Math.round((elapsedRef.current.focused / elapsedRef.current.total) * 100)
          : 0;
        setScore(s);
        setTick((t) => t + 1);
      }, 1000);
    } catch (err) {
      toast.error("Camera access denied. Please allow camera permission.");
    }
  };

  const stop = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
    setStatus("idle");
    if (user && elapsedRef.current.total > 5) {
      const studyMin = Math.round(elapsedRef.current.focused / 60);
      const totalMin = Math.round(elapsedRef.current.total / 60);
      const concentration = elapsedRef.current.total > 0
        ? Math.round((elapsedRef.current.focused / elapsedRef.current.total) * 100)
        : 0;
      await supabase.from("study_sessions").insert({
        user_id: user.id,
        study_minutes: studyMin,
        screen_minutes: Math.max(0, totalMin - studyMin),
        concentration_score: concentration,
        notes: "Camera focus session",
      });
      toast.success(`Session saved · ${concentration}% concentration`);
    }
  };

  const total = elapsedRef.current.total;
  const focused = elapsedRef.current.focused;

  return (
    <>
      <PageHeader title="Camera Focus" description="AI watches your concentration in real time. Stay centered, stay focused." />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 glass border-border bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CameraIcon className="h-5 w-5 text-accent" /> Live preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video w-full bg-secondary rounded-2xl overflow-hidden border border-border">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {!running && (
                <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
                  <div className="text-center">
                    <CameraIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{loadingModels ? "Loading AI models..." : modelsLoaded ? "Click Start to begin" : "Preparing..."}</p>
                  </div>
                </div>
              )}
              {running && (
                <div className="absolute top-3 left-3 flex items-center gap-2 glass-strong px-3 py-1.5 rounded-full text-xs">
                  <div className={`h-2 w-2 rounded-full animate-pulse ${
                    status === "focused" ? "bg-success" : status === "distracted" ? "bg-warning" : "bg-destructive"
                  }`} />
                  {status === "focused" ? "Focused" : status === "distracted" ? "Distraction Detected!" : "No face detected"}
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              {!running ? (
                <Button onClick={start} disabled={!modelsLoaded || loadingModels} className="bg-gradient-primary border-0 shadow-glow">
                  <Play className="h-4 w-4" /> Start
                </Button>
              ) : (
                <Button onClick={stop} variant="destructive">
                  <Square className="h-4 w-4" /> Stop & save
                </Button>
              )}
              <p className="text-xs text-muted-foreground self-center">We never store video — only your scores.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border bg-gradient-card">
          <CardHeader><CardTitle>Concentration Score</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="text-6xl font-bold gradient-text">{score}%</div>
              <div className="text-xs text-muted-foreground mt-2">{tick > 0 ? "Updating live" : "Waiting..."}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-xs text-muted-foreground">Tracked</div>
                <div className="text-lg font-bold">{total}s</div>
              </div>
              <div className="glass rounded-xl p-3 text-center">
                <div className="text-xs text-muted-foreground">Focused</div>
                <div className="text-lg font-bold text-success">{focused}s</div>
              </div>
            </div>
            {status === "distracted" && (
              <div className="glass rounded-xl p-3 flex items-start gap-2 border border-warning/40">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs">Stay focused! Keep your face centered in frame.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
