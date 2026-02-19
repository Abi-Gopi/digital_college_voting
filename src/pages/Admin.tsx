// src/pages/Admin.tsx — Full version with feedback analytics restored
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { TrendingUp, Users, Vote, Download, BarChart3, Calendar, Shield } from "lucide-react";

interface ResultsStatus { published: boolean; publishedAt?: string | null; }
interface PositionRow  { Position: string; TotalVotes: number; }
interface GenderRow    { Gender: string;   TotalVotes: number; }
interface AdminStats {
  totalVoters: number; totalCandidates: number;
  totalVotes: number;  turnoutPercent: number;
  votesByPosition: PositionRow[];
  votesByGender:   GenderRow[];
}

const Admin = () => {
  const [status,    setStatus]    = useState<ResultsStatus | null>(null);
  const [stats,     setStats]     = useState<AdminStats    | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [satisfactionData, setSatisfactionData] = useState<any[]>([]);
  const [trustData,        setTrustData]        = useState<any[]>([]);
  const [issues,           setIssues]           = useState<any[]>([]);

  const [loadingStatus,    setLoadingStatus]    = useState(true);
  const [loadingStats,     setLoadingStats]     = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [publishing,   setPublishing]   = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [downloading,  setDownloading]  = useState(false);

  const apiBase = import.meta.env.VITE_API_URL;

  /* ── fetch status ── */
  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res  = await fetch(`${apiBase}/admin/results-status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load status");
      setStatus(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load results status");
    } finally { setLoadingStatus(false); }
  };

  /* ── fetch stats ── */
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res  = await fetch(`${apiBase}/admin/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const raw = await res.json();
      if (!res.ok) throw new Error(raw.error || "Failed to load stats");

      const rawPos    = raw.votesByPosition || raw.byPosition || raw.positionStats || [];
      const rawGender = raw.votesByGender   || raw.byGender   || raw.genderStats   || [];
      setStats({
        totalVoters:     raw.totalVoters     ?? 0,
        totalCandidates: raw.totalCandidates ?? 0,
        totalVotes:      raw.totalVotes      ?? 0,
        turnoutPercent:  raw.turnoutPercent  ?? 0,
        votesByPosition: rawPos.map((r: any)    => ({ Position:   r.Position, TotalVotes: r.TotalVotes ?? r.Votes ?? r.VoteCount ?? 0 })),
        votesByGender:   rawGender.map((r: any) => ({ Gender:     r.Gender,   TotalVotes: r.TotalVotes ?? r.Votes ?? r.VoteCount ?? 0 })),
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to load admin stats");
    } finally { setLoadingStats(false); }
  };

  /* ── fetch feedback analytics ── */
  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const res  = await fetch(`${apiBase}/feedback/analytics`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setAnalytics(data.summary || {});
      setSatisfactionData(Array.isArray(data.satisfactionDistribution) ? data.satisfactionDistribution : []);
      setTrustData(Array.isArray(data.trustDistribution) ? data.trustDistribution : []);
      setIssues(data.issues || []);
    } catch (err: any) {
      console.error("Analytics fetch error:", err);
      toast.error("Failed to load feedback analytics");
    } finally { setLoadingAnalytics(false); }
  };

  useEffect(() => { fetchStatus(); fetchStats(); fetchAnalytics(); }, []);

  /* ── publish ── */
  const handlePublish = async () => {
    try {
      setPublishing(true);
      const token = localStorage.getItem("token");
      const res  = await fetch(`${apiBase}/admin/publish-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");
      toast.success("✅ Results published successfully!");
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish results");
    } finally { setPublishing(false); }
  };

  /* ── unpublish ── */
  const handleUnpublish = async () => {
    try {
      setUnpublishing(true);
      const token = localStorage.getItem("token");
      const res  = await fetch(`${apiBase}/admin/unpublish-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unpublish");
      toast.success("✅ Results are now hidden from students.");
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.message || "Failed to unpublish results");
    } finally { setUnpublishing(false); }
  };

  /* ── download report ── */
  const downloadReport = async (type: "candidates" | "turnout") => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("token");
      if (!token) { toast.error("You must be logged in as admin."); return; }

      const res = await fetch(`${apiBase}/admin/report/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let errMsg = `Server error ${res.status}`;
        if (contentType.includes("application/json")) {
          const json = await res.json();
          errMsg = json.error || json.message || errMsg;
        } else {
          const text = await res.text();
          errMsg = text || errMsg;
        }
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = type === "candidates" ? "candidate_report.csv" : "turnout_report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("📄 Report downloaded successfully!");
    } catch (err: any) {
      console.error("Download error:", err);
      toast.error(err.message || "Failed to download report");
    } finally { setDownloading(false); }
  };

  /* ── loading ── */
  if (loadingStatus && loadingStats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-purple-100"></div>
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-t-purple-500 animate-spin"></div>
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading admin panel…</p>
      </div>
    );
  }

  const positionData: PositionRow[] = stats?.votesByPosition || [];
  const maxVotes = positionData.length > 0
    ? Math.max(...positionData.map((r) => r.TotalVotes || 0), 1) : 1;
  const barColors = [
    "from-blue-500 to-cyan-400", "from-violet-500 to-purple-400",
    "from-emerald-500 to-teal-400", "from-amber-500 to-orange-400", "from-rose-500 to-pink-400",
  ];
  const PIE_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#22c55e", "#f59e0b"];

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">

      {/* ── HEADER ── */}
      <div className="rounded-2xl overflow-hidden shadow-lg"
           style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #ec4899 100%)" }}>
        <div className="px-8 py-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-white/80" />
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <p className="text-purple-100 text-sm">Anna Adarsh College · Election Management</p>
          </div>
          <BarChart3 className="w-14 h-14 text-white/20 hidden sm:block" />
        </div>
      </div>

      {/* ── PUBLISH CONTROL ── */}
      <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3"
             style={{ background: "linear-gradient(135deg, #ede9fe, #fce7f3)" }}>
          <Calendar className="w-5 h-5 text-purple-600" />
          <div>
            <h2 className="font-bold text-purple-900">Results Publication Control</h2>
            <p className="text-xs text-purple-600">Control what students see on the Results page</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
            status?.published ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
          }`}>
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
              status?.published ? "bg-green-500 animate-pulse" : "bg-orange-400"
            }`} />
            <div>
              <p className={`font-semibold text-sm ${status?.published ? "text-green-800" : "text-orange-800"}`}>
                {status?.published
                  ? "✅ Results are LIVE — visible to all students"
                  : "🔒 Results are HIDDEN — students see pending banner"}
              </p>
              {status?.publishedAt && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Last published: {new Date(status.publishedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handlePublish} disabled={publishing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #10b981, #34d399)" }}>
              {publishing
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Publishing…</>
                : <><span>🚀</span>{status?.published ? "Re-Publish Results" : "Publish Final Results"}</>}
            </button>
            <button onClick={handleUnpublish} disabled={unpublishing || !status?.published}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700 hover:text-red-700 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {unpublishing
                ? <><span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />Hiding…</>
                : <><span>🔒</span>Unpublish / Hide Results</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 shadow-sm text-white"
             style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-blue-100 font-medium">Total Registered Voters</p>
            <Users className="w-6 h-6 text-white/50" />
          </div>
          <p className="text-4xl font-bold">{stats?.totalVoters ?? 0}</p>
        </div>
        <div className="rounded-2xl p-5 shadow-sm text-white"
             style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-purple-100 font-medium">Total Candidates</p>
            <Users className="w-6 h-6 text-white/50" />
          </div>
          <p className="text-4xl font-bold">{stats?.totalCandidates ?? 0}</p>
        </div>
        <div className="rounded-2xl p-5 shadow-sm text-white"
             style={{ background: "linear-gradient(135deg, #10b981, #34d399)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-emerald-100 font-medium">Total Votes Cast</p>
            <Vote className="w-6 h-6 text-white/50" />
          </div>
          <p className="text-4xl font-bold">{stats?.totalVotes ?? 0}</p>
        </div>
      </div>

      {/* ── TURNOUT BAR ── */}
      <div className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-800">Voter Turnout</h3>
          </div>
          <span className="text-2xl font-bold text-orange-500">{stats?.turnoutPercent ?? 0}%</span>
        </div>
        <div className="h-4 bg-orange-100 rounded-full overflow-hidden">
          <div className="h-4 rounded-full transition-all duration-1000"
               style={{ width: `${Math.min(stats?.turnoutPercent ?? 0, 100)}%`,
                        background: "linear-gradient(90deg, #f97316, #ef4444)" }} />
        </div>
      </div>

      {/* ── VOTES BY POSITION ── */}
      <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          Votes by Position
        </h3>
        {positionData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No votes recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {positionData.map((row, idx) => {
              const pct = Math.round((row.TotalVotes / maxVotes) * 100);
              return (
                <div key={row.Position}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                      {row.Position.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-bold text-gray-800">{row.TotalVotes} votes</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-3 rounded-full bg-gradient-to-r ${barColors[idx % barColors.length]} transition-all duration-700`}
                         style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── REPORTS ── */}
      <div className="bg-white rounded-2xl border border-green-100 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3"
             style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
          <Download className="w-5 h-5 text-green-600" />
          <div>
            <h2 className="font-bold text-green-900">Export Reports</h2>
            <p className="text-xs text-green-600">Download CSV reports for records</p>
          </div>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-4">
          {[
            { type: "candidates" as const, label: "Candidate Report",  desc: "All candidates with vote counts",   icon: "📋" },
            { type: "turnout"    as const, label: "Turnout Report",    desc: "Per-voter participation details",   icon: "📈" },
          ].map((r) => (
            <button key={r.type} onClick={() => downloadReport(r.type)} disabled={downloading}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left group">
              <div className="w-11 h-11 rounded-xl bg-gray-100 group-hover:bg-purple-100 flex items-center justify-center text-xl flex-shrink-0 transition-colors">
                {r.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{r.label}</p>
                <p className="text-xs text-gray-500">{r.desc} · CSV</p>
              </div>
              <span className="ml-auto text-gray-300 group-hover:text-purple-400 text-lg transition-colors">↓</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── FEEDBACK ANALYTICS ── */}
      <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden shadow-sm">
        <div className="px-6 py-5 flex items-center gap-3"
             style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)" }}>
          <span className="text-2xl">📊</span>
          <div>
            <h2 className="font-bold text-white text-lg">Student Feedback Analytics</h2>
            <p className="text-purple-100 text-xs">Post-election survey responses</p>
          </div>
        </div>

        <div className="p-6">
          {loadingAnalytics ? (
            <p className="text-center text-gray-400 py-8">Loading analytics…</p>
          ) : analytics ? (
            <div className="space-y-8">

              {/* KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Total Feedback",    value: analytics.TotalFeedback ?? 0,                          gradient: "from-violet-600 to-indigo-600" },
                  { label: "Avg Satisfaction",  value: `${Number(analytics.AvgSatisfaction ?? 0).toFixed(2)} / 5`, gradient: "from-pink-600 to-rose-600" },
                  { label: "Avg Trust Score",   value: `${Number(analytics.AvgTrust        ?? 0).toFixed(2)} / 5`, gradient: "from-blue-600 to-cyan-600" },
                ].map((k, i) => (
                  <div key={i} className={`rounded-xl p-5 text-white bg-gradient-to-r ${k.gradient} shadow-sm`}>
                    <p className="text-xs opacity-80 font-medium mb-1">{k.label}</p>
                    <p className="text-3xl font-bold">{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Donut charts */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
                  <p className="font-bold text-gray-700 mb-4">Satisfaction Distribution</p>
                  <DonutChart data={satisfactionData} dataKey="Count" nameKey="Rating" colors={PIE_COLORS} />
                </div>
                <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
                  <p className="font-bold text-gray-700 mb-4">Trust Level Distribution</p>
                  <DonutChart data={trustData} dataKey="Count" nameKey="Trust" colors={PIE_COLORS} />
                </div>
              </div>

              {/* Top issues bar chart */}
              {issues.length > 0 && (
                <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
                  <p className="font-bold text-gray-700 mb-4">Top Student Concerns</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={issues}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="Q2_KeyIssue" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Count" radius={[8, 8, 0, 0]}>
                        {issues.map((_: any, index: number) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">No feedback data available yet.</p>
          )}
        </div>
      </div>

    </div>
  );
};

/* ── Reusable Donut Chart ── */
const DonutChart = ({ data, dataKey, nameKey, colors }: any) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">No data available</div>;
  }
  const total = data.reduce((sum: number, d: any) => sum + (d[dataKey] || 0), 0);
  if (total === 0) {
    return <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">No data available</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey={dataKey} nameKey={nameKey}
             innerRadius={55} outerRadius={85}
             label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
             labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}>
          {data.map((_: any, i: number) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default Admin;