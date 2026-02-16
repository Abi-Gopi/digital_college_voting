// src/pages/Settings.tsx - WITH RESULTS PUBLISH DATE + ELECTION DATES + PROFILE EDITING + KYC

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Loader2, ShieldCheck, Phone, FileText, CheckCircle2, Clock, 
  Calendar, User, Edit2, Save, X, Award
} from "lucide-react";

interface VoterKycData {
  IsKycVerified: boolean;
  AadhaarNumber?: string;
  PANNumber?: string;
  ElectionId?: string;
  KycVerifiedAt?: string;
  Phone?: string;
}

interface User {
  voterId?: number;
  email?: string;
  fullName?: string;
  role?: "admin" | "voter";
  gender?: string;
  studentId?: string;
  phone?: string;
}

const Settings = () => {
  const apiBase = import.meta.env.VITE_API_URL;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [kycData, setKycData] = useState<VoterKycData | null>(null);
  const [showKycForm, setShowKycForm] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // KYC Form
  const [kycForm, setKycForm] = useState({
    aadhaarNumber: "",
    panNumber: "",
    electionId: "",
  });
  const [otp, setOtp] = useState("");

  // Election Dates (Admin only) - WITH RESULTS PUBLISH DATE
  const [electionDates, setElectionDates] = useState({
    votingStart: "",
    votingEnd: "",
    resultsPublish: "", // ✅ NEW FIELD
  });
  const [savingDates, setSavingDates] = useState(false);

  // Profile Editing (Voter only)
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
  });

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      setProfileForm({
        fullName: parsedUser.fullName || "",
        email: parsedUser.email || "",
        phone: parsedUser.phone || "",
        gender: parsedUser.gender || "",
      });
    }
  }, []);

  /* ================= FETCH KYC STATUS (Voter) ================= */
  useEffect(() => {
    if (user?.role === "voter") {
      fetchKycStatus();
    }
  }, [user]);

  /* ================= FETCH ELECTION DATES (Admin) ================= */
  useEffect(() => {
    if (user?.role === "admin") {
      fetchElectionDates();
    }
  }, [user]);

  const fetchKycStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/settings/kyc-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setKycData(data);
      }
    } catch (err) {
      console.error("Failed to fetch KYC status:", err);
    }
  };

  const fetchElectionDates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/settings/system-dates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setElectionDates({
          votingStart: data.votingStart ? data.votingStart.split('T')[0] : "",
          votingEnd: data.votingEnd ? data.votingEnd.split('T')[0] : "",
          resultsPublish: data.resultsPublish ? data.resultsPublish.split('T')[0] : "", // ✅ NEW
        });
      }
    } catch (err) {
      console.error("Failed to fetch election dates:", err);
    }
  };

  /* ================= SAVE ELECTION DATES (Admin) ================= */
  const handleSaveElectionDates = async () => {
    if (!electionDates.votingStart || !electionDates.votingEnd) {
      toast.error("Voting start and end dates are required");
      return;
    }

    const startDate = new Date(electionDates.votingStart);
    const endDate = new Date(electionDates.votingEnd);

    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    // ✅ VALIDATE RESULTS PUBLISH DATE
    if (electionDates.resultsPublish) {
      const resultsDate = new Date(electionDates.resultsPublish);
      if (resultsDate < endDate) {
        toast.error("Results publish date must be after voting end date");
        return;
      }
    }

    try {
      setSavingDates(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiBase}/settings/update-dates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(electionDates),
      });

      if (!res.ok) {
        throw new Error("Failed to save dates");
      }

      toast.success("Election dates updated successfully!");
    } catch (err) {
      toast.error("Failed to save election dates");
    } finally {
      setSavingDates(false);
    }
  };

  /* ================= UPDATE PROFILE (Voter) ================= */
  const handleUpdateProfile = async () => {
    if (!profileForm.fullName.trim() || !profileForm.email.trim() || !profileForm.phone.trim()) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiBase}/settings/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      const updatedUser = { ...user, ...profileForm };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success("Profile updated successfully!");
      setEditingProfile(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  /* ================= KYC VALIDATION ================= */
  const validateAadhaar = (aadhaar: string) => {
    const clean = aadhaar.replace(/\s/g, "");
    return /^\d{12}$/.test(clean);
  };

  const validatePAN = (pan: string) => {
    const clean = pan.toUpperCase().trim();
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean);
  };

  const validateForm = () => {
    if (!kycForm.aadhaarNumber.trim()) {
      toast.error("Aadhaar number is required");
      return false;
    }

    if (!validateAadhaar(kycForm.aadhaarNumber)) {
      toast.error("Invalid Aadhaar number (12 digits required)");
      return false;
    }

    if (kycForm.panNumber && !validatePAN(kycForm.panNumber)) {
      toast.error("Invalid PAN number format (e.g., ABCDE1234F)");
      return false;
    }

    return true;
  };

  /* ================= KYC OTP FUNCTIONS ================= */
  const handleSendOtpForKyc = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/settings/kyc-send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send OTP");
        return;
      }

      toast.success(`OTP sent to ****${data.maskedPhone}`);
      setOtpSent(true);

      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      if (data.otp) {
        toast.info(`Development OTP: ${data.otp}`, { duration: 10000 });
      }

    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/settings/kyc-resend-otp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to resend OTP");
        return;
      }

      toast.success("OTP resent successfully!");

      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      if (data.otp) {
        toast.info(`Development OTP: ${data.otp}`, { duration: 10000 });
      }

    } catch (err: any) {
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitKyc = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/settings/submit-kyc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          aadhaarNumber: kycForm.aadhaarNumber,
          panNumber: kycForm.panNumber || null,
          electionId: kycForm.electionId || null,
          otp: otp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "KYC submission failed");
        return;
      }

      toast.success("KYC documents submitted! Waiting for admin approval.");
      
      setShowKycForm(false);
      setOtpSent(false);
      setOtp("");
      setKycForm({
        aadhaarNumber: "",
        panNumber: "",
        electionId: "",
      });

      fetchKycStatus();

    } catch (err: any) {
      toast.error(err.message || "KYC submission failed");
    } finally {
      setLoading(false);
    }
  };

  const maskAadhaar = (aadhaar?: string) => {
    if (!aadhaar) return "-";
    const clean = aadhaar.replace(/\s/g, "");
    return "**** **** " + clean.slice(-4);
  };

  /* ================= RENDER ================= */
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      
      {/* ================= ADMIN: ELECTION DATE MANAGEMENT WITH RESULTS PUBLISH DATE ================= */}
      {user?.role === "admin" && (
        <Card className="border-2 border-purple-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calendar className="w-7 h-7" />
              Election Schedule Management
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            
            {/* VOTING DATES */}
            <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                🗳️ Voting Period
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="votingStart" className="text-blue-900">Voting Start Date *</Label>
                  <Input
                    id="votingStart"
                    type="date"
                    value={electionDates.votingStart}
                    onChange={(e) =>
                      setElectionDates({ ...electionDates, votingStart: e.target.value })
                    }
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="votingEnd" className="text-blue-900">Voting End Date *</Label>
                  <Input
                    id="votingEnd"
                    type="date"
                    value={electionDates.votingEnd}
                    onChange={(e) =>
                      setElectionDates({ ...electionDates, votingEnd: e.target.value })
                    }
                    className="border-blue-300 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* RESULTS PUBLISH DATE - NEW */}
            <div className="bg-green-50 p-5 rounded-xl border-2 border-green-200">
              <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Results Announcement
              </h3>
              <div>
                <Label htmlFor="resultsPublish" className="text-green-900">Results Publish Date (Optional)</Label>
                <Input
                  id="resultsPublish"
                  type="date"
                  value={electionDates.resultsPublish}
                  onChange={(e) =>
                    setElectionDates({ ...electionDates, resultsPublish: e.target.value })
                  }
                  className="border-green-300 focus:border-green-500"
                />
                <p className="text-xs text-green-700 mt-2">
                  📅 This date will be displayed on the homepage: "Results will be published on [DATE]"
                </p>
              </div>
            </div>

            {/* SAVE BUTTON */}
            <Button
              onClick={handleSaveElectionDates}
              disabled={savingDates}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-lg"
            >
              {savingDates ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Save Election Schedule
                </>
              )}
            </Button>

            {/* INFO */}
            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <p className="text-sm text-purple-900">
                <strong>📌 Important:</strong>
              </p>
              <ul className="text-xs text-purple-800 mt-2 space-y-1 list-disc list-inside">
                <li>Voting dates control the countdown banner on homepage</li>
                <li>Results publish date shows announcement banner (if set)</li>
                <li>Students see: "Election starts in X days" and "Results on [DATE]"</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= VOTER: PROFILE EDITING ================= */}
      {user?.role === "voter" && (
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <User className="w-6 h-6" />
                Profile Information
              </div>
              {!editingProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProfile(true)}
                  className="border-blue-300 hover:bg-blue-50"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit Profile
                </Button>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profileForm.fullName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, fullName: e.target.value })
                  }
                  disabled={!editingProfile}
                  className={!editingProfile ? "bg-gray-50" : ""}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  disabled={!editingProfile}
                  className={!editingProfile ? "bg-gray-50" : ""}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  disabled={!editingProfile}
                  className={!editingProfile ? "bg-gray-50" : ""}
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  className={`w-full border rounded-md px-3 py-2 ${!editingProfile ? "bg-gray-50" : ""}`}
                  value={profileForm.gender}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, gender: e.target.value })
                  }
                  disabled={!editingProfile}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <Label>Student ID</Label>
                <Input
                  value={user?.studentId || "-"}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  🔒 Student ID cannot be modified
                </p>
              </div>
            </div>

            {editingProfile && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileForm({
                      fullName: user?.fullName || "",
                      email: user?.email || "",
                      phone: user?.phone || "",
                      gender: user?.gender || "",
                    });
                  }}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ================= VOTER: KYC STATUS ================= */}
      {user?.role === "voter" && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" />
              Identity Verification (KYC) Status
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
              <div className="flex items-center gap-3">
                {kycData?.IsKycVerified ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-700">✅ Verified</p>
                      <p className="text-sm text-gray-600">
                        Approved on {kycData.KycVerifiedAt ? new Date(kycData.KycVerifiedAt).toLocaleDateString() : "-"}
                      </p>
                    </div>
                  </>
                ) : kycData?.AadhaarNumber ? (
                  <>
                    <Clock className="w-6 h-6 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-700">⏳ Pending Verification</p>
                      <p className="text-sm text-gray-600">
                        Documents under admin review
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-700">📝 Not Submitted</p>
                      <p className="text-sm text-gray-600">
                        Submit your identity documents
                      </p>
                    </div>
                  </>
                )}
              </div>

              {!kycData?.IsKycVerified && !kycData?.AadhaarNumber && (
                <Button onClick={() => setShowKycForm(true)}>
                  Submit KYC
                </Button>
              )}
            </div>

            {kycData?.AadhaarNumber && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-semibold mb-2">Submitted Documents:</p>
                <div className="space-y-1 text-sm">
                  <p><strong>Aadhaar:</strong> {maskAadhaar(kycData.AadhaarNumber)}</p>
                  <p><strong>PAN:</strong> {kycData.PANNumber || "Not provided"}</p>
                  <p><strong>Election ID:</strong> {kycData.ElectionId || "Not provided"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ================= KYC SUBMISSION FORM ================= */}
      {showKycForm && user?.role === "voter" && !kycData?.AadhaarNumber && (
        <Card className="border-2 border-blue-300">
          <CardHeader>
            <CardTitle className="text-blue-700">
              {otpSent ? "📱 Verify OTP" : "📄 Submit Identity Documents"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!otpSent ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Important:</strong> OTP will be sent to verify this submission
                  </p>
                </div>

                <div>
                  <Label htmlFor="aadhaar">Aadhaar Number *</Label>
                  <Input
                    id="aadhaar"
                    placeholder="1234 5678 9012"
                    maxLength={14}
                    value={kycForm.aadhaarNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
                      setKycForm({ ...kycForm, aadhaarNumber: formatted });
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="pan">PAN Number (Optional)</Label>
                  <Input
                    id="pan"
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    value={kycForm.panNumber}
                    onChange={(e) =>
                      setKycForm({ ...kycForm, panNumber: e.target.value.toUpperCase() })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="electionId">Voter ID (Optional)</Label>
                  <Input
                    id="electionId"
                    placeholder="ABC1234567"
                    value={kycForm.electionId}
                    onChange={(e) =>
                      setKycForm({ ...kycForm, electionId: e.target.value.toUpperCase() })
                    }
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={handleSendOtpForKyc}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Phone className="mr-2 h-4 w-4" />
                        Send OTP
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowKycForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <Phone className="w-4 h-4 inline mr-1" />
                    OTP sent to your mobile
                  </p>
                </div>

                <div>
                  <Label htmlFor="kyc-otp">Enter 6-Digit OTP</Label>
                  <Input
                    id="kyc-otp"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmitKyc}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Verify & Submit
                    </>
                  )}
                </Button>

                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-600">
                      Resend in <strong>{countdown}s</strong>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                  className="w-full text-sm text-gray-600 hover:underline"
                >
                  ← Back
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* INFO */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3 text-blue-900">
            {user?.role === "admin" ? "📅 Admin Settings" : "📌 Why KYC is Required?"}
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {user?.role === "admin" ? (
              <>
                <li>✅ Set voting start and end dates</li>
                <li>✅ Set results publish date (optional announcement)</li>
                <li>✅ Dates display on homepage countdown</li>
                <li>✅ Results can be published manually in Admin Panel</li>
              </>
            ) : (
              <>
                <li>✅ Prevents duplicate voting and fraud</li>
                <li>✅ Ensures only eligible students vote</li>
                <li>✅ Maintains election integrity</li>
                <li>✅ OTP verification proves ownership</li>
              </>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;