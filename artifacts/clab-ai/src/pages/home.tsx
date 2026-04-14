import { Link } from "wouter";
import { Terminal, Shield, Zap, Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="flex h-20 items-center justify-between px-6 lg:px-12 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3 text-primary">
          <Terminal className="h-8 w-8" />
          <span className="font-mono text-2xl font-bold tracking-tighter">CLAB_AI</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-green text-sm px-6">
                Terminal Access
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="relative px-6 lg:px-12 py-32 md:py-48 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0" />
          
          <div className="relative z-10 max-w-4xl space-y-8">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4 glow-green">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
              Four.meme + BNB Chain Ecosystem
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
              The AI Launch Strategist <br/> for <span className="text-primary glow-green">Meme Coin Founders</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Not a toy. A sophisticated strategy terminal. Simulate launches, generate viral narratives, and mitigate risk with predictive AI models.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto h-14 bg-primary text-primary-foreground hover:bg-primary/90 glow-green-hover text-lg px-8 rounded-none border border-primary">
                  Initialize Terminal <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-lg px-8 rounded-none border-border hover:bg-white/5">
                  View Specs
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="px-6 lg:px-12 py-24 bg-card/30 border-y border-border">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Terminal Capabilities</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Data-driven tools to engineer the perfect launch on the BNB Chain.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-card p-8 space-y-4 rounded-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="h-12 w-12 bg-primary/10 rounded flex items-center justify-center border border-primary/20 text-primary mb-6">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Risk Mitigation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Identify copycat attacks, hype collapse scenarios, and community fragmentation before they happen.
                </p>
              </div>
              
              <div className="glass-card p-8 space-y-4 rounded-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="h-12 w-12 bg-primary/10 rounded flex items-center justify-center border border-primary/20 text-primary mb-6">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Narrative Engine</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Generate compelling lore, brand voice, and viral launch threads tailored to your specific audience.
                </p>
              </div>

              <div className="glass-card p-8 space-y-4 rounded-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="h-12 w-12 bg-primary/10 rounded flex items-center justify-center border border-primary/20 text-primary mb-6">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Scenario Simulation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Run predictive models on 6 distinct launch scenarios including Viral Growth, Slow Organic, and Low Budget.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card py-12 px-6 lg:px-12 text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-primary opacity-50">
            <Terminal className="h-5 w-5" />
            <span className="font-mono font-bold">CLAB_AI</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Clab AI Terminal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
