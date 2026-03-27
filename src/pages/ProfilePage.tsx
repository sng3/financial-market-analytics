import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "../types/user";
import { fetchProfile, updateProfile, deleteProfile } from "../services/api";

const defaultUser: UserProfile = {
  id: 0,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  riskTolerance: "Moderate",
  experience: "Beginner",
  goal: "Learning",
  horizon: "1 - 5 Years",
  favoriteSectors: [],
  notifications: {
    emailAlerts: true,
    priceAlerts: true,
    newsAlerts: true,
    earningsAlerts: false,
  },
  country: "United States",
  timeZone: "America/New_York",
};

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

function getTimeZoneLabel(value: string): string {
  const matched = timeZoneOptions.find(
    (option: TimeZoneOption) => option.value === value
  );
  return matched ? matched.label : value;
}

export default function ProfilePage() {
  const nav = useNavigate();
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [saved, setSaved] = useState("");
  const [countryQuery, setCountryQuery] = useState(defaultUser.country);
  const [timeZoneQuery, setTimeZoneQuery] = useState(
    getTimeZoneLabel(defaultUser.timeZone)
  );

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      nav("/login");
      return;
    }

    const parsed: UserProfile = JSON.parse(raw);

    const loadProfile = async () => {
      try {
        const freshUser = await fetchProfile(parsed.id);
        setUser(freshUser);
        setCountryQuery(freshUser.country);
        setTimeZoneQuery(getTimeZoneLabel(freshUser.timeZone));
        localStorage.setItem("user", JSON.stringify(freshUser));
      } catch {
        nav("/login");
      }
    };

    loadProfile();
  }, [nav]);

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
    return timeZoneOptions.filter(
      (option: TimeZoneOption) =>
        option.label.toLowerCase().includes(q) ||
        option.value.toLowerCase().includes(q)
    );
  }, [timeZoneQuery]);

  const toggleSector = (sector: string) => {
    setUser((prev: UserProfile) => ({
      ...prev,
      favoriteSectors: prev.favoriteSectors.includes(sector)
        ? prev.favoriteSectors.filter((s: string) => s !== sector)
        : [...prev.favoriteSectors, sector],
    }));
  };

  const handleSave = async () => {
    try {
      const updated = await updateProfile(user.id, user);
      setUser(updated);
      setCountryQuery(updated.country);
      setTimeZoneQuery(getTimeZoneLabel(updated.timeZone));
      localStorage.setItem("user", JSON.stringify(updated));
      setSaved("Profile updated successfully.");
      setTimeout(() => setSaved(""), 2000);
    } catch {
      setSaved("Failed to save profile.");
      setTimeout(() => setSaved(""), 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    nav("/login");
    window.location.reload();
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account?\n\nThis will permanently remove your profile, watchlists, and alerts.\n\nThis cannot be undone."
    );

    if (!confirmed) return;

    try {
      await deleteProfile(user.id);
      localStorage.removeItem("user");
      alert("Your account has been deleted.");
      nav("/signup");
      window.location.reload();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete account.");
    }
  };

  return (
    <div className="container">
      <div className="pageTitle">Profile</div>

      <div className="grid2equal">
        <Card title="Account Information">
          <div style={{ display: "grid", gap: 12 }}>
            <div className="grid2equal">
              <input
                className="input"
                placeholder="First Name"
                value={user.firstName}
                onChange={(e) =>
                  setUser({ ...user, firstName: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="Last Name"
                value={user.lastName}
                onChange={(e) =>
                  setUser({ ...user, lastName: e.target.value })
                }
              />
            </div>

            <input
              className="input"
              placeholder="Email"
              value={user.email}
              readOnly
            />

            <input
              className="input"
              placeholder="Phone"
              value={user.phone}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
            />

            <input
              className="input"
              list="profile-country-options"
              placeholder="Country"
              value={countryQuery}
              onChange={(e) => {
                setCountryQuery(e.target.value);
                setUser({ ...user, country: e.target.value });
              }}
            />
            <datalist id="profile-country-options">
              {filteredCountries.map((option: string) => (
                <option key={option} value={option} />
              ))}
            </datalist>

            <input
              className="input"
              list="profile-timezone-options"
              placeholder="Time Zone"
              value={timeZoneQuery}
              onChange={(e) => {
                const inputValue = e.target.value;
                setTimeZoneQuery(inputValue);

                const matched = timeZoneOptions.find(
                  (option: TimeZoneOption) =>
                    option.label === inputValue || option.value === inputValue
                );

                if (matched) {
                  setUser({ ...user, timeZone: matched.value });
                } else {
                  setUser({ ...user, timeZone: inputValue });
                }
              }}
            />
            <datalist id="profile-timezone-options">
              {filteredTimeZones.map((option: TimeZoneOption) => (
                <option key={option.value} value={option.label} />
              ))}
            </datalist>
          </div>
        </Card>

        <Card title="Investor Preferences">
          <div style={{ display: "grid", gap: 12 }}>
            <select
              className="input"
              value={user.riskTolerance}
              onChange={(e) =>
                setUser({
                  ...user,
                  riskTolerance: e.target.value as UserProfile["riskTolerance"],
                })
              }
            >
              <option value="Conservative">Conservative</option>
              <option value="Moderate">Moderate</option>
              <option value="Aggressive">Aggressive</option>
            </select>

            <select
              className="input"
              value={user.experience}
              onChange={(e) =>
                setUser({
                  ...user,
                  experience: e.target.value as UserProfile["experience"],
                })
              }
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <select
              className="input"
              value={user.goal}
              onChange={(e) =>
                setUser({
                  ...user,
                  goal: e.target.value as UserProfile["goal"],
                })
              }
            >
              <option value="Long Term Growth">Long Term Growth</option>
              <option value="Income">Income</option>
              <option value="Short Term Trading">Short Term Trading</option>
              <option value="Learning">Learning</option>
            </select>

            <select
              className="input"
              value={user.horizon}
              onChange={(e) =>
                setUser({
                  ...user,
                  horizon: e.target.value as UserProfile["horizon"],
                })
              }
            >
              <option value="< 1 Year">&lt; 1 Year</option>
              <option value="1 - 5 Years">1 - 5 Years</option>
              <option value="5+ Years">5+ Years</option>
            </select>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="Favorite Sectors">
          <div className="rowWrap">
            {sectorOptions.map((sector: string) => {
              const selected = user.favoriteSectors.includes(sector);

              return (
                <button
                  key={sector}
                  type="button"
                  className="btn"
                  onClick={() => toggleSector(sector)}
                  style={{
                    background: selected
                      ? "rgba(74,144,226,0.16)"
                      : undefined,
                    borderColor: selected
                      ? "rgba(74,144,226,0.5)"
                      : undefined,
                  }}
                >
                  {sector}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="Notifications">
          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={user.notifications.emailAlerts}
                onChange={(e) =>
                  setUser({
                    ...user,
                    notifications: {
                      ...user.notifications,
                      emailAlerts: e.target.checked,
                    },
                  })
                }
              />
              Email alerts
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={user.notifications.priceAlerts}
                onChange={(e) =>
                  setUser({
                    ...user,
                    notifications: {
                      ...user.notifications,
                      priceAlerts: e.target.checked,
                    },
                  })
                }
              />
              Price alerts
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={user.notifications.newsAlerts}
                onChange={(e) =>
                  setUser({
                    ...user,
                    notifications: {
                      ...user.notifications,
                      newsAlerts: e.target.checked,
                    },
                  })
                }
              />
              News alerts
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={user.notifications.earningsAlerts}
                onChange={(e) =>
                  setUser({
                    ...user,
                    notifications: {
                      ...user.notifications,
                      earningsAlerts: e.target.checked,
                    },
                  })
                }
              />
              Earnings alerts
            </label>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="Actions">
          <div className="rowWrap">
            <button className="btn btnPrimary" onClick={handleSave}>
              Save Changes
            </button>

            <button className="btn" onClick={handleLogout}>
              Logout
            </button>

            <button className="btn btnDanger" onClick={handleDeleteAccount}>
              Delete Account
            </button>
          </div>

          {saved && (
            <div style={{ marginTop: 12, color: "var(--green)", fontSize: 14 }}>
              {saved}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}