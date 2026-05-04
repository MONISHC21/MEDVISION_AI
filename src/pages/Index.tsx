import { useEffect, useState } from "react";
import { Upload, Cpu, FileText, Rocket, Shield, Zap, Database, ArrowRight, Activity, Brain, ScanLine, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const STREAMLIT_URL = "https://medvisionai-2ne4t4rvcram6xakjf3aqp.streamlit.app/";

const launchApp = (setLoading: (v: boolean) => void) => {
  setLoading(true);
  // Open in new tab; brief overlay to signal action
  window.open(STREAMLIT_URL, "_blank", "noopener,noreferrer");
  setTimeout(() => setLoading(false), 1200);
};

const Index = () => {
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center animate-fade-up">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-primary font-medium tracking-wide">Launching MedVision AI…</p>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "glass shadow-[var(--shadow-card)]" : "bg-transparent"
        }`}
      >
        <nav className="container mx-auto flex items-center justify-between py-4 px-4 md:px-6">
          <a href="#home" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span>MedVision <span className="text-gradient">AI</span></span>
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#home" className="hover:text-foreground transition-colors">Home</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it Works</a>
          </div>

          <Button variant="hero" size="sm" onClick={() => launchApp(setLoading)}>
            Launch App <ArrowRight className="w-4 h-4" />
          </Button>
        </nav>
      </header>

      {/* HERO */}
      <section id="home" className="relative pt-36 pb-24 md:pt-44 md:pb-32">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-primary mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              AI-Powered Medical Imaging
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
              Instant AI insights for <span className="text-gradient glow-text">medical scans</span>
            </h1>

            <p className="text-base md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Upload MRI, CT, X-ray &amp; retinal scans and get instant AI-powered analysis with structured reports — in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Button variant="hero" size="xl" onClick={() => launchApp(setLoading)}>
                Start Scan Analysis <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="ghost-glow" size="xl" asChild>
                <a href="#how">See How It Works</a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-primary" /> Fast</span>
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> Secure</span>
              <span className="flex items-center gap-1.5"><Database className="w-4 h-4 text-primary" /> No data stored</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 md:py-28 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Built for clarity &amp; speed</h2>
            <p className="text-muted-foreground text-lg">Multi-modality detection with structured clinical reports.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "Multi-Modality", desc: "Brain MRI, Chest X-Ray, CT, Bone X-Ray and Retinal Scans — all in one platform." },
              { icon: ScanLine, title: "Annotated Overlays", desc: "Color-coded bounding boxes with severity ratings: HIGH, MEDIUM, LOW." },
              { icon: FileText, title: "Structured Reports", desc: "Per-finding confidence scores and clinical recommendations, exportable as PDF." },
            ].map((f, i) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-7 hover:-translate-y-1 hover:border-primary/40 transition-all duration-300"
                style={{ animation: `fade-up 0.6s ${i * 0.1}s both` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 md:py-28 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Three steps to insight</h2>
            <p className="text-muted-foreground text-lg">A streamlined workflow from scan to report.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {[
              { icon: Upload, step: "01", title: "Upload Scan", desc: "Drag &amp; drop your MRI, CT, X-ray or retinal image." },
              { icon: Cpu, step: "02", title: "AI Analysis", desc: "Our models detect findings with confidence scoring in seconds." },
              { icon: FileText, step: "03", title: "Get Report", desc: "Receive a structured clinical report with severity and recommendations." },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                <div className="glass rounded-2xl p-7 h-full hover:border-primary/40 transition-all duration-300">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <s.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="font-mono text-3xl font-bold text-primary/30">{s.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: s.desc }} />
                </div>
                {i < 2 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-5 -translate-y-1/2 w-6 h-6 text-primary/40 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="glass rounded-2xl p-8 md:p-10 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-3">Built for students, research &amp; demos</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  MedVision AI is an assistive tool designed for educational and research use. It is not a substitute for professional medical judgement or diagnosis.
                </p>
              </div>
              <ul className="space-y-3">
                {["No personal data stored", "Encrypted in-transit", "Open research models", "Free for academic use"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-20 md:py-28 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative glass rounded-3xl p-10 md:p-16 text-center overflow-hidden max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-[var(--gradient-hero)] pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to analyze your first scan?</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Launch the live MedVision AI app and get instant results — no signup required.
              </p>
              <Button variant="hero" size="xl" onClick={() => launchApp(setLoading)}>
                Start Free Analysis <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span>© 2026 MedVision AI — Assistive tool, not a substitute for medical advice.</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it Works</a>
          </div>
        </div>
      </footer>

      {/* Floating Launch Button (mobile-friendly) */}
      <button
        onClick={() => launchApp(setLoading)}
        className="fixed bottom-6 right-6 z-40 md:hidden flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-[var(--shadow-glow)] animate-pulse-glow"
        aria-label="Launch MedVision AI app"
      >
        <Rocket className="w-4 h-4" /> Launch
      </button>
    </div>
  );
};

export default Index;
