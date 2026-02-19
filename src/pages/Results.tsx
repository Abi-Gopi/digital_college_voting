// src/pages/Results.tsx — UI matches app theme (purple-pink gradients, colored cards)
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import maleAvatar from "@/assets/male.png";
import femaleAvatar from "@/assets/female.png";
import { toast } from "sonner";
import { Trophy, Medal, Award, TrendingUp, Users, AlertCircle, CheckCircle } from "lucide-react";

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
  const [totalVoters, setTotalVoters] = useState(0);
  const [totalCandidates, setTotalCandidates] = useState(0);

  const loadAll = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { toast.error("Please log in again."); return; }

      const headers = { Authorization: `Bearer ${token}` };
      const base = import.meta.env.VITE_API_URL;

      const statusRes = await fetch(`${base}/admin/results-status`, { headers });
      if (!statusRes.ok) throw new Error("Failed to load results status");
      const statusData: ResultsStatus = await statusRes.json();
      setStatus(statusData);

      const statsRes = await fetch(`${base}/admin/stats`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setTotalVoters(statsData.totalVoters ?? 0);
        setTotalCandidates(statsData.totalCandidates ?? 0);
      }

      const resultsRes = await fetch(`${base}/votes/results`, { headers });
      if (!resultsRes.ok) throw new Error("Failed to load results");
      const resultsData = await resultsRes.json();
      setRows(Array.isArray(resultsData) ? (resultsData as ResultRow[]) : []);
    } catch (err: any) {
      console.error("Results load error:", err);
      toast.error(err.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-purple-100"></div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-t-purple-500 animate-spin"></div>
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading election results…</p>
      </div>
    );
  }

  const published = status?.published ?? false;
  const publishedAtText = status?.publishedAt &&
    new Date(status.publishedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  const positions = Array.from(new Set(rows.map((r) => r.Position)));
  const totalVotesCast = rows.reduce((sum, r) => sum + (r.TotalVotes || 0), 0);

  const perPosition = positions.map((pos) => {
    const list = rows.filter((r) => r.Position === pos);
    const sorted = [...list].sort((a, b) => (b.TotalVotes || 0) - (a.TotalVotes || 0));
    const totalForPos = sorted.reduce((s, r) => s + (r.TotalVotes || 0), 0);
    const winner = sorted[0];
    const others = sorted.slice(1);
    const tie = sorted.length > 1 &&
      (sorted[0].TotalVotes || 0) === (sorted[1].TotalVotes || 0) &&
      (sorted[0].TotalVotes || 0) > 0;
    return { pos, totalForPos, winner, others, tie };
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">

      {/* ── HEADER — matches app gradient style ── */}
      <div className="rounded-2xl overflow-hidden shadow-lg"
           style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #ec4899 100%)" }}>
        <div className="px-8 py-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-yellow-300" />
              <h1 className="text-3xl font-bold text-white">Final Election Results</h1>
            </div>
            <p className="text-purple-100 text-sm">
              {published && publishedAtText
                ? `📜 Officially announced · ${publishedAtText}`
                : "⏳ Awaiting official announcement by the Election Committee"}
            </p>
          </div>
          <Trophy className="w-14 h-14 text-white/20 hidden sm:block" />
        </div>
      </div>

      {/* ── STATS ROW — always visible, matches colored card style ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 shadow-sm text-white"
             style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-blue-100 font-medium">Total Registered Voters</p>
            <Users className="w-6 h-6 text-white/50" />
          </div>
          <p className="text-4xl font-bold">{totalVoters}</p>
        </div>

        <div className="rounded-2xl p-5 shadow-sm text-white"
             style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-purple-100 font-medium">Total Candidates</p>
            <Users className="w-6 h-6 text-white/50" />
          </div>
          <p className="text-4xl font-bold">{totalCandidates}</p>
        </div>

        <div className="rounded-2xl p-5 shadow-sm text-white"
             style={{ background: "linear-gradient(135deg, #10b981, #34d399)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-emerald-100 font-medium">Total Votes Cast</p>
            <TrendingUp className="w-6 h-6 text-white/50" />
          </div>
          <p className="text-4xl font-bold">{published ? totalVotesCast : "—"}</p>
        </div>
      </div>

      {/* ── NOT PUBLISHED BANNER ── */}
      {!published && (
        <div className="rounded-2xl border-2 border-orange-200 overflow-hidden shadow-sm bg-white">
          <div className="px-6 py-4 flex items-center gap-3"
               style={{ background: "linear-gradient(135deg, #fff7ed, #fef3c7)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}>
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-orange-900 text-lg">Results Not Yet Announced</p>
              <p className="text-orange-600 text-xs mt-0.5">
                The Election Committee is finalising the official results
              </p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-gray-600 text-sm leading-relaxed">
              The election has concluded and all votes have been <strong>securely recorded</strong>.
              However, the Election Committee has not yet officially published the results.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "Voting Closed", done: true },
                { label: "Votes Under Review", done: true },
                { label: "Official Announcement", done: false },
              ].map((s, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium
                  ${s.done ? "bg-green-50 border-green-200 text-green-800" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${s.done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {s.done ? "✓" : `0${i + 1}`}
                  </span>
                  {s.label}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              🔔 <strong>Check back soon!</strong> Results will appear here once the admin officially publishes them.
            </p>
          </div>
        </div>
      )}

      {/* ── RESULTS BY POSITION — only when published ── */}
      {published && perPosition.map(({ pos, totalForPos, winner, others, tie }, idx) => (
        <div key={pos} className="bg-white rounded-2xl border border-purple-100 overflow-hidden shadow-sm">

          {/* position header — gradient matching app style */}
          <div className="px-6 py-4 flex items-center justify-between"
               style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)" }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🏅"}
              </span>
              <h2 className="text-white font-bold text-lg">{formatPosition(pos)}</h2>
            </div>
            <span className="text-white/70 text-xs font-medium bg-white/10 px-3 py-1 rounded-full">
              {totalForPos} votes total
            </span>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-5">

              {/* WINNER */}
              <div className="flex-1">
                {winner && winner.TotalVotes > 0 ? (
                  <div className="rounded-2xl border-2 border-green-200 p-5"
                       style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 font-bold text-sm tracking-wide uppercase">Winner</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={getAvatar(winner.Gender)}
                          alt={winner.Name}
                          className="w-20 h-20 rounded-full object-cover border-4 border-green-400 shadow-md"
                        />
                        <span className="absolute -bottom-1 -right-1 text-lg">🏆</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-bold text-gray-900">{winner.Name}</p>
                        {winner.Gender && (
                          <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">{winner.Gender}</p>
                        )}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span className="bg-green-600 text-white px-3 py-1 rounded-lg font-bold text-base">
                            {winner.TotalVotes} votes
                          </span>
                          <span className="text-sm text-green-700 font-semibold">
                            {totalForPos > 0 ? ((winner.TotalVotes / totalForPos) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        {/* vote bar */}
                        <div className="mt-2 h-2 bg-green-100 rounded-full overflow-hidden max-w-[180px]">
                          <div
                            className="h-2 bg-green-500 rounded-full transition-all duration-700"
                            style={{ width: totalForPos > 0 ? `${(winner.TotalVotes / totalForPos) * 100}%` : "0%" }}
                          />
                        </div>
                        {tie && <p className="text-xs text-red-500 mt-2 font-semibold">⚠ Tied for first place</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center text-gray-400 text-sm">
                    No votes recorded for this position.
                  </div>
                )}
              </div>

              {/* OTHER CANDIDATES */}
              {others.length > 0 && (
                <div className="md:w-60 flex-shrink-0">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Other Candidates</p>
                  <div className="space-y-2">
                    {others.map((c, i) => {
                      const pct = totalForPos > 0 ? (c.TotalVotes / totalForPos) * 100 : 0;
                      return (
                        <div key={c.CandidateId}
                             className="bg-gray-50 border border-gray-200 rounded-xl p-3 hover:border-purple-200 transition-colors">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-400 w-5">#{i + 2}</span>
                              <span className="text-sm font-semibold text-gray-700">{c.Name}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-700">{c.TotalVotes}</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                background: "linear-gradient(90deg, #8b5cf6, #ec4899)"
                              }}
                            />
                          </div>
                          <p className="text-right text-xs text-gray-400 mt-1">{pct.toFixed(1)}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* FOOTER */}
      {published && rows.length > 0 && (
        <div className="rounded-2xl p-6 text-center shadow-sm"
             style={{ background: "linear-gradient(135deg, #ede9fe, #fce7f3)" }}>
          <p className="text-lg font-bold text-purple-800 mb-1">🎉 Congratulations to all winners!</p>
          <p className="text-purple-600 text-sm">
            Thank you to every student who participated in making this election a success.
          </p>
        </div>
      )}
    </div>
  );
};

export default Results;