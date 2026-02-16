// src/pages/Results.tsx - ENHANCED MODERN UI

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import maleAvatar from "@/assets/male.png";
import femaleAvatar from "@/assets/female.png";
import { toast } from "sonner";
import { Trophy, Medal, Award, TrendingUp, Users } from "lucide-react";

interface ResultRow {
  CandidateId: number;
  Name: string;
  Position: string;
  Gender?: string;
  TotalVotes: number;
}

interface ResultsStatus {
  published: boolean;
  publishedAt?: string | null;
}

const formatPosition = (pos: string) =>
  pos.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const getAvatar = (gender?: string) =>
  gender && gender.toLowerCase() === "female" ? femaleAvatar : maleAvatar;

const Results = () => {
  const [status, setStatus] = useState<ResultsStatus | null>(null);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in again.");
        return;
      }

      const [statusRes, resultsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/results-status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/votes/results`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const statusData = await statusRes.json();
      const resultsData = await resultsRes.json();

      if (!statusRes.ok) throw new Error(statusData.error || "Failed to load status");
      if (!resultsRes.ok) throw new Error(resultsData.error || "Failed to load results");

      setStatus(statusData);
      setRows(resultsData as ResultRow[]);
    } catch (err: any) {
      console.error("Results load error:", err);
      toast.error(err.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading election results...</p>
        </div>
      </div>
    );
  }

  const positions = Array.from(new Set(rows.map((r) => r.Position)));
  const totalPositions = positions.length;
  const totalCandidates = rows.length;
  const totalVotesCast = rows.reduce((sum, r) => sum + (r.TotalVotes || 0), 0);

  const perPosition = positions.map((pos) => {
    const list = rows.filter((r) => r.Position === pos);
    const sorted = [...list].sort((a, b) => (b.TotalVotes || 0) - (a.TotalVotes || 0));

    const totalForPos = sorted.reduce((s, r) => s + (r.TotalVotes || 0), 0);
    const winner = sorted[0];
    const others = sorted.slice(1);
    const tie =
      sorted.length > 1 &&
      (sorted[0].TotalVotes || 0) === (sorted[1].TotalVotes || 0) &&
      (sorted[0].TotalVotes || 0) > 0;

    return { pos, totalForPos, winner, others, tie };
  });

  const published = status?.published;
  const publishedAtText =
    status?.publishedAt &&
    new Date(status.publishedAt).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="w-10 h-10" />
              Final Election Results
            </h1>
            {published && publishedAtText && (
              <p className="text-blue-100 text-sm">
                📜 Officially announced: {publishedAtText}
              </p>
            )}
          </div>
          <Trophy className="w-16 h-16 opacity-80" />
        </div>
      </div>

      {/* STATS SUMMARY */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          title="Total Positions"
          value={totalPositions}
          icon={<Award className="w-8 h-8" />}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Total Candidates"
          value={totalCandidates}
          icon={<Users className="w-8 h-8" />}
          gradient="from-purple-500 to-pink-500"
        />
        <StatCard
          title="Total Votes Cast"
          value={totalVotesCast}
          icon={<TrendingUp className="w-8 h-8" />}
          gradient="from-green-500 to-emerald-500"
        />
      </div>

      {/* NOT PUBLISHED WARNING */}
      {!published && (
        <Card className="border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-orange-500 text-white p-3 rounded-full">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-orange-900 text-lg mb-2">
                  📊 Results Not Yet Officially Announced
                </p>
                <p className="text-orange-800 text-sm">
                  Voting data is being collected and tallied. The admin has not published the official winners yet. 
                  Please check back later for the official announcement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RESULTS BY POSITION */}
      {published &&
        perPosition.map(({ pos, totalForPos, winner, others, tie }, idx) => (
          <Card key={pos} className="border-2 border-purple-200 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardTitle className="flex items-center justify-between text-2xl">
                <div className="flex items-center gap-3">
                  {idx === 0 && <Trophy className="w-7 h-7 text-yellow-300" />}
                  {idx === 1 && <Medal className="w-7 h-7 text-gray-300" />}
                  {idx === 2 && <Medal className="w-7 h-7 text-orange-300" />}
                  {idx > 2 && <Award className="w-7 h-7" />}
                  <span>{formatPosition(pos)}</span>
                </div>
                <span className="text-sm font-normal opacity-90">
                  {totalForPos} total votes
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                {/* WINNER SECTION */}
                <div className="flex-1">
                  {winner && winner.TotalVotes > 0 ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300">
                      <p className="text-green-800 font-bold mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-green-600" />
                        WINNER
                      </p>
                      <div className="flex items-center gap-4">
                        <img
                          src={getAvatar(winner.Gender)}
                          alt={winner.Name}
                          className="w-24 h-24 rounded-full border-4 border-green-500 object-cover shadow-lg"
                        />
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{winner.Name}</p>
                          <p className="text-sm text-gray-600 uppercase tracking-wide mt-1">
                            {winner.Gender || ""}
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                              {winner.TotalVotes} votes
                            </div>
                            <div className="text-sm text-gray-600">
                              ({totalForPos > 0 ? ((winner.TotalVotes / totalForPos) * 100).toFixed(1) : 0}%)
                            </div>
                          </div>
                          {tie && (
                            <p className="text-sm text-red-600 mt-2 font-semibold flex items-center gap-1">
                              ⚠️ Tied for first place
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200 text-center">
                      <p className="text-gray-500">No votes recorded for this position yet.</p>
                    </div>
                  )}
                </div>

                {/* OTHER CANDIDATES */}
                {others.length > 0 && (
                  <div className="md:w-1/3 bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
                    <p className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Other Candidates
                    </p>
                    <div className="space-y-3">
                      {others.map((c, i) => (
                        <div
                          key={c.CandidateId}
                          className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 font-bold text-lg">#{i + 2}</span>
                            <div>
                              <p className="font-semibold text-sm text-gray-800">{c.Name}</p>
                              <p className="text-xs text-gray-500">{c.Gender}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{c.TotalVotes}</p>
                            <p className="text-xs text-gray-500">
                              {totalForPos > 0 ? ((c.TotalVotes / totalForPos) * 100).toFixed(1) : 0}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

      {/* FOOTER */}
      {published && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-700">
              🎉 <strong>Congratulations to all winners!</strong> Thank you to everyone who participated in making this election a success.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* STAT CARD COMPONENT */
const StatCard = ({ title, value, icon, gradient }: any) => (
  <div className={`p-6 bg-gradient-to-br ${gradient} text-white rounded-xl shadow-lg transform hover:scale-105 transition-transform`}>
    <div className="flex justify-between items-start mb-3">
      <p className="text-sm opacity-90 font-medium">{title}</p>
      <div className="opacity-70">{icon}</div>
    </div>
    <p className="text-4xl font-bold">{value}</p>
  </div>
);

export default Results;