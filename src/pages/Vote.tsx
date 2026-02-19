// src/pages/Vote.tsx - WITH VALIDATION: Must select all positions

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle } from "lucide-react";

import maleAvatar from "@/assets/male.png";
import femaleAvatar from "@/assets/female.png";

// ✅ FIXED: Match stored procedure output (Id, not CandidateId)
interface Candidate {
  Id: number;              // sp_GetCandidates returns Id
  Name: string;
  Position: string;
  Manifesto?: string;
  PhotoUrl?: string;
  Gender?: string;
}

const Vote = () => {
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [selectedCandidates, setSelectedCandidates] = useState<
    Record<string, Candidate | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const getAvatarSrc = (c: Candidate) => {
    if (c.PhotoUrl && c.PhotoUrl.trim() !== "") return c.PhotoUrl;
    if (c.Gender && c.Gender.toLowerCase() === "female") return femaleAvatar;
    return maleAvatar;
  };

  // ✅ Fetch candidates
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in first.");
          navigate("/login");
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/candidates`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch candidates");
        }

        console.log("Candidates fetched:", data);

        // Group by position
        const grouped = data.reduce(
          (acc: Record<string, Candidate[]>, c: Candidate) => {
            if (!acc[c.Position]) acc[c.Position] = [];
            acc[c.Position].push(c);
            return acc;
          },
          {}
        );

        setCandidates(grouped);
        console.log("Grouped candidates:", grouped);
      } catch (error: any) {
        console.error("Error fetching candidates:", error);
        toast.error(error.message || "Failed to load candidates");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [navigate]);

  // ✅ Handle candidate selection
  const handleSelect = (position: string, candidate: Candidate) => {
    console.log("Selected:", position, candidate);
    setSelectedCandidates((prev) => ({
      ...prev,
      [position]: candidate,
    }));
  };

  // ✅ Calculate selection progress
  const positionsToVote = Object.entries(candidates)
    .filter(([, list]) => list && list.length > 0)
    .map(([pos]) => pos);
  
  const selectedCount = positionsToVote.filter(pos => selectedCandidates[pos]).length;
  const totalCount = positionsToVote.length;
  const allSelected = selectedCount === totalCount;

  // ✅ Handle vote submission with FULL VALIDATION
  const handleSubmit = async () => {
    if (submitting) return;

    // ✅ CRITICAL: Ensure user selected a candidate for EVERY position
    const missing = positionsToVote.filter((pos) => !selectedCandidates[pos]);
    if (missing.length > 0) {
      const missingFormatted = missing
        .map(p => p.replace(/_/g, " ").toUpperCase())
        .join(", ");
      
      toast.error(
        `⚠️ Please select a candidate for ALL positions!\n\nMissing: ${missingFormatted}`,
        { duration: 6000 }
      );
      return;
    }

    // Confirm before submitting
    const confirmMessage = `You are about to submit votes for ${positionsToVote.length} positions.\n\nThis action CANNOT be undone.\n\nDo you want to continue?`;
    const confirmed = window.confirm(confirmMessage);
    
    if (!confirmed) return;

    // ✅ FIXED: Use Id field (from stored procedure)
    const votes = positionsToVote.map((position) => {
      const candidate = selectedCandidates[position]!;
      return {
        position,
        candidateId: Number(candidate.Id), // Use Id field
      };
    });

    console.log("Submitting votes:", votes);

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to vote.");
        navigate("/login");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ votes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit votes");
      }

      toast.success("✅ Your votes have been submitted successfully!");
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Vote submission error:", error);
      toast.error(error.message || "Failed to submit votes");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-muted-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p>Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">
          Vote for Your Candidate
        </h1>

        {/* ✅ Selection Progress Indicator */}
        <div className="mb-6">
          <Card className={`border-2 ${allSelected ? 'border-green-500 bg-green-50' : 'border-orange-400 bg-orange-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {allSelected ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-bold text-green-900">All positions selected!</p>
                        <p className="text-sm text-green-700">You can now submit your votes</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-6 h-6 text-orange-600" />
                      <div>
                        <p className="font-bold text-orange-900">
                          {totalCount - selectedCount} position{totalCount - selectedCount !== 1 ? 's' : ''} remaining
                        </p>
                        <p className="text-sm text-orange-700">
                          Please select a candidate from each position
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-800">
                    {selectedCount} / {totalCount}
                  </p>
                  <p className="text-xs text-gray-600">selected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {Object.keys(candidates).length === 0 ? (
          <p className="text-center text-muted-foreground">
            No candidates available yet.
          </p>
        ) : (
          Object.entries(candidates).map(([position, candidateList]) => {
            const hasSelection = !!selectedCandidates[position];
            
            return (
              <Card 
                key={position} 
                className={`mb-6 shadow-lg border-2 ${
                  hasSelection ? 'border-green-400' : 'border-purple-200'
                }`}
              >
                <CardHeader className={`${
                  hasSelection 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                    : 'bg-gradient-to-r from-purple-50 to-pink-50'
                }`}>
                  <CardTitle className="capitalize text-xl font-semibold flex items-center justify-between">
                    <span className="text-purple-700">
                      {position.replace(/_/g, " ")}
                    </span>
                    {hasSelection && (
                      <span className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="w-5 h-5" />
                        Selected
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-6">
                  {candidateList.map((candidate) => {
                    const isSelected =
                      selectedCandidates[position]?.Id === candidate.Id;
                    return (
                      <div
                        key={candidate.Id}
                        onClick={() => handleSelect(position, candidate)}
                        className={`flex flex-col items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 shadow-lg scale-105"
                            : "border-gray-200 hover:border-blue-400 hover:shadow-md"
                        }`}
                      >
                        <img
                          src={getAvatarSrc(candidate)}
                          alt={candidate.Name}
                          className="w-20 h-20 rounded-full object-cover mb-3 border-4 border-blue-300"
                        />
                        <h3 className="font-semibold text-lg text-gray-800">
                          {candidate.Name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2 capitalize">
                          {candidate.Position.replace(/_/g, " ")}
                        </p>
                        {candidate.Manifesto && (
                          <p className="text-xs text-center text-gray-600 line-clamp-2">
                            {candidate.Manifesto}
                          </p>
                        )}
                        {isSelected && (
                          <div className="mt-2 text-blue-600 font-bold flex items-center gap-1">
                            <span>✓</span> Selected
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })
        )}

        <div className="text-center mt-6">
          <Button
            onClick={handleSubmit}
            className={`px-8 py-3 text-lg font-semibold ${
              allSelected
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={loading || submitting || !allSelected}
          >
            {submitting ? "Submitting..." : allSelected ? "Submit Vote ✓" : `Select All Positions (${selectedCount}/${totalCount})`}
          </Button>
          
          {!allSelected && (
            <p className="text-sm text-orange-600 mt-3 font-medium">
              ⚠️ You must select a candidate from all {totalCount} positions before submitting
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vote;