import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Vote as VoteIcon, CheckCircle, ArrowLeft } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface Candidate {
  id: string;
  name: string;
  position: string;
  photo_url: string | null;
  manifesto: string | null;
}

const Vote = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/login");
      } else {
        fetchData(session.user.id);
      }
    });

    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.data.subscription.unsubscribe();
  }, [navigate]);

  const fetchData = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      if (profileData.has_voted) {
        toast.info("You have already voted");
        navigate("/dashboard");
        return;
      }

      const { data: candidatesData, error: candidatesError } = await supabase
        .from("candidates")
        .select("*")
        .order("position");

      if (candidatesError) throw candidatesError;
      setCandidates(candidatesData);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to load voting data");
    } finally {
      setLoading(false);
    }
  };

  const positions = Array.from(new Set(candidates.map(c => c.position)));

  const handleSubmit = async () => {
    if (Object.keys(votes).length !== positions.length) {
      toast.error("Please select a candidate for all positions");
      return;
    }

    try {
      setSubmitting(true);

      const voteRecords = Object.entries(votes).map(([position, candidateId]) => ({
        user_id: session!.user.id,
        candidate_id: candidateId,
        position: position as "president" | "vice_president" | "secretary" | "treasurer"
      }));

      const { error: voteError } = await supabase
        .from("votes")
        .insert(voteRecords);

      if (voteError) throw voteError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ has_voted: true })
        .eq("id", session!.user.id);

      if (profileError) throw profileError;

      toast.success("Your vote has been cast successfully!");
      navigate("/results");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold">Cast Your Vote</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <VoteIcon className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Student Council Election</h2>
          <p className="text-muted-foreground">Select one candidate for each position</p>
        </div>

        <div className="space-y-8">
          {positions.map((position) => (
            <Card key={position}>
              <CardHeader>
                <CardTitle className="capitalize">{position.replace("_", " ")}</CardTitle>
                <CardDescription>Select your preferred candidate</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={votes[position]}
                  onValueChange={(value) => setVotes({ ...votes, [position]: value })}
                >
                  <div className="space-y-4">
                    {candidates
                      .filter((c) => c.position === position)
                      .map((candidate) => (
                        <div
                          key={candidate.id}
                          className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:border-primary transition-colors"
                        >
                          <RadioGroupItem value={candidate.id} id={candidate.id} />
                          <Label
                            htmlFor={candidate.id}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-start gap-4">
                              {candidate.photo_url && (
                                <img
                                  src={candidate.photo_url}
                                  alt={candidate.name}
                                  className="w-16 h-16 rounded-full object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-semibold">{candidate.name}</p>
                                {candidate.manifesto && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {candidate.manifesto}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || Object.keys(votes).length !== positions.length}
            className="min-w-[200px]"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {submitting ? "Submitting..." : "Submit Vote"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Vote;
