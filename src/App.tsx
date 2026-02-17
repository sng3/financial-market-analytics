// import React from "react";
// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import AppLayout from "./components/layout/AppLayout";
// import Home from "./pages/Home";
// import Dashboard from "./pages/Dashboard";
// import Profile from "./pages/Profile";
// import Stock from "./pages/Stock";
// import Login from "./pages/Login";

// import { AuthProvider } from "./auth/AuthContext";
// import ProtectedRoute from "./auth/ProtectedRoute";

// export default function App() {
//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         <Routes>
//           <Route element={<AppLayout />}>
//             <Route path="/" element={<Home />} />
//             <Route path="/stock" element={<Stock />} />
//             <Route path="/login" element={<Login />} />

//             <Route
//               path="/dashboard"
//               element={
//                 <ProtectedRoute>
//                   <Dashboard />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/profile"
//               element={
//                 <ProtectedRoute>
//                   <Profile />
//                 </ProtectedRoute>
//               }
//             />
//           </Route>
//         </Routes>
//       </AuthProvider>
//     </BrowserRouter>
//   );
// }

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import WatchlistPage from "./pages/WatchlistPage";
import AlertsPage from "./pages/AlertsPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}