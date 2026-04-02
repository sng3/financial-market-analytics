export type UserProfile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  riskTolerance: "Conservative" | "Moderate" | "Aggressive";
  experience: "Beginner" | "Intermediate" | "Advanced";
  goal: "Long Term Growth" | "Income" | "Short Term Trading" | "Learning";
  horizon: "< 1 Year" | "1 - 5 Years" | "5+ Years";
  favoriteSectors: string[];
  notifications: {
    emailAlerts: boolean;
    priceAlerts: boolean;
    newsAlerts: boolean;
    earningsAlerts: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
  country: string;
  timeZone: string;
};