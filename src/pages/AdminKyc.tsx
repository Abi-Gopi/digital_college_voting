// src/pages/AdminKyc.tsx - WITH APPROVE & REJECT
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface KycRow {
  VoterId: number;
  FullName: string;
  AadhaarNumber?: string;
  PANNumber?: string;
  ElectionId?: string;
  IsKycVerified: boolean;
  KycVerifiedAt?: string | null;
}

const AdminKyc = () => {
  const [kycList, setKycList] = useState<KycRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectVoterId, setRejectVoterId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const apiBase = import.meta.env.VITE_API_URL;

  /* ================= FETCH PENDING KYC ================= */
  const fetchPendingKyc = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${apiBase}/settings/admin/pending-kyc`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setKycList(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingKyc();
  }, []);

  /* ================= APPROVE KYC ================= */
  const approveKyc = async (id: number) => {
    try {
      setProcessingId(id);
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${apiBase}/settings/admin/verify-kyc/${id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("KYC approved successfully! Notifications sent.");
      fetchPendingKyc();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  /* ================= REJECT KYC ================= */
  const openRejectModal = (id: number) => {
    setRejectVoterId(id);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessingId(rejectVoterId!);
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${apiBase}/settings/admin/reject-kyc/${rejectVoterId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("KYC rejected successfully");
      setRejectModalOpen(false);
      fetchPendingKyc();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  /* ================= MASK AADHAAR ================= */
  const maskAadhaar = (aadhaar?: string) => {
    if (!aadhaar) return "-";
    const clean = aadhaar.replace(/\s/g, "");
    return "**** **** " + clean.slice(-4);
  };

  if (loading)
    return (
      <div className="text-center mt-10 text-muted-foreground">
        Loading pending KYC requests...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            🛡 Identity Verification Management
          </CardTitle>
        </CardHeader>

        <CardContent>
          {kycList.length === 0 ? (
            <p className="text-muted-foreground">
              No pending KYC requests.
            </p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Aadhaar</th>
                  <th className="p-3 text-left">PAN</th>
                  <th className="p-3 text-left">Election ID</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {kycList.map((row) => (
                  <tr key={row.VoterId} className="border-b">
                    <td className="p-3 font-medium">
                      {row.FullName}
                    </td>

                    <td className="p-3">
                      {maskAadhaar(row.AadhaarNumber)}
                    </td>

                    <td className="p-3">
                      {row.PANNumber || "-"}
                    </td>

                    <td className="p-3">
                      {row.ElectionId || "-"}
                    </td>

                    <td className="p-3">
                      {row.IsKycVerified ? (
                        <span className="text-green-600 font-semibold">
                          ✅ Verified
                        </span>
                      ) : (
                        <span className="text-orange-600 font-semibold">
                          ⏳ Pending
                        </span>
                      )}
                    </td>

                    <td className="p-3 flex gap-2">
                      {!row.IsKycVerified && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveKyc(row.VoterId)}
                            disabled={processingId === row.VoterId}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingId === row.VoterId
                              ? "Approving..."
                              : "✓ Approve"}
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectModal(row.VoterId)}
                            disabled={processingId === row.VoterId}
                          >
                            ✗ Reject
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject KYC Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Reason for Rejection
                </label>
                <Input
                  placeholder="e.g., Documents unclear, Aadhaar mismatch"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setRejectModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                >
                  Confirm Rejection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminKyc;