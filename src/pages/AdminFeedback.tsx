// src/pages/FeedbackManagement.tsx - ENHANCED MODERN UI

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Search, Download, Eye, CheckCircle, Clock, Filter, 
  MessageSquare, Star, TrendingUp, User, Calendar, Mail
} from "lucide-react";

interface FeedbackRow {
  FeedbackId: number;
  FullName: string;
  Email: string;
  StudentId: string;
  Q1_CandidateSatisfaction: number;
  Q2_KeyIssue: string;
  Q3_ProcessTrust: number;
  Q4_IsRegisteredVoter: boolean;
  Recommendation: string;
  IPAddress: string;
  IsReviewed: boolean;
  ReviewedBy?: string;
  ReviewedAt?: string;
  CreatedAt: string;
}

type FilterType = "all" | "pending" | "reviewed";

const FeedbackManagement = () => {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<FeedbackRow | null>(null);

  const apiBase = import.meta.env.VITE_API_URL;

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiBase}/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setFeedback(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const markReviewed = async (id: number) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiBase}/feedback/${id}/review`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("✅ Marked as reviewed!");
      fetchFeedback();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredData = feedback.filter((f) => {
    const matchesFilter = 
      filter === "all" ||
      (filter === "pending" && !f.IsReviewed) ||
      (filter === "reviewed" && f.IsReviewed);

    const matchesSearch = 
      f.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.StudentId.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const exportCSV = () => {
    const headers = [
      "Name", "Email", "StudentId", "CandidateSatisfaction", "KeyIssue",
      "ProcessTrust", "RegisteredVoter", "Recommendation", "IP Address",
      "Reviewed", "Reviewed By", "Reviewed At", "Submitted At",
    ];

    const rows = filteredData.map((f) => [
      f.FullName,
      f.Email,
      f.StudentId,
      f.Q1_CandidateSatisfaction,
      f.Q2_KeyIssue,
      f.Q3_ProcessTrust,
      f.Q4_IsRegisteredVoter ? "Yes" : "No",
      f.Recommendation,
      f.IPAddress,
      f.IsReviewed ? "Yes" : "No",
      f.ReviewedBy || "",
      f.ReviewedAt ? new Date(f.ReviewedAt).toLocaleString() : "",
      new Date(f.CreatedAt).toLocaleString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((e) => e.map((v) => `"${v}"`).join(","))
        .join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "feedback_report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exported successfully!");
  };

  const pendingCount = feedback.filter(f => !f.IsReviewed).length;
  const reviewedCount = feedback.filter(f => f.IsReviewed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <MessageSquare className="w-10 h-10" />
              Feedback Management
            </h1>
            <p className="text-purple-100 text-lg">Review and manage student feedback</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Total Feedback</p>
            <p className="text-5xl font-bold">{feedback.length}</p>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Feedback"
          value={feedback.length}
          icon={<MessageSquare className="w-8 h-8" />}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard 
          title="Pending Review"
          value={pendingCount}
          icon={<Clock className="w-8 h-8" />}
          gradient="from-orange-500 to-amber-500"
        />
        <StatCard 
          title="Reviewed"
          value={reviewedCount}
          icon={<CheckCircle className="w-8 h-8" />}
          gradient="from-green-500 to-emerald-500"
        />
      </div>

      {/* MAIN FEEDBACK TABLE */}
      <Card className="border-2 border-purple-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-purple-800 flex items-center gap-2">
              <Filter className="w-6 h-6" />
              Feedback Entries
            </CardTitle>

            <div className="flex flex-wrap gap-3">
              {/* SEARCH */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-400"
                />
              </div>

              {/* FILTER BUTTONS */}
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                  className={filter === "all" ? "bg-purple-600" : ""}
                >
                  All ({feedback.length})
                </Button>
                <Button
                  variant={filter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("pending")}
                  className={filter === "pending" ? "bg-orange-500" : ""}
                >
                  Pending ({pendingCount})
                </Button>
                <Button
                  variant={filter === "reviewed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("reviewed")}
                  className={filter === "reviewed" ? "bg-green-500" : ""}
                >
                  Reviewed ({reviewedCount})
                </Button>
              </div>

              {/* EXPORT */}
              <Button
                onClick={exportCSV}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredData.length === 0 ? (
            <div className="text-center py-16 px-6">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No feedback found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm ? "Try a different search term" : "Feedback will appear here once submitted"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Voter
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Ratings
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Submitted
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((f) => (
                    <tr
                      key={f.FeedbackId}
                      className="border-b border-gray-100 hover:bg-purple-50 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-gray-900">{f.FullName}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {f.Email}
                          </p>
                          <p className="text-xs text-gray-400">ID: {f.StudentId}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">Satisfaction: {f.Q1_CandidateSatisfaction}/5</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium">Trust: {f.Q3_ProcessTrust}/5</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-700">
                          {new Date(f.CreatedAt).toLocaleDateString("en-IN")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(f.CreatedAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </td>
                      <td className="p-4">
                        {f.IsReviewed ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            Reviewed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                            <Clock className="w-4 h-4" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelected(f)}
                            className="border-purple-200 hover:bg-purple-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>

                          {!f.IsReviewed && (
                            <Button
                              size="sm"
                              onClick={() => markReviewed(f.FeedbackId)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Reviewed
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DETAILS MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto border-4 border-purple-300 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardTitle className="text-2xl">Feedback Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              
              {/* VOTER INFO */}
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Voter Information
                </h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <p><strong>Name:</strong> {selected.FullName}</p>
                  <p><strong>Email:</strong> {selected.Email}</p>
                  <p><strong>Student ID:</strong> {selected.StudentId}</p>
                  <p><strong>IP Address:</strong> {selected.IPAddress}</p>
                </div>
              </div>

              {/* RATINGS */}
              <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Ratings
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Candidate Satisfaction:</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < selected.Q1_CandidateSatisfaction
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Process Trust:</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < selected.Q3_ProcessTrust
                              ? "text-blue-500 fill-blue-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p><strong>Registered Voter:</strong> {selected.Q4_IsRegisteredVoter ? "✅ Yes" : "❌ No"}</p>
                </div>
              </div>

              {/* FEEDBACK */}
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <h3 className="font-bold text-purple-900 mb-3">Key Issue Reported</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.Q2_KeyIssue}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <h3 className="font-bold text-green-900 mb-3">Recommendations</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.Recommendation || "No recommendations provided"}</p>
              </div>

              {/* REVIEW STATUS */}
              <div className={`p-4 rounded-lg border-2 ${
                selected.IsReviewed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <h3 className={`font-bold mb-2 ${
                  selected.IsReviewed ? 'text-green-900' : 'text-orange-900'
                }`}>
                  Review Status
                </h3>
                <div className="text-sm space-y-1">
                  <p><strong>Status:</strong> {selected.IsReviewed ? "✅ Reviewed" : "⏳ Pending"}</p>
                  <p><strong>Submitted:</strong> {new Date(selected.CreatedAt).toLocaleString("en-IN")}</p>
                  {selected.IsReviewed && (
                    <>
                      <p><strong>Reviewed By:</strong> {selected.ReviewedBy || "Admin"}</p>
                      <p><strong>Reviewed At:</strong> {
                        selected.ReviewedAt 
                          ? new Date(selected.ReviewedAt).toLocaleString("en-IN")
                          : "-"
                      }</p>
                    </>
                  )}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3 pt-4 border-t-2">
                {!selected.IsReviewed && (
                  <Button
                    onClick={() => {
                      markReviewed(selected.FeedbackId);
                      setSelected(null);
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Reviewed
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelected(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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

export default FeedbackManagement;