import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import StockDetail from "./pages/StockDetail";
import VirtualPortfolio from "./pages/VirtualPortfolio";
import ProHelpers from "./pages/ProHelpers";
import GlobalCreators from "./pages/GlobalCreators";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/portfolio"
          element={
            <ProtectedRoute>
              <VirtualPortfolio />
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
