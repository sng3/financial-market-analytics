import React, { useMemo, useState } from "react";
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

const timeZoneOptions: TimeZoneOption[] = [
  { value: "America/Los_Angeles", label: "UTC -7  PDT  Pacific Daylight Time" },
  { value: "America/Denver", label: "UTC -6  MDT  Mountain Daylight Time" },
  { value: "America/Chicago", label: "UTC -5  CDT  Central Daylight Time" },
  { value: "America/New_York", label: "UTC -4  EDT  Eastern Daylight Time" },
  { value: "America/Halifax", label: "UTC -3  ADT  Atlantic Daylight Time" },
  { value: "Europe/London", label: "UTC +0  GMT  Greenwich Mean Time" },
  { value: "Europe/Paris", label: "UTC +1  CET  Central European Time" },
  { value: "Europe/Athens", label: "UTC +2  EET  Eastern European Time" },
  { value: "Asia/Dubai", label: "UTC +4  GST  Gulf Standard Time" },
  { value: "Asia/Kolkata", label: "UTC +5:30  IST  India Standard Time" },
  { value: "Asia/Shanghai", label: "UTC +8  CST  China Standard Time" },
  { value: "Asia/Singapore", label: "UTC +8  SGT  Singapore Time" },
  { value: "Asia/Kuala_Lumpur", label: "UTC +8  MYT  Malaysia Time" },
  { value: "Asia/Tokyo", label: "UTC +9  JST  Japan Standard Time" },
  { value: "Asia/Seoul", label: "UTC +9  KST  Korea Standard Time" },
  { value: "Australia/Sydney", label: "UTC +10  AEST  Australian Eastern Standard Time" },
  { value: "Pacific/Auckland", label: "UTC +12  NZST  New Zealand Standard Time" },
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
  const [timeZoneQuery, setTimeZoneQuery] = useState("UTC -4  EDT  Eastern Daylight Time");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [newsAlerts, setNewsAlerts] = useState(true);
  const [earningsAlerts, setEarningsAlerts] = useState(false);
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
          earningsAlerts,
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
              <div style={{ display: "grid", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                  />
                  Email alerts
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={priceAlerts}
                    onChange={(e) => setPriceAlerts(e.target.checked)}
                  />
                  Price alerts
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={newsAlerts}
                    onChange={(e) => setNewsAlerts(e.target.checked)}
                  />
                  News alerts
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={earningsAlerts}
                    onChange={(e) => setEarningsAlerts(e.target.checked)}
                  />
                  Earnings alerts
                </label>
              </div>
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