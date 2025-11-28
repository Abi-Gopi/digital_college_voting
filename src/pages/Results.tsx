import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, Users } from "lucide-react";

interface VoteCount {
  candidate_id: string;
  candidate_name: string;
  position: string;
  vote_count: number;
}

const Results = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<VoteCount[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);

  useEffect(() => {
    fetchResults();

    const channel = supabase
      .channel("results-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
        },
        () => {
          fetchResults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchResults = async () => {
    try {
      const { data: votesData, error: votesError } = await supabase
        .from("votes")
        .select(`
          candidate_id,
          position,
          candidates (name)
        `);

      if (votesError) throw votesError;

      const voteCounts: Record<string, VoteCount> = {};
      votesData.forEach((vote: any) => {
        const key = `${vote.candidate_id}-${vote.position}`;
        if (!voteCounts[key]) {
          voteCounts[key] = {
            candidate_id: vote.candidate_id,
            candidate_name: vote.candidates.name,
            position: vote.position,
            vote_count: 0,
          };
        }
        voteCounts[key].vote_count++;
      });

      setResults(Object.values(voteCounts));

      const { count, error: countError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("has_voted", true);

      if (countError) throw countError;
      setTotalVoters(count || 0);
    } catch (error: any) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const positions = Array.from(new Set(results.map((r) => r.position)));

  const getPositionResults = (position: string) => {
    const positionResults = results.filter((r) => r.position === position);
    const totalVotes = positionResults.reduce((sum, r) => sum + r.vote_count, 0);
    return positionResults
      .map((r) => ({
        ...r,
        percentage: totalVotes > 0 ? (r.vote_count / totalVotes) * 100 : 0,
      }))
      .sort((a, b) => b.vote_count - a.vote_count);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Live Results</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Election Results</h2>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <p>{totalVoters} students have voted</p>
          </div>
        </div>

        <div className="space-y-8">
          {positions.map((position) => {
            const positionResults = getPositionResults(position);
            const winner = positionResults[0];

            return (
              <Card key={position}>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {position.replace("_", " ")}
                  </CardTitle>
                  <CardDescription>
                    {winner && `Leading: ${winner.candidate_name} with ${winner.vote_count} votes`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {positionResults.map((result, index) => (
                      <div key={result.candidate_id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <Trophy className="w-5 h-5 text-accent" />
                            )}
                            <span className="font-medium">{result.candidate_name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.vote_count} votes ({result.percentage.toFixed(1)}%)
                          </div>
                        </div>
                        <Progress value={result.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {results.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No votes have been cast yet</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Results;
