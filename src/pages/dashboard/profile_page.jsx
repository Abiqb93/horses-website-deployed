import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from "@/context/UserContext";
import { Card, Typography } from "@material-tailwind/react";

/**
 * E.164 validator: +[countrycode][number], max 15 digits total, no spaces.
 * Examples: +447900123456, +353871234567, +1XXXXXXXXXX
 */
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

/**
 * Default country calling code used when users type local numbers like 07... or 0....
 * Change via Vite env var: VITE_DEFAULT_COUNTRY_CODE="+44"
 */
const DEFAULT_COUNTRY_CODE =
  import.meta.env.VITE_DEFAULT_COUNTRY_CODE?.trim() || "+44";

/**
 * Try to normalize a user-entered number to E.164.
 * - Strips spaces, dashes, parentheses.
 * - If starts with +, keep digits only and reattach +.
 * - If starts with 00, convert to +.
 * - If starts with 0 (local/national), prefix DEFAULT_COUNTRY_CODE then drop leading 0.
 * - Else, if all digits and DEFAULT_COUNTRY_CODE is set, prefix it.
 */
function normalizeToE164(input) {
  if (!input) return "";
  const raw = String(input).trim();

  // Remove spaces, dashes, parentheses, dots
  const cleaned = raw.replace(/[()\s.-]/g, "");

  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    return `+${digits}`;
  }

  if (cleaned.startsWith("00")) {
    const digits = cleaned.slice(2).replace(/\D/g, "");
    return `+${digits}`;
  }

  if (cleaned.startsWith("0")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    return `${DEFAULT_COUNTRY_CODE}${digits}`;
  }

  // If it's digits only without prefix, assume local and add default country code
  if (/^\d+$/.test(cleaned)) {
    return `${DEFAULT_COUNTRY_CODE}${cleaned}`;
  }

  // Fallback: strip everything non-digit and add +
  const digits = cleaned.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export function ProfilePage() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const initialMobile = useMemo(() => {
    // If your user object already carries a mobile field, show it; else blank
    return (user?.mobile_number || user?.mobileNumber || "").trim();
  }, [user]);

  const [mobileInput, setMobileInput] = useState(initialMobile);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  const normalized = useMemo(() => normalizeToE164(mobileInput), [mobileInput]);
  const isValid = useMemo(() => (normalized ? E164_REGEX.test(normalized) : false), [normalized]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/auth/sign-in");
  };

  const handleChangePassword = () => {
    navigate("/dashboard/change-password");
  };

  async function handleSaveMobile() {
    setStatus({ type: "", msg: "" });

    // We accept only valid E.164; guide the user otherwise
    if (!isValid) {
      setStatus({
        type: "error",
        msg:
          "Please enter a valid mobile number in international format (E.164), e.g. +447900123456.",
      });
      return;
    }

    try {
      setSaving(true);

      // Backend at localhost:8080 (POST /api/update-mobile)
      const res = await fetch("https://horseracesbackend-production.up.railway.app/api/update-mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // If you rely on cookies/session: credentials: "include",
        body: JSON.stringify({
          user_id: user?.userId ?? user?.user_id,
          mobile_number: normalized,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }

      // Update UserContext + localStorage so UI reflects immediately
      const updatedUser = {
        ...user,
        mobile_number: normalized,
        mobileNumber: normalized,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setStatus({ type: "success", msg: "Mobile number updated successfully." });
    } catch (err) {
      setStatus({
        type: "error",
        msg: `Failed to update mobile number. ${err?.message || ""}`,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="text-center mb-8">
        <Typography variant="h3" className="font-bold text-gray-800 text-2xl">
          Blandford Bloodstock
        </Typography>
      </div>

      <Card className="p-6 shadow-lg rounded-lg w-full max-w-md bg-white">
        <Typography variant="h4" className="font-bold text-center mb-4 text-lg">
          User Profile
        </Typography>

        {user ? (
          <div className="space-y-4 text-blue-gray-700 text-sm">
            <div>
              <span className="font-medium">Name:</span> {user.name}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user.email}
            </div>
            <div>
              <span className="font-medium">User ID:</span>{" "}
              {user.userId || user.user_id}
            </div>

            {/* Mobile number editor */}
            <div className="pt-2">
              <label className="block font-medium mb-1" htmlFor="mobile">
                Mobile Number (for WhatsApp)
              </label>
              <input
                id="mobile"
                type="tel"
                inputMode="tel"
                className={`w-full rounded border px-3 py-2 outline-none transition
                  ${mobileInput && !isValid ? "border-red-500" : "border-gray-300 focus:border-gray-700"}
                `}
                placeholder="+447900123456"
                value={mobileInput}
                onChange={(e) => setMobileInput(e.target.value)}
                disabled={saving}
              />

              {/* Helper / normalized preview */}
              <div className="mt-1 text-xs">
                <div className="text-gray-600">
                  We’ll store numbers in <strong>E.164</strong> format (e.g., <code>+447900123456</code>).
                </div>
                {mobileInput ? (
                  <div className={`mt-1 ${isValid ? "text-green-700" : "text-red-600"}`}>
                    Normalized: <code>{normalized || "—"}</code>{" "}
                    {isValid ? "(valid)" : "(invalid)"}
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleSaveMobile}
                  disabled={saving}
                  className={`w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition disabled:opacity-60`}
                >
                  {saving ? "Saving..." : "Save Mobile"}
                </button>
              </div>

              {/* Status messages */}
              {status.msg ? (
                <div
                  className={`mt-2 text-xs ${
                    status.type === "success" ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {status.msg}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={handleChangePassword}
                className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
              >
                Change Password
              </button>

              <button
                onClick={handleLogout}
                className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <Typography variant="small" className="text-red-600 font-medium text-center">
            You are not logged in.
          </Typography>
        )}
      </Card>
    </section>
  );
}

export default ProfilePage;
