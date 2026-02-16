// src/pages/Admin.tsx - ENHANCED UI WITH MODERN GRADIENTS

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Calendar, Download, TrendingUp, Users, Vote, BarChart3 } from "lucide-react";

interface ResultsStatus {
  published: boolean;
  publishedAt?: string | null;
}

interface PositionRow {
  Position: string;
  TotalVotes: number;
}

interface AdminStats {
  totalVoters: number;
  totalCandidates: number;
  totalVotes: number;
  turnoutPercent: number;
  votesByPosition: PositionRow[];
}

const Admin = () => {
  const apiBase = import.meta.env.VITE_API_URL;

  const [status, setStatus] = useState<ResultsStatus | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [satisfactionData, setSatisfactionData] = useState<any[]>([]);
  const [trustData, setTrustData] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/admin/results-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStatus(data);
    } catch {
      toast.error("Failed to load results status");
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = await res.json();

      setStats({
        totalVoters: raw.totalVoters ?? 0,
        totalCandidates: raw.totalCandidates ?? 0,
        totalVotes: raw.totalVotes ?? 0,
        turnoutPercent: raw.turnoutPercent ?? 0,
        votesByPosition: raw.votesByPosition ?? [],
      });
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/feedback/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setAnalytics(data.summary || {});

      if (data.satisfactionDistribution && Array.isArray(data.satisfactionDistribution)) {
        setSatisfactionData(data.satisfactionDistribution);
      } else {
        setSatisfactionData([]);
      }

      if (data.trustDistribution && Array.isArray(data.trustDistribution)) {
        setTrustData(data.trustDistribution);
      } else {
        setTrustData([]);
      }

      setIssues(data.issues || []);

    } catch (err) {
      console.error("Analytics fetch error:", err);
      toast.error("Failed to load feedback analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchStats();
    fetchAnalytics();
  }, []);

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const token = localStorage.getItem("token");
      await fetch(`${apiBase}/admin/publish-results`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Results published successfully!");
      fetchStatus();
    } catch {
      toast.error("Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setUnpublishing(true);
      const token = localStorage.getItem("token");
      await fetch(`${apiBase}/admin/unpublish-results`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Results hidden successfully!");
      fetchStatus();
    } catch {
      toast.error("Unpublish failed");
    } finally {
      setUnpublishing(false);
    }
  };

  const downloadReport = async (type: "candidates" | "turnout") => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiBase}/admin/report/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Download failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "candidates"
          ? "candidate_report.csv"
          : "turnout_report.csv";
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded successfully!");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const positionData = stats?.votesByPosition || [];
  const maxVotes =
    positionData.length > 0
      ? Math.max(...positionData.map((r) => r.TotalVotes), 1)
      : 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-blue-100 text-lg">Anna Adarsh College Election Management</p>
          </div>
          <BarChart3 className="w-16 h-16 opacity-80" />
        </div>
      </div>

      {/* ADMIN CONTROL */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Calendar className="w-6 h-6" />
            Results Publication Control
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className={`p-4 rounded-lg border-2 ${status?.published ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'}`}>
            <p className="font-semibold flex items-center gap-2">
              {status?.published ? (
                <>
                  <span className="text-green-600">✅ Results Published</span>
                  {status.publishedAt && (
                    <span className="text-sm text-gray-600">
                      on {new Date(status.publishedAt).toLocaleString()}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-orange-600">🔒 Results Hidden from Students</span>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handlePublish} 
              disabled={publishing || status?.published}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {publishing ? "Publishing..." : status?.published ? "Already Published" : "📢 Publish Results"}
            </Button>

            <Button
              variant="outline"
              onClick={handleUnpublish}
              disabled={unpublishing || !status?.published}
              className="flex-1 border-red-300 hover:bg-red-50"
            >
              {unpublishing ? "Unpublishing..." : "🔒 Unpublish Results"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ELECTION STATS - ENHANCED */}
      <Card className="border-2 border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <TrendingUp className="w-6 h-6" />
            Election Statistics Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">

          {/* KPI CARDS */}
          <div className="grid md:grid-cols-3 gap-6">
            <KpiBox 
              title="Total Registered Voters" 
              value={stats?.totalVoters ?? 0}
              icon={<Users className="w-8 h-8" />}
              gradient="from-blue-500 to-cyan-500"
            />
            <KpiBox 
              title="Total Candidates" 
              value={stats?.totalCandidates ?? 0}
              icon={<Users className="w-8 h-8" />}
              gradient="from-purple-500 to-pink-500"
            />
            <KpiBox 
              title="Total Votes Cast" 
              value={stats?.totalVotes ?? 0}
              icon={<Vote className="w-8 h-8" />}
              gradient="from-green-500 to-emerald-500"
            />
          </div>

          {/* TURNOUT PERCENTAGE */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border-2 border-orange-200">
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-lg text-orange-800">Voter Turnout</p>
              <p className="text-3xl font-bold text-orange-600">{stats?.turnoutPercent.toFixed(2)}%</p>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-orange-500 to-red-500 h-4 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${Math.min(stats?.turnoutPercent ?? 0, 100)}%` }}
              />
            </div>
          </div>

          {/* VOTES BY POSITION */}
          <div>
            <p className="font-bold text-lg mb-4 text-gray-700">Votes by Position</p>
            {positionData.length === 0 ? (
              <p className="text-gray-500 text-sm">No votes cast yet</p>
            ) : (
              <div className="space-y-3">
                {positionData.map((row, idx) => {
                  const width = `${(row.TotalVotes / maxVotes) * 100}%`;
                  const colors = [
                    'from-blue-500 to-cyan-500',
                    'from-purple-500 to-pink-500',
                    'from-green-500 to-emerald-500',
                    'from-orange-500 to-red-500',
                    'from-indigo-500 to-purple-500'
                  ];
                  return (
                    <div key={row.Position} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-gray-700">{row.Position}</span>
                        <span className="font-bold text-gray-900">{row.TotalVotes} votes</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-3 bg-gradient-to-r ${colors[idx % colors.length]} rounded-full shadow transition-all duration-500`}
                          style={{ width }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* REPORTS - ENHANCED */}
      <Card className="border-2 border-green-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Download className="w-6 h-6" />
            Export Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              onClick={() => downloadReport("candidates")}
              disabled={downloading}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 h-14 text-lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Candidate Report (CSV)
            </Button>

            <Button
              onClick={() => downloadReport("turnout")}
              disabled={downloading}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 h-14 text-lg"
            >
              <Download className="mr-2 h-5 w-5" />
              Turnout Report (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FEEDBACK ANALYTICS - ENHANCED */}
      <Card className="border-2 border-indigo-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            📊 Student Feedback Analytics
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {loadingAnalytics ? (
            <p className="text-center text-gray-500">Loading analytics...</p>
          ) : analytics ? (
            <>
              {/* KPI CARDS */}
              <div className="grid md:grid-cols-3 gap-6">
                <AnalyticsKpi 
                  title="Total Feedback" 
                  value={analytics.TotalFeedback ?? 0}
                  gradient="from-purple-600 to-indigo-600"
                />
                <AnalyticsKpi 
                  title="Avg Satisfaction" 
                  value={`${Number(analytics.AvgSatisfaction ?? 0).toFixed(2)} / 5`}
                  gradient="from-pink-600 to-rose-600"
                />
                <AnalyticsKpi 
                  title="Avg Trust Score" 
                  value={`${Number(analytics.AvgTrust ?? 0).toFixed(2)} / 5`}
                  gradient="from-blue-600 to-cyan-600"
                />
              </div>

              {/* CHARTS */}
              <div className="grid md:grid-cols-2 gap-6">

                <ChartCard title="Satisfaction Distribution">
                  <DonutChart
                    data={satisfactionData}
                    dataKey="Count"
                    nameKey="Rating"
                  />
                </ChartCard>

                <ChartCard title="Trust Level Distribution">
                  <DonutChart
                    data={trustData}
                    dataKey="Count"
                    nameKey="Trust"
                  />
                </ChartCard>

              </div>

              {/* TOP ISSUES */}
              {issues.length > 0 && (
                <ChartCard title="Top Student Concerns">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={issues}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="Q2_KeyIssue" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Count" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
                      <defs>
                        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500">No feedback data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* ================= ENHANCED COMPONENTS ================= */

const KpiBox = ({ title, value, icon, gradient }: any) => (
  <div className={`p-6 bg-gradient-to-br ${gradient} text-white rounded-xl shadow-lg transform hover:scale-105 transition-transform`}>
    <div className="flex justify-between items-start mb-3">
      <p className="text-sm opacity-90 font-medium">{title}</p>
      <div className="opacity-70">{icon}</div>
    </div>
    <p className="text-4xl font-bold">{value}</p>
  </div>
);

const AnalyticsKpi = ({ title, value, gradient }: any) => (
  <div className={`p-6 bg-gradient-to-r ${gradient} text-white rounded-xl shadow-xl`}>
    <p className="text-sm opacity-80 font-medium">{title}</p>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

const ChartCard = ({ title, children }: any) => (
  <div className="p-6 border-2 border-gray-200 rounded-xl bg-white shadow-md">
    <p className="font-bold text-lg mb-4 text-gray-800">{title}</p>
    {children}
  </div>
);

const DonutChart = ({ data, dataKey, nameKey }: any) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">
        No data available
      </div>
    );
  }

  const total = data.reduce((sum: number, d: any) => sum + (d[dataKey] || 0), 0);

  if (total === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">
        No data available
      </div>
    );
  }

  const colors = ["#8b5cf6", "#6366f1", "#3b82f6", "#22c55e", "#f59e0b"];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          innerRadius={60}
          outerRadius={90}
          label={({ name, percent }: any) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
          labelLine={{ stroke: '#666', strokeWidth: 1 }}
        >
          {data.map((_: any, index: number) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default Admin;