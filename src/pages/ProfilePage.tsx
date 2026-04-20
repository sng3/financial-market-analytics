// import { useEffect, useMemo, useState } from "react";
// import Card from "../components/Card";
// import InfoDialog from "../components/InfoDialog";
// import { useNavigate } from "react-router-dom";
// import type { UserProfile } from "../types/user";
// import { fetchProfile, updateProfile, deleteProfile } from "../services/api";

// const defaultUser: UserProfile = {
//   id: 0,
//   firstName: "",
//   lastName: "",
//   email: "",
//   phone: "",
//   riskTolerance: "Moderate",
//   experience: "Beginner",
//   goal: "Learning",
//   horizon: "1 - 5 Years",
//   favoriteSectors: [],
//   notifications: {
//     emailAlerts: true,
//     priceAlerts: true,
//     newsAlerts: true,
//     smsNotifications: false,
//     pushNotifications: false,
//   },
//   country: "United States",
//   timeZone: "America/New_York",
// };

// const sectorOptions: string[] = [
//   "Technology",
//   "Healthcare",
//   "Energy",
//   "Finance",
//   "Consumer",
//   "Industrial",
//   "Real Estate",
// ];

// const countryOptions: string[] = [
//   "United States",
//   "Canada",
//   "Mexico",
//   "United Kingdom",
//   "Ireland",
//   "France",
//   "Germany",
//   "Italy",
//   "Spain",
//   "Netherlands",
//   "Switzerland",
//   "Sweden",
//   "Norway",
//   "Denmark",
//   "Finland",
//   "Belgium",
//   "Portugal",
//   "Austria",
//   "Poland",
//   "Czech Republic",
//   "Hungary",
//   "Greece",
//   "Turkey",
//   "Romania",
//   "India",
//   "China",
//   "Japan",
//   "South Korea",
//   "Singapore",
//   "Malaysia",
//   "Thailand",
//   "Indonesia",
//   "Philippines",
//   "Vietnam",
//   "Taiwan",
//   "Hong Kong",
//   "Australia",
//   "New Zealand",
//   "United Arab Emirates",
//   "Saudi Arabia",
//   "Qatar",
//   "South Africa",
//   "Egypt",
//   "Nigeria",
//   "Brazil",
//   "Argentina",
//   "Chile",
//   "Colombia",
//   "Peru",
// ];

// type TimeZoneOption = {
//   value: string;
//   label: string;
// };

// export const timeZoneOptions: TimeZoneOption[] = [
//   { value: "America/New_York", label: "GMT-4  New York (US Eastern)" },
//   { value: "America/Chicago", label: "GMT-5  Chicago (US Central)" },
//   { value: "America/Denver", label: "GMT-6  Denver (US Mountain)" },
//   { value: "America/Los_Angeles", label: "GMT-7  Los Angeles (US Pacific)" },
//   { value: "America/Sao_Paulo", label: "GMT-3  São Paulo (Brazil)" },
//   { value: "Europe/London", label: "GMT+0  London (UK)" },
//   { value: "Europe/Paris", label: "GMT+1  Paris (Europe Central)" },
//   { value: "Europe/Zurich", label: "GMT+1  Zurich (Switzerland)" },
//   { value: "Europe/Frankfurt", label: "GMT+1  Frankfurt (Germany)" },
//   { value: "Europe/Athens", label: "GMT+2  Athens (Eastern Europe)" },
//   { value: "Africa/Johannesburg", label: "GMT+2  Johannesburg (South Africa)" },
//   { value: "Asia/Dubai", label: "GMT+4  Dubai (UAE)" },
//   { value: "Asia/Kolkata", label: "GMT+5:30  Mumbai (India)" },
//   { value: "Asia/Singapore", label: "GMT+8  Singapore" },
//   { value: "Asia/Hong_Kong", label: "GMT+8  Hong Kong" },
//   { value: "Asia/Shanghai", label: "GMT+8  Shanghai (China)" },
//   { value: "Asia/Kuala_Lumpur", label: "GMT+8  Kuala Lumpur (Malaysia)" },
//   { value: "Asia/Tokyo", label: "GMT+9  Tokyo (Japan)" },
//   { value: "Asia/Seoul", label: "GMT+9  Seoul (South Korea)" },
//   { value: "Australia/Sydney", label: "GMT+10  Sydney (Australia)" },
//   { value: "Pacific/Auckland", label: "GMT+12  Auckland (New Zealand)" },
// ];

// function getTimeZoneLabel(value: string): string {
//   const matched = timeZoneOptions.find(
//     (option: TimeZoneOption) => option.value === value
//   );
//   return matched ? matched.label : value;
// }

// export default function ProfilePage() {
//   const nav = useNavigate();

//   const [user, setUser] = useState<UserProfile>(defaultUser);
//   const [saved, setSaved] = useState("");
//   const [notificationError, setNotificationError] = useState("");
//   const [countryQuery, setCountryQuery] = useState(defaultUser.country);
//   const [timeZoneQuery, setTimeZoneQuery] = useState(
//     getTimeZoneLabel(defaultUser.timeZone)
//   );
//   const [showNotifInfo, setShowNotifInfo] = useState(false);

//   useEffect(() => {
//     const raw = localStorage.getItem("user");

//     if (!raw) {
//       nav("/login");
//       return;
//     }

//     const parsed: UserProfile = JSON.parse(raw);

//     const loadProfile = async () => {
//       try {
//         const freshUser = await fetchProfile(parsed.id);
//         setUser(freshUser);
//         setCountryQuery(freshUser.country);
//         setTimeZoneQuery(getTimeZoneLabel(freshUser.timeZone));
//         localStorage.setItem("user", JSON.stringify(freshUser));
//       } catch {
//         nav("/login");
//       }
//     };

//     loadProfile();
//   }, [nav]);

//   const filteredCountries = useMemo(() => {
//     const q = countryQuery.trim().toLowerCase();

//     if (!q) return countryOptions;

//     return countryOptions.filter((option: string) =>
//       option.toLowerCase().includes(q)
//     );
//   }, [countryQuery]);

//   const filteredTimeZones = useMemo(() => {
//     const q = timeZoneQuery.trim().toLowerCase();

//     if (!q) return timeZoneOptions;

//     return timeZoneOptions.filter(
//       (option: TimeZoneOption) =>
//         option.label.toLowerCase().includes(q) ||
//         option.value.toLowerCase().includes(q)
//     );
//   }, [timeZoneQuery]);

//   const hasSelectedAlertType =
//     user.notifications.priceAlerts || user.notifications.newsAlerts;

//   const hasSelectedDeliveryMethod =
//     user.notifications.emailAlerts ||
//     user.notifications.smsNotifications ||
//     user.notifications.pushNotifications;

//   const toggleSector = (sector: string) => {
//     setUser((prev: UserProfile) => ({
//       ...prev,
//       favoriteSectors: prev.favoriteSectors.includes(sector)
//         ? prev.favoriteSectors.filter((s: string) => s !== sector)
//         : [...prev.favoriteSectors, sector],
//     }));
//   };

//   const handleSave = async () => {
//     setSaved("");
//     setNotificationError("");

//     if (hasSelectedAlertType && !hasSelectedDeliveryMethod) {
//       setNotificationError(
//         "Please select at least one delivery method when any alert type is enabled."
//       );
//       return;
//     }

//     if (hasSelectedDeliveryMethod && !hasSelectedAlertType) {
//       setNotificationError(
//         "Please select at least one alert type when any delivery method is enabled."
//       );
//       return;
//     }

//     try {
//       const updated = await updateProfile(user.id, user);
//       setUser(updated);
//       setCountryQuery(updated.country);
//       setTimeZoneQuery(getTimeZoneLabel(updated.timeZone));
//       localStorage.setItem("user", JSON.stringify(updated));
//       localStorage.setItem("profileUpdatedAt", Date.now().toString());
//       setSaved("Profile updated successfully.");
//       setTimeout(() => setSaved(""), 2000);
//     } catch {
//       setSaved("Failed to save profile.");
//       setTimeout(() => setSaved(""), 2000);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("user");
//     nav("/login");
//     window.location.reload();
//   };

//   const handleDeleteAccount = async () => {
//     const confirmed = window.confirm(
//       "Are you sure you want to delete your account?\n\nThis will permanently remove your profile, watchlists, and alerts.\n\nThis cannot be undone."
//     );

//     if (!confirmed) return;

//     try {
//       await deleteProfile(user.id);
//       localStorage.removeItem("user");
//       localStorage.removeItem("profileUpdatedAt");
//       alert("Your account has been deleted.");
//       nav("/signup");
//       window.location.reload();
//     } catch (error) {
//       console.error("Delete failed:", error);
//       alert("Failed to delete account.");
//     }
//   };

//   return (
//     <div className="container">
//       <div className="pageTitle">Profile</div>

//       <div className="grid2equal">
//         <Card title="Account Information">
//           <div style={{ display: "grid", gap: 12 }}>
//             <div className="grid2equal">
//               <input
//                 className="input"
//                 placeholder="First Name"
//                 value={user.firstName}
//                 onChange={(e) =>
//                   setUser({ ...user, firstName: e.target.value })
//                 }
//               />
//               <input
//                 className="input"
//                 placeholder="Last Name"
//                 value={user.lastName}
//                 onChange={(e) =>
//                   setUser({ ...user, lastName: e.target.value })
//                 }
//               />
//             </div>

//             <input
//               className="input"
//               placeholder="Email"
//               value={user.email}
//               readOnly
//             />

//             <input
//               className="input"
//               placeholder="Phone"
//               value={user.phone}
//               onChange={(e) => setUser({ ...user, phone: e.target.value })}
//             />

//             <input
//               className="input"
//               list="profile-country-options"
//               placeholder="Country"
//               value={countryQuery}
//               onChange={(e) => {
//                 setCountryQuery(e.target.value);
//                 setUser({ ...user, country: e.target.value });
//               }}
//             />
//             <datalist id="profile-country-options">
//               {filteredCountries.map((option: string) => (
//                 <option key={option} value={option} />
//               ))}
//             </datalist>

//             <input
//               className="input"
//               list="profile-timezone-options"
//               placeholder="Time Zone"
//               value={timeZoneQuery}
//               onChange={(e) => {
//                 const inputValue = e.target.value;
//                 setTimeZoneQuery(inputValue);

//                 const matched = timeZoneOptions.find(
//                   (option: TimeZoneOption) =>
//                     option.label === inputValue || option.value === inputValue
//                 );

//                 if (matched) {
//                   setUser({ ...user, timeZone: matched.value });
//                 } else {
//                   setUser({ ...user, timeZone: inputValue });
//                 }
//               }}
//             />
//             <datalist id="profile-timezone-options">
//               {filteredTimeZones.map((option: TimeZoneOption) => (
//                 <option key={option.value} value={option.label} />
//               ))}
//             </datalist>
//           </div>
//         </Card>

//         <Card title="Investor Preferences">
//           <div style={{ display: "grid", gap: 12 }}>
//             <select
//               className="input"
//               value={user.riskTolerance}
//               onChange={(e) =>
//                 setUser({
//                   ...user,
//                   riskTolerance: e.target.value as UserProfile["riskTolerance"],
//                 })
//               }
//             >
//               <option value="Conservative">Conservative</option>
//               <option value="Moderate">Moderate</option>
//               <option value="Aggressive">Aggressive</option>
//             </select>

//             <select
//               className="input"
//               value={user.experience}
//               onChange={(e) =>
//                 setUser({
//                   ...user,
//                   experience: e.target.value as UserProfile["experience"],
//                 })
//               }
//             >
//               <option value="Beginner">Beginner</option>
//               <option value="Intermediate">Intermediate</option>
//               <option value="Advanced">Advanced</option>
//             </select>

//             <select
//               className="input"
//               value={user.goal}
//               onChange={(e) =>
//                 setUser({
//                   ...user,
//                   goal: e.target.value as UserProfile["goal"],
//                 })
//               }
//             >
//               <option value="Long Term Growth">Long Term Growth</option>
//               <option value="Income">Income</option>
//               <option value="Short Term Trading">Short Term Trading</option>
//               <option value="Learning">Learning</option>
//             </select>

//             <select
//               className="input"
//               value={user.horizon}
//               onChange={(e) =>
//                 setUser({
//                   ...user,
//                   horizon: e.target.value as UserProfile["horizon"],
//                 })
//               }
//             >
//               <option value="< 1 Year">&lt; 1 Year</option>
//               <option value="1 - 5 Years">1 - 5 Years</option>
//               <option value="5+ Years">5+ Years</option>
//             </select>
//           </div>
//         </Card>
//       </div>

//       <div style={{ marginTop: 14 }}>
//         <Card title="Favorite Sectors">
//           <div className="rowWrap">
//             {sectorOptions.map((sector: string) => {
//               const selected = user.favoriteSectors.includes(sector);

//               return (
//                 <button
//                   key={sector}
//                   type="button"
//                   className="btn"
//                   onClick={() => toggleSector(sector)}
//                   style={{
//                     background: selected
//                       ? "rgba(74,144,226,0.16)"
//                       : undefined,
//                     borderColor: selected
//                       ? "rgba(74,144,226,0.5)"
//                       : undefined,
//                   }}
//                 >
//                   {sector}
//                 </button>
//               );
//             })}
//           </div>
//         </Card>
//       </div>

//       <div style={{ marginTop: 14 }}>
//         <Card title="">
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 8,
//               marginBottom: 12,
//             }}
//           >
//             <div
//               style={{
//                 fontWeight: 900,
//                 fontSize: 16,
//                 color: "rgba(255,255,255,0.92)",
//               }}
//             >
//               Notifications
//             </div>

//             <button
//               type="button"
//               onClick={() => setShowNotifInfo(true)}
//               aria-label="More information about notifications"
//               title="More information"
//               style={{
//                 width: 22,
//                 height: 22,
//                 borderRadius: "50%",
//                 border: "1px solid rgba(255,255,255,0.16)",
//                 background: "rgba(255,255,255,0.06)",
//                 color: "rgba(255,255,255,0.88)",
//                 cursor: "pointer",
//                 display: "inline-flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: 12,
//                 fontWeight: 800,
//                 lineHeight: 1,
//                 padding: 0,
//               }}
//             >
//               i
//             </button>
//           </div>

//           <div style={{ display: "grid", gap: 16 }}>
//             <div>
//               <div
//                 style={{
//                   fontSize: 13,
//                   fontWeight: 700,
//                   color: "rgba(255,255,255,0.9)",
//                   marginBottom: 8,
//                 }}
//               >
//                 Alert Types
//               </div>

//               <div style={{ display: "grid", gap: 10 }}>
//                 <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                   <input
//                     type="checkbox"
//                     checked={user.notifications.priceAlerts}
//                     onChange={(e) => {
//                       setNotificationError("");
//                       setUser({
//                         ...user,
//                         notifications: {
//                           ...user.notifications,
//                           priceAlerts: e.target.checked,
//                         },
//                       });
//                     }}
//                   />
//                   Price alerts
//                 </label>

//                 <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                   <input
//                     type="checkbox"
//                     checked={user.notifications.newsAlerts}
//                     onChange={(e) => {
//                       setNotificationError("");
//                       setUser({
//                         ...user,
//                         notifications: {
//                           ...user.notifications,
//                           newsAlerts: e.target.checked,
//                         },
//                       });
//                     }}
//                   />
//                   News alerts
//                 </label>
//               </div>
//             </div>

//             <div>
//               <div
//                 style={{
//                   fontSize: 13,
//                   fontWeight: 700,
//                   color: "rgba(255,255,255,0.9)",
//                   marginBottom: 8,
//                 }}
//               >
//                 Delivery
//               </div>

//               <div style={{ display: "grid", gap: 10 }}>
//                 <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                   <input
//                     type="checkbox"
//                     checked={user.notifications.emailAlerts}
//                     onChange={(e) => {
//                       setNotificationError("");
//                       setUser({
//                         ...user,
//                         notifications: {
//                           ...user.notifications,
//                           emailAlerts: e.target.checked,
//                         },
//                       });
//                     }}
//                   />
//                   Email notifications
//                 </label>

//                 <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                   <input
//                     type="checkbox"
//                     checked={user.notifications.smsNotifications}
//                     onChange={(e) => {
//                       setNotificationError("");
//                       setUser({
//                         ...user,
//                         notifications: {
//                           ...user.notifications,
//                           smsNotifications: e.target.checked,
//                         },
//                       });
//                     }}
//                   />
//                   SMS notifications
//                 </label>

//                 <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                   <input
//                     type="checkbox"
//                     checked={user.notifications.pushNotifications}
//                     onChange={(e) => {
//                       setNotificationError("");
//                       setUser({
//                         ...user,
//                         notifications: {
//                           ...user.notifications,
//                           pushNotifications: e.target.checked,
//                         },
//                       });
//                     }}
//                   />
//                   Push notifications
//                 </label>
//               </div>
//             </div>
//           </div>

//           {notificationError && (
//             <div
//               style={{
//                 marginTop: 12,
//                 color: "#ff9b9b",
//                 background: "rgba(231,76,60,0.10)",
//                 border: "1px solid rgba(231,76,60,0.35)",
//                 borderRadius: 12,
//                 padding: "10px 12px",
//                 fontSize: 14,
//               }}
//             >
//               {notificationError}
//             </div>
//           )}
//         </Card>
//       </div>

//       <div style={{ marginTop: 14 }}>
//         <Card title="Actions">
//           <div className="rowWrap">
//             <button className="btn btnPrimary" onClick={handleSave}>
//               Save Changes
//             </button>

//             <button className="btn" onClick={handleLogout}>
//               Logout
//             </button>

//             <button className="btn btnDanger" onClick={handleDeleteAccount}>
//               Delete Account
//             </button>
//           </div>

//           {saved && (
//             <div style={{ marginTop: 12, color: "var(--green)", fontSize: 14 }}>
//               {saved}
//             </div>
//           )}
//         </Card>
//       </div>

//       <InfoDialog
//         open={showNotifInfo}
//         title="Notifications Info"
//         onClose={() => setShowNotifInfo(false)}
//       >
//         <div style={{ display: "grid", gap: 12 }}>
//           <div>
//             <strong style={{ color: "rgba(255,255,255,0.92)" }}>
//               Alert Types
//             </strong>
//             <div style={{ marginTop: 4 }}>
//               Select one or more alert categories to receive notifications for
//               price movements and market news.
//             </div>
//           </div>

//           <div>
//             <strong style={{ color: "rgba(255,255,255,0.92)" }}>
//               Delivery
//             </strong>
//             <div style={{ marginTop: 4 }}>
//               Select one or more delivery methods to receive notifications. If
//               any alert type is enabled, at least one delivery method must also
//               be enabled. Likewise, if any delivery method is enabled, at least
//               one alert type must also be selected.
//             </div>
//           </div>
//         </div>
//       </InfoDialog>
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import InfoDialog from "../components/InfoDialog";
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
    smsNotifications: false,
    pushNotifications: false,
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

const DASHBOARD_RANGE_KEY = "dashboardSelectedRange";
const DASHBOARD_RANGE_TOUCHED_KEY = "dashboardSelectedRangeTouched";
const DASHBOARD_RISK_KEY = "dashboardRiskProfile";
const DASHBOARD_RISK_TOUCHED_KEY = "dashboardRiskProfileTouched";
const DASHBOARD_TICKER_KEY = "lastDashboardTicker";

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
  const [notificationError, setNotificationError] = useState("");
  const [countryQuery, setCountryQuery] = useState(defaultUser.country);
  const [timeZoneQuery, setTimeZoneQuery] = useState(
    getTimeZoneLabel(defaultUser.timeZone)
  );
  const [showNotifInfo, setShowNotifInfo] = useState(false);

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

  const hasSelectedAlertType =
    user.notifications.priceAlerts || user.notifications.newsAlerts;

  const hasSelectedDeliveryMethod =
    user.notifications.emailAlerts ||
    user.notifications.smsNotifications ||
    user.notifications.pushNotifications;

  const toggleSector = (sector: string) => {
    setUser((prev: UserProfile) => ({
      ...prev,
      favoriteSectors: prev.favoriteSectors.includes(sector)
        ? prev.favoriteSectors.filter((s: string) => s !== sector)
        : [...prev.favoriteSectors, sector],
    }));
  };

  const handleSave = async () => {
    setSaved("");
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
      const updated = await updateProfile(user.id, user);
      setUser(updated);
      setCountryQuery(updated.country);
      setTimeZoneQuery(getTimeZoneLabel(updated.timeZone));
      localStorage.setItem("user", JSON.stringify(updated));

      // Clear manual Dashboard overrides so Dashboard follows the newly saved profile again.
      localStorage.removeItem(DASHBOARD_RISK_KEY);
      localStorage.removeItem(DASHBOARD_RISK_TOUCHED_KEY);
      localStorage.removeItem(DASHBOARD_RANGE_KEY);
      localStorage.removeItem(DASHBOARD_RANGE_TOUCHED_KEY);

      localStorage.setItem("profileUpdatedAt", Date.now().toString());

      setSaved("Profile updated successfully.");
      setTimeout(() => setSaved(""), 2000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaved("Failed to save profile.");
      setTimeout(() => setSaved(""), 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("profileUpdatedAt");
    localStorage.removeItem(DASHBOARD_RISK_KEY);
    localStorage.removeItem(DASHBOARD_RISK_TOUCHED_KEY);
    localStorage.removeItem(DASHBOARD_RANGE_KEY);
    localStorage.removeItem(DASHBOARD_RANGE_TOUCHED_KEY);
    localStorage.removeItem(DASHBOARD_TICKER_KEY);

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
      localStorage.removeItem("profileUpdatedAt");
      localStorage.removeItem(DASHBOARD_RISK_KEY);
      localStorage.removeItem(DASHBOARD_RISK_TOUCHED_KEY);
      localStorage.removeItem(DASHBOARD_RANGE_KEY);
      localStorage.removeItem(DASHBOARD_RANGE_TOUCHED_KEY);
      localStorage.removeItem(DASHBOARD_TICKER_KEY);

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
        <Card title="">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: 16,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              Notifications
            </div>

            <button
              type="button"
              onClick={() => setShowNotifInfo(true)}
              aria-label="More information about notifications"
              title="More information"
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.88)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1,
                padding: 0,
              }}
            >
              i
            </button>
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
                    checked={user.notifications.priceAlerts}
                    onChange={(e) => {
                      setNotificationError("");
                      setUser({
                        ...user,
                        notifications: {
                          ...user.notifications,
                          priceAlerts: e.target.checked,
                        },
                      });
                    }}
                  />
                  Price alerts
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={user.notifications.newsAlerts}
                    onChange={(e) => {
                      setNotificationError("");
                      setUser({
                        ...user,
                        notifications: {
                          ...user.notifications,
                          newsAlerts: e.target.checked,
                        },
                      });
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
                    checked={user.notifications.emailAlerts}
                    onChange={(e) => {
                      setNotificationError("");
                      setUser({
                        ...user,
                        notifications: {
                          ...user.notifications,
                          emailAlerts: e.target.checked,
                        },
                      });
                    }}
                  />
                  Email notifications
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={user.notifications.smsNotifications}
                    onChange={(e) => {
                      setNotificationError("");
                      setUser({
                        ...user,
                        notifications: {
                          ...user.notifications,
                          smsNotifications: e.target.checked,
                        },
                      });
                    }}
                  />
                  SMS notifications
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={user.notifications.pushNotifications}
                    onChange={(e) => {
                      setNotificationError("");
                      setUser({
                        ...user,
                        notifications: {
                          ...user.notifications,
                          pushNotifications: e.target.checked,
                        },
                      });
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

      <InfoDialog
        open={showNotifInfo}
        title="Notifications Info"
        onClose={() => setShowNotifInfo(false)}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <strong style={{ color: "rgba(255,255,255,0.92)" }}>
              Alert Types
            </strong>
            <div style={{ marginTop: 4 }}>
              Select one or more alert categories to receive notifications for
              price movements and market news.
            </div>
          </div>

          <div>
            <strong style={{ color: "rgba(255,255,255,0.92)" }}>
              Delivery
            </strong>
            <div style={{ marginTop: 4 }}>
              Select one or more delivery methods to receive notifications. If
              any alert type is enabled, at least one delivery method must also
              be enabled. Likewise, if any delivery method is enabled, at least
              one alert type must also be selected.
            </div>
          </div>
        </div>
      </InfoDialog>
    </div>
  );
}