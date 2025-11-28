import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Vote, Shield, Users, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Vote className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">E-Voting System</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button onClick={() => navigate("/register")}>Register</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl font-bold mb-6">
            Secure Digital Voting Platform
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Exercise your democratic right with our secure, transparent, and user-friendly voting system
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/register")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/results")}>
              View Results
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card p-6 rounded-lg border border-border text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Verified</h3>
            <p className="text-muted-foreground">
              OTP verification ensures one vote per student with complete security
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border text-center">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
            <p className="text-muted-foreground">
              Intuitive interface makes voting simple and accessible for everyone
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Results</h3>
            <p className="text-muted-foreground">
              Watch live vote counts and see results as they happen
            </p>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t border-border mt-16">
        <p>© 2025 E-Voting System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
