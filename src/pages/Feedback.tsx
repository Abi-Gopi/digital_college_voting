// src/pages/Feedback.tsx - PROFESSIONALLY ENHANCED VERSION
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Star, 
  Users, 
  MessageSquare, 
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Vote,
  Lightbulb
} from "lucide-react";
import feedbackBanner from "@/assets/feedback1.png";

type YesNo = "yes" | "no" | "";

const Feedback = () => {
  const [recommendation, setRecommendation] = useState("");
  const [isRegisteredVoter, setIsRegisteredVoter] = useState<YesNo>("");
  const [candidateSatisfaction, setCandidateSatisfaction] = useState<number | null>(null);
  const [processTrust, setProcessTrust] = useState<number | null>(null);
  const [keyIssue, setKeyIssue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/feedback/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        if (data.hasFeedback) setAlreadySubmitted(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkExisting();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (alreadySubmitted) {
      toast.error("You've already shared your valuable feedback!");
      return;
    }

    // Validate all fields
    if (!isRegisteredVoter) {
      toast.error("Please confirm your voter registration status");
      return;
    }

    if (candidateSatisfaction == null) {
      toast.error("Please rate the quality and diversity of candidates");
      return;
    }

    if (!keyIssue.trim()) {
      toast.error("Please share the most critical issue for student welfare");
      return;
    }

    if (processTrust == null) {
      toast.error("Please rate the transparency and fairness of the election");
      return;
    }

    if (!recommendation.trim()) {
      toast.error("Please provide actionable recommendations");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          candidateSatisfaction: candidateSatisfaction,
          keyIssue: keyIssue,
          processTrust: processTrust,
          isRegisteredVoter: isRegisteredVoter === "yes",
          recommendation: recommendation,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit feedback");

      toast.success("🎉 Thank you for contributing to democratic governance!");
      setAlreadySubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-xl border-2 border-blue-100">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-7 h-7" />
            Post-Election Feedback Survey
          </CardTitle>
          <p className="text-blue-100 text-sm mt-2">
            Your insights drive continuous improvement in our democratic processes
          </p>
        </CardHeader>

        <CardContent className="p-6">
          {/* Banner Image */}
          <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg">
            <img
              src={feedbackBanner}
              alt="Feedback"
              className="w-full max-h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div>
                <p className="text-white text-lg font-semibold">
                  📊 Help Shape Future Elections
                </p>
                <p className="text-blue-100 text-sm">
                  Your feedback directly influences policy decisions and process improvements
                </p>
              </div>
            </div>
          </div>

          {alreadySubmitted ? (
            <div className="bg-green-50 border-2 border-green-400 rounded-xl p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-800 mb-2">
                Feedback Successfully Recorded 🎉
              </h3>
              <p className="text-green-700">
                Thank you for your contribution to improving our electoral system. Your insights are valuable to the Election Committee.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Question 1: Participation Status */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3 mb-4">
                  <Vote className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-lg text-gray-800 mb-1">
                      1. Voter Participation Status
                    </p>
                    <p className="text-sm text-gray-600">
                      Did you complete your voter registration and successfully cast your vote in this election?
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 ml-9">
                  <Button
                    type="button"
                    size="lg"
                    variant={isRegisteredVoter === "yes" ? "default" : "outline"}
                    onClick={() => setIsRegisteredVoter("yes")}
                    className={`flex-1 ${
                      isRegisteredVoter === "yes" 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "hover:border-green-600"
                    }`}
                  >
                    ✅ Yes, I Participated
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant={isRegisteredVoter === "no" ? "default" : "outline"}
                    onClick={() => setIsRegisteredVoter("no")}
                    className={`flex-1 ${
                      isRegisteredVoter === "no" 
                        ? "bg-gray-600 hover:bg-gray-700" 
                        : "hover:border-gray-600"
                    }`}
                  >
                    ❌ No, I Did Not Vote
                  </Button>
                </div>
              </div>

              {/* Question 2: Candidate Quality & Diversity */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                <div className="flex items-start gap-3 mb-4">
                  <Users className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-lg text-gray-800 mb-1">
                      2. Candidate Quality & Representation
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      How satisfied are you with the quality, diversity, and representation of candidates across different positions?
                    </p>
                    <p className="text-xs text-purple-700 italic">
                      Consider: Qualifications, vision clarity, gender diversity, departmental representation
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 ml-9 flex-wrap">
                  {[
                    { value: 1, label: "Poor" },
                    { value: 2, label: "Below Average" },
                    { value: 3, label: "Average" },
                    { value: 4, label: "Good" },
                    { value: 5, label: "Excellent" }
                  ].map((rating) => (
                    <Button
                      key={rating.value}
                      type="button"
                      size="lg"
                      variant={candidateSatisfaction === rating.value ? "default" : "outline"}
                      onClick={() => setCandidateSatisfaction(rating.value)}
                      className={`flex-1 min-w-[100px] flex-col h-auto py-3 ${
                        candidateSatisfaction === rating.value
                          ? rating.value <= 2
                            ? "bg-red-600 hover:bg-red-700"
                            : rating.value === 3
                            ? "bg-yellow-600 hover:bg-yellow-700"
                            : "bg-green-600 hover:bg-green-700"
                          : "hover:border-purple-600"
                      }`}
                    >
                      <Star className="w-5 h-5 mb-1" fill={candidateSatisfaction === rating.value ? "white" : "none"} />
                      <span className="font-bold">{rating.value}</span>
                      <span className="text-xs">{rating.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Question 3: Priority Issue */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-200">
                <div className="flex items-start gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-800 mb-1">
                      3. Critical Student Welfare Issue
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      What is the single most important issue that the elected student council should prioritize?
                    </p>
                    <p className="text-xs text-orange-700 italic">
                      Be specific: e.g., "Improve library hours from 6 PM to 10 PM on weekdays" rather than just "Better facilities"
                    </p>
                  </div>
                </div>
                <Textarea
                  value={keyIssue}
                  onChange={(e) => setKeyIssue(e.target.value)}
                  placeholder="Examples:
• Academic: Extended library hours, better lab equipment, guest lecture series
• Infrastructure: Improved hostel facilities, cafeteria quality, WiFi coverage
• Extracurricular: More cultural events, sports facilities, club funding
• Welfare: Mental health support, scholarship information, grievance redressal"
                  className="ml-9 min-h-[120px] border-2 border-orange-200 focus:border-orange-400 font-mono text-sm"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-2 ml-9">
                  {keyIssue.length}/500 characters • Be specific and actionable
                </p>
              </div>

              {/* Question 4: Process Transparency & Fairness */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
                <div className="flex items-start gap-3 mb-4">
                  <ShieldCheck className="w-6 h-6 text-teal-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-lg text-gray-800 mb-1">
                      4. Electoral Process Integrity
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Rate your confidence in the transparency, fairness, and security of the entire election process.
                    </p>
                    <p className="text-xs text-teal-700 italic">
                      Consider: Registration ease, KYC verification, voting interface, result transparency
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 ml-9 flex-wrap">
                  {[
                    { value: 1, label: "Very Low" },
                    { value: 2, label: "Low" },
                    { value: 3, label: "Moderate" },
                    { value: 4, label: "High" },
                    { value: 5, label: "Very High" }
                  ].map((rating) => (
                    <Button
                      key={rating.value}
                      type="button"
                      size="lg"
                      variant={processTrust === rating.value ? "default" : "outline"}
                      onClick={() => setProcessTrust(rating.value)}
                      className={`flex-1 min-w-[100px] flex-col h-auto py-3 ${
                        processTrust === rating.value
                          ? rating.value <= 2
                            ? "bg-red-600 hover:bg-red-700"
                            : rating.value === 3
                            ? "bg-yellow-600 hover:bg-yellow-700"
                            : "bg-green-600 hover:bg-green-700"
                          : "hover:border-teal-600"
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5 mb-1" />
                      <span className="font-bold">{rating.value}</span>
                      <span className="text-xs">{rating.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Question 5: Actionable Recommendations */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
                <div className="flex items-start gap-3 mb-4">
                  <Lightbulb className="w-6 h-6 text-indigo-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-800 mb-1">
                      5. Actionable Recommendations for Improvement
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Provide specific, implementable suggestions to enhance future elections or student governance.
                    </p>
                    <p className="text-xs text-indigo-700 italic">
                      Focus on: What worked well? What needs improvement? What new features would help?
                    </p>
                  </div>
                </div>
                <Textarea
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  placeholder="Suggested areas for feedback:
• Process: Simplify KYC, extend voting hours, add mobile voting app
• Communication: Better candidate information, email notifications, WhatsApp updates
• Transparency: Live turnout updates, faster result declaration, detailed analytics
• Accessibility: Improve UI/UX, add regional language support, offline voting option
• Engagement: Candidate debates, Q&A sessions, manifesto comparison tool"
                  className="ml-9 min-h-[140px] border-2 border-indigo-200 focus:border-indigo-400 font-mono text-sm"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-2 ml-9">
                  {recommendation.length}/1000 characters • Prioritize your top 2-3 suggestions
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Submitting Feedback...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6 mr-2" />
                      Submit Feedback Survey
                    </>
                  )}
                </Button>
              </div>

              {/* Impact & Privacy Notice */}
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-semibold mb-1">
                    📊 Your Impact
                  </p>
                  <p className="text-xs text-blue-700">
                    Feedback is reviewed by the Election Committee and Student Council. High-priority issues are addressed in monthly governance meetings, and statistical trends inform policy decisions.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 text-center">
                    🔒 <strong>Confidentiality Assured:</strong> Individual responses remain anonymous. Only aggregated data is shared with administrators. Your honest feedback drives meaningful change.
                  </p>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback;