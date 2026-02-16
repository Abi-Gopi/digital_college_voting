// src/pages/Register.tsx - WITH OTP VERIFICATION

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Phone, Mail } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL;

  // Step 1: Basic Info
  const [step, setStep] = useState(1); // 1 = Basic Info, 2 = OTP Verification
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    phoneNumber: "",
    gender: "male",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");

  /* ================= VALIDATION ================= */
  const validatePhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\s+/g, "").replace(/^\+91/, "");
    return /^[6-9]\d{9}$/.test(cleanPhone);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }

    if (!formData.studentId.trim()) {
      toast.error("Student ID is required");
      return false;
    }

    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    return true;
  };

  /* ================= SEND OTP ================= */
  const handleSendOtp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const res = await fetch(`${apiBase}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          email: formData.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send OTP");
        return;
      }

      toast.success("OTP sent to your mobile number!");
      setOtpSent(true);
      setStep(2);

      // Start countdown
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

      // Show OTP in development mode
      if (data.otp) {
        toast.info(`Development OTP: ${data.otp}`, { duration: 10000 });
      }

    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESEND OTP ================= */
  const handleResendOtp = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${apiBase}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to resend OTP");
        return;
      }

      toast.success("OTP resent successfully!");

      // Restart countdown
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

  /* ================= VERIFY OTP & REGISTER ================= */
  const handleVerifyAndRegister = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${apiBase}/auth/verify-otp-and-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          otp: otp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      toast.success("Registration successful! Please wait for KYC verification.");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-blue-700 flex items-center justify-center gap-2">
            <ShieldCheck className="w-6 h-6" />
            Student Registration
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* STEP 1: BASIC INFO */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  placeholder="STU12345"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@annaadarsh.edu"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="9876543210"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  10-digit Indian mobile number (OTP will be sent)
                </p>
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                >
                  <option value="male">Male 👨</option>
                  <option value="female">Female 👩</option>
                </select>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-blue-600 hover:underline"
                >
                  Login here
                </button>
              </p>
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <Phone className="w-4 h-4 inline mr-1" />
                  OTP sent to <strong>{formData.phoneNumber}</strong>
                </p>
              </div>

              <div>
                <Label htmlFor="otp">Enter 6-Digit OTP</Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleVerifyAndRegister}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Register"
                )}
              </Button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-600">
                    Resend OTP in <strong>{countdown}s</strong>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-sm text-blue-600 hover:underline"
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full text-sm text-gray-600 hover:underline"
              >
                ← Back to edit details
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;