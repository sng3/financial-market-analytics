import { useMemo, useState } from "react";
import Card from "../components/Card";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "../types/user";
import { updateProfile } from "../services/api";

const sectorOptions: string[] = [
  "Technology",
  "Healthcare",
  "Energy",
  "Finance",
  "Consumer",
  "Industrial",
  "Real Estate",
];

const countryOptions: string[] = [
  "United States",
  "Canada",
  "Mexico",
  "United Kingdom",
  "Ireland",
  "France",
  "Germany",
  "Italy",
  "Spain",
  "Netherlands",
  "Switzerland",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Belgium",
  "Portugal",
  "Austria",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Greece",
  "Turkey",
  "Romania",
  "India",
  "China",
  "Japan",
  "South Korea",
  "Singapore",
  "Malaysia",
  "Thailand",
  "Indonesia",
  "Philippines",
  "Vietnam",
  "Taiwan",
  "Hong Kong",
  "Australia",
  "New Zealand",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "South Africa",
  "Egypt",
  "Nigeria",
  "Brazil",
  "Argentina",
  "Chile",
  "Colombia",
  "Peru",
];

type TimeZoneOption = {
  value: string;
  label: string;
};

export const timeZoneOptions: TimeZoneOption[] = [
  { value: "America/New_York", label: "GMT-4  New York (US Eastern)" },
  { value: "America/Chicago", label: "GMT-5  Chicago (US Central)" },
  { value: "America/Denver", label: "GMT-6  Denver (US Mountain)" },
  { value: "America/Los_Angeles", label: "GMT-7  Los Angeles (US Pacific)" },
  { value: "America/Sao_Paulo", label: "GMT-3  São Paulo (Brazil)" },
  { value: "Europe/London", label: "GMT+0  London (UK)" },
  { value: "Europe/Paris", label: "GMT+1  Paris (Europe Central)" },
  { value: "Europe/Zurich", label: "GMT+1  Zurich (Switzerland)" },
  { value: "Europe/Frankfurt", label: "GMT+1  Frankfurt (Germany)" },
  { value: "Europe/Athens", label: "GMT+2  Athens (Eastern Europe)" },
  { value: "Africa/Johannesburg", label: "GMT+2  Johannesburg (South Africa)" },
  { value: "Asia/Dubai", label: "GMT+4  Dubai (UAE)" },
  { value: "Asia/Kolkata", label: "GMT+5:30  Mumbai (India)" },
  { value: "Asia/Singapore", label: "GMT+8  Singapore" },
  { value: "Asia/Hong_Kong", label: "GMT+8  Hong Kong" },
  { value: "Asia/Shanghai", label: "GMT+8  Shanghai (China)" },
  { value: "Asia/Kuala_Lumpur", label: "GMT+8  Kuala Lumpur (Malaysia)" },
  { value: "Asia/Tokyo", label: "GMT+9  Tokyo (Japan)" },
  { value: "Asia/Seoul", label: "GMT+9  Seoul (South Korea)" },
  { value: "Australia/Sydney", label: "GMT+10  Sydney (Australia)" },
  { value: "Pacific/Auckland", label: "GMT+12  Auckland (New Zealand)" },
];

export default function OnboardingPage() {
  const nav = useNavigate();

  const savedUser = localStorage.getItem("user");
  const existingUser: UserProfile | null = savedUser ? JSON.parse(savedUser) : null;

  const [riskTolerance, setRiskTolerance] =
    useState<UserProfile["riskTolerance"]>("Moderate");
  const [experience, setExperience] =
    useState<UserProfile["experience"]>("Beginner");
  const [goal, setGoal] =
    useState<UserProfile["goal"]>("Learning");
  const [horizon, setHorizon] =
    useState<UserProfile["horizon"]>("1 - 5 Years");
  const [favoriteSectors, setFavoriteSectors] = useState<string[]>([]);
  const [country, setCountry] = useState("United States");
  const [timeZone, setTimeZone] = useState("America/New_York");
  const [countryQuery, setCountryQuery] = useState("United States");
  const [timeZoneQuery, setTimeZoneQuery] = useState("GMT-4  New York (US Eastern)");

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [newsAlerts, setNewsAlerts] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);

  const [notificationError, setNotificationError] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return countryOptions;
    return countryOptions.filter((option: string) =>
      option.toLowerCase().includes(q)
    );
  }, [countryQuery]);

  const filteredTimeZones = useMemo(() => {
    const q = timeZoneQuery.trim().toLowerCase();
    if (!q) return timeZoneOptions;
    return timeZoneOptions.filter((option: TimeZoneOption) =>
      option.label.toLowerCase().includes(q) ||
      option.value.toLowerCase().includes(q)
    );
  }, [timeZoneQuery]);

  const hasSelectedAlertType = priceAlerts || newsAlerts;
  const hasSelectedDeliveryMethod =
    emailAlerts || smsNotifications || pushNotifications;

  const toggleSector = (sector: string) => {
    setFavoriteSectors((prev: string[]) =>
      prev.includes(sector)
        ? prev.filter((s: string) => s !== sector)
        : [...prev, sector]
    );
  };

  const handleFinish = async () => {
    if (!existingUser) {
      nav("/login");
      return;
    }

    setNotificationError("");

    if (hasSelectedAlertType && !hasSelectedDeliveryMethod) {
      setNotificationError(
        "Please select at least one delivery method when any alert type is enabled."
      );
      return;
    }

    if (hasSelectedDeliveryMethod && !hasSelectedAlertType) {
      setNotificationError(
        "Please select at least one alert type when any delivery method is enabled."
      );
      return;
    }

    try {
      setLoading(true);

      const updatedUser = await updateProfile(existingUser.id, {
        ...existingUser,
        riskTolerance,
        experience,
        goal,
        horizon,
        favoriteSectors,
        notifications: {
          emailAlerts,
          priceAlerts,
          newsAlerts,
          smsNotifications,
          pushNotifications,
        },
        country,
        timeZone,
      });

      localStorage.setItem("user", JSON.stringify(updatedUser));
      nav("/dashboard");
    } catch {
      alert("Failed to save onboarding profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container"
      style={{ display: "grid", placeItems: "center", paddingTop: 28, paddingBottom: 28 }}
    >
      <div style={{ width: "min(820px, 100%)" }}>
        <Card title="Set Up Your Investor Profile">
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>
              Help us personalize your dashboard, risk insights, and alerts.
            </div>

            <div className="grid2equal">
              <div>
                <div style={{ color: "var(--muted2)", fontSize: 13, marginBottom: 6 }}>
                  Risk Tolerance
                </div>
                <select
                  className="input"
                  value={riskTolerance}
                  onChange={(e) =>
                    setRiskTolerance(e.target.value as UserProfile["riskTolerance"])
                  }
                >
                  <option value="Conservative">Conservative</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Aggressive">Aggressive</option>
                </select>
              </div>

              <div>
                <div style={{ color: "var(--muted2)", fontSize: 13, marginBottom: 6 }}>
                  Investment Experience
                </div>
                <select
                  className="input"
                  value={experience}
                  onChange={(e) =>
                    setExperience(e.target.value as UserProfile["experience"])
                  }
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid2equal">
              <div>
                <div style={{ color: "var(--muted2)", fontSize: 13, marginBottom: 6 }}>
                  Investment Goal
                </div>
                <select
                  className="input"
                  value={goal}
                  onChange={(e) =>
                    setGoal(e.target.value as UserProfile["goal"])
                  }
                >
                  <option value="Long Term Growth">Long Term Growth</option>
                  <option value="Income">Income</option>
                  <option value="Short Term Trading">Short Term Trading</option>
                  <option value="Learning">Learning</option>
                </select>
              </div>

              <div>
                <div style={{ color: "var(--muted2)", fontSize: 13, marginBottom: 6 }}>
                  Investment Horizon
                </div>
                <select
                  className="input"
                  value={horizon}
                  onChange={(e) =>
                    setHorizon(e.target.value as UserProfile["horizon"])
                  }
                >
                  <option value="< 1 Year">&lt; 1 Year</option>
                  <option value="1 - 5 Years">1 - 5 Years</option>
                  <option value="5+ Years">5+ Years</option>
                </select>
              </div>
            </div>

            <div>
              <div style={{ color: "var(--muted2)", fontSize: 13, marginBottom: 8 }}>
                Favorite Sectors
              </div>
              <div className="rowWrap">
                {sectorOptions.map((sector: string) => {
                  const selected = favoriteSectors.includes(sector);

                  return (
                    <button
                      key={sector}
                      type="button"
                      className="btn"
                      onClick={() => toggleSector(sector)}
                      style={{
                        background: selected ? "rgba(74,144,226,0.16)" : undefined,
                        borderColor: selected ? "rgba(74,144,226,0.5)" : undefined,
                      }}
                    >
                      {sector}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid2equal">
              <div>
                <div style={{ color: "var(--muted2)", fontSize: 13, marginBottom: 6 }}>
                  Country
                </div>
                <input
                  className="input"
                  list="country-options"
                  value={countryQuery}
                  onChange={(e) => {
                    setCountryQuery(e.target.value);
                    setCountry(e.target.value);
                  }}
                  placeholder="Select or type a country"
                />
                <datalist id="country-options">
                  {filteredCountries.map((option: string) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>

              <div>
                <div style={{ color: "var(--muted2)", fontSize: 13, marginBottom: 6 }}>
                  Time Zone
                </div>
                <input
                  className="input"
                  list="timezone-options"
                  value={timeZoneQuery}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setTimeZoneQuery(inputValue);

                    const matched = timeZoneOptions.find(
                      (option: TimeZoneOption) =>
                        option.label === inputValue || option.value === inputValue
                    );

                    if (matched) {
                      setTimeZone(matched.value);
                    } else {
                      setTimeZone(inputValue);
                    }
                  }}
                  placeholder="Select or type a time zone"
                />
                <datalist id="timezone-options">
                  {filteredTimeZones.map((option: TimeZoneOption) => (
                    <option key={option.value} value={option.label} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <div style={{ color: "var(--muted2)", fontSize: 13, marginBottom: 8 }}>
                Notification Preferences
              </div>

              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.9)",
                      marginBottom: 8,
                    }}
                  >
                    Alert Types
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={priceAlerts}
                        onChange={(e) => {
                          setNotificationError("");
                          setPriceAlerts(e.target.checked);
                        }}
                      />
                      Price alerts
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={newsAlerts}
                        onChange={(e) => {
                          setNotificationError("");
                          setNewsAlerts(e.target.checked);
                        }}
                      />
                      News alerts
                    </label>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.9)",
                      marginBottom: 8,
                    }}
                  >
                    Delivery
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={emailAlerts}
                        onChange={(e) => {
                          setNotificationError("");
                          setEmailAlerts(e.target.checked);
                        }}
                      />
                      Email notifications
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={smsNotifications}
                        onChange={(e) => {
                          setNotificationError("");
                          setSmsNotifications(e.target.checked);
                        }}
                      />
                      SMS notifications
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={pushNotifications}
                        onChange={(e) => {
                          setNotificationError("");
                          setPushNotifications(e.target.checked);
                        }}
                      />
                      Push notifications
                    </label>
                  </div>
                </div>
              </div>

              {notificationError && (
                <div
                  style={{
                    marginTop: 12,
                    color: "#ff9b9b",
                    background: "rgba(231,76,60,0.10)",
                    border: "1px solid rgba(231,76,60,0.35)",
                    borderRadius: 12,
                    padding: "10px 12px",
                    fontSize: 14,
                  }}
                >
                  {notificationError}
                </div>
              )}
            </div>

            <button
              className="btn btnPrimary"
              onClick={handleFinish}
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? "Saving..." : "Finish Setup"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}