import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import maleAvatar from "@/assets/male.png";
import femaleAvatar from "@/assets/female.png";

interface Candidate {
  Id: number;
  Name: string;
  Position: string;
  Manifesto?: string;
  PhotoUrl?: string;
  Gender?: string; // 'male' | 'female'
}

const positions = [
  "president",
  "vice_president",
  "secretary",
  "sports_secretary",
  "cultural_secretary",
  "treasurer",
];

const Candidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [userRole, setUserRole] = useState<string>("voter");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOtpBox, setShowOtpBox] = useState(false);

  const [newCandidate, setNewCandidate] = useState({
    Name: "",
    Position: positions[0],
    Manifesto: "",
    PhotoUrl: "",
    Gender: "male",
  });

  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      setUserRole(parsed.role || "voter");
    }

    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAvatarSrc = (c: Candidate) => {
    if (c.PhotoUrl && c.PhotoUrl.trim() !== "") return c.PhotoUrl;
    if (c.Gender && c.Gender.toLowerCase() === "female") return femaleAvatar;
    return maleAvatar;
  };

  const loadCandidates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to fetch candidates");
        return;
      }

      setCandidates(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch candidates");
    }
  };

  const handleOtpVerify = () => {
    if (otp === "123456") {
      setOtpVerified(true);
      setShowOtpBox(false);
      toast.success("OTP verified successfully!");
    } else {
      toast.error("Invalid OTP. Please try again.");
    }
  };

  const handleAdd = async () => {
    if (!newCandidate.Name.trim() || !newCandidate.Position.trim()) {
      toast.error("Name and Position are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/candidates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCandidate),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add candidate");
        return;
      }

      toast.success("Candidate added successfully!");

      setNewCandidate({
        Name: "",
        Position: positions[0],
        Manifesto: "",
        PhotoUrl: "",
        Gender: "male",
      });

      loadCandidates();
    } catch (err: any) {
      toast.error(err.message || "Failed to add candidate");
    }
  };

  const handleUpdate = async () => {
    if (!editCandidate) return;

    if (!editCandidate.Name.trim() || !editCandidate.Position.trim()) {
      toast.error("Name and Position are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/candidates/${editCandidate.Id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editCandidate),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update candidate");
        return;
      }

      toast.success("Candidate updated!");
      setEditCandidate(null);
      loadCandidates();
    } catch (err: any) {
      toast.error(err.message || "Failed to update candidate");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/candidates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete candidate");
        return;
      }

      toast.success("Candidate deleted!");
      loadCandidates();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete candidate");
    }
  };

  const grouped = useMemo(() => {
    return candidates.reduce((acc: Record<string, Candidate[]>, c) => {
      if (!acc[c.Position]) acc[c.Position] = [];
      acc[c.Position].push(c);
      return acc;
    }, {});
  }, [candidates]);

  return (
    <div className="space-y-6">
      {/* OTP SECTION */}
      {userRole === "admin" && !otpVerified && (
        <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-md text-center">
          <p className="mb-3 font-medium text-yellow-800">
            Admin verification required for candidate management.
          </p>
          {!showOtpBox ? (
            <Button onClick={() => setShowOtpBox(true)}>Verify with OTP</Button>
          ) : (
            <div className="flex justify-center gap-2">
              <Input
                placeholder="Enter OTP (try 123456)"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleOtpVerify}>Verify</Button>
            </div>
          )}
        </div>
      )}

      {/* ADD FORM */}
      {userRole === "admin" && otpVerified && (
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Name"
            value={newCandidate.Name}
            onChange={(e) =>
              setNewCandidate({ ...newCandidate, Name: e.target.value })
            }
          />

          {/* Position dropdown */}
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={newCandidate.Position}
            onChange={(e) =>
              setNewCandidate({ ...newCandidate, Position: e.target.value })
            }
          >
            {positions.map((p) => (
              <option key={p} value={p}>
                {p.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          {/* Gender dropdown */}
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={newCandidate.Gender}
            onChange={(e) =>
              setNewCandidate({ ...newCandidate, Gender: e.target.value })
            }
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <Input
            placeholder="Manifesto"
            value={newCandidate.Manifesto}
            onChange={(e) =>
              setNewCandidate({
                ...newCandidate,
                Manifesto: e.target.value,
              })
            }
          />

          <Input
            placeholder="Photo URL"
            value={newCandidate.PhotoUrl}
            onChange={(e) =>
              setNewCandidate({
                ...newCandidate,
                PhotoUrl: e.target.value,
              })
            }
          />

          <Button onClick={handleAdd}>
            <PlusCircle className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      )}

      {/* LIST BY POSITION */}
      {positions.map((position) => (
        <Card key={position} className="mb-6">
          <CardHeader>
            <CardTitle className="capitalize text-blue-700 font-bold text-lg">
              {position.replace(/_/g, " ")}
            </CardTitle>
          </CardHeader>

          <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {grouped[position]?.length ? (
              grouped[position].map((c) => (
                <div
                  key={`${c.Position}-${c.Id}`}   // ✅ unique key (fixed)
                  className="flex flex-col items-center border rounded-xl p-4 bg-white hover:shadow-md transition"
                >
                  <img
                    src={getAvatarSrc(c)}
                    alt={c.Name}
                    className="w-20 h-20 rounded-full border mb-2 object-cover"
                  />
                  <h3 className="font-semibold">{c.Name}</h3>
                  <p className="text-xs text-center text-gray-600">
                    {c.Manifesto}
                  </p>

                  {userRole === "admin" && otpVerified && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditCandidate(c)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(c.Id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No candidates yet.</p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* EDIT MODAL */}
      {editCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 bg-white">
            <CardHeader>
              <CardTitle>Edit Candidate</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <Input
                value={editCandidate.Name}
                onChange={(e) =>
                  setEditCandidate({
                    ...editCandidate,
                    Name: e.target.value,
                  })
                }
              />

              <select
                className="border rounded-md px-3 py-2 w-full"
                value={editCandidate.Position}
                onChange={(e) =>
                  setEditCandidate({
                    ...editCandidate,
                    Position: e.target.value,
                  })
                }
              >
                {positions.map((p) => (
                  <option key={p} value={p}>
                    {p.replace(/_/g, " ")}
                  </option>
                ))}
              </select>

              <select
                className="border rounded-md px-3 py-2 w-full"
                value={editCandidate.Gender || "male"}
                onChange={(e) =>
                  setEditCandidate({
                    ...editCandidate,
                    Gender: e.target.value,
                  })
                }
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              <Input
                value={editCandidate.Manifesto || ""}
                onChange={(e) =>
                  setEditCandidate({
                    ...editCandidate,
                    Manifesto: e.target.value,
                  })
                }
              />

              <Input
                value={editCandidate.PhotoUrl || ""}
                onChange={(e) =>
                  setEditCandidate({
                    ...editCandidate,
                    PhotoUrl: e.target.value,
                  })
                }
              />

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setEditCandidate(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Candidates;