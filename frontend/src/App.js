import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import StockDetail from "./pages/StockDetail";
import VirtualPortfolio from "./pages/VirtualPortfolio";
import ProHelpers from "./pages/ProHelpers";
import GlobalCreators from "./pages/GlobalCreators";
import GamificationHub from "./pages/GamificationHub";
import CommunityLeagues from "./pages/CommunityLeagues";
import MultiAssetMatrix from "./pages/MultiAssetMatrix";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />

        <Route
          path="/portfolio"
          element={
            <ProtectedRoute>
              <VirtualPortfolio />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quests"
          element={
            <ProtectedRoute>
              <GamificationHub />
            </ProtectedRoute>
          }
        />

        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <CommunityLeagues />
            </ProtectedRoute>
          }
        />

        <Route
          path="/asset-matrix"
          element={
            <ProtectedRoute>
              <MultiAssetMatrix />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pro-helpers"
          element={
            <ProtectedRoute>
              <ProHelpers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/creators"
          element={<GlobalCreators />}
        />

        <Route
          path="/stock/:symbol"
          element={
            <ProtectedRoute>
              <StockDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
