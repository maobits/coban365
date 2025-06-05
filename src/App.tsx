// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomeScreen from "./showcase/home/HomeScreen";
import ProfileScreen from "./showcase/profile/ProfileScreen";
import SnackNavigationBar from "./snacks/ui/SnackNavigationBar";
import CrudCorrespondentScreen from "./showcase/manage_correspondent/CrudCorrespondentScreen";
import CrudMyCorrespondentScreen from "./showcase/manage_correspondent/CrudMyCorrespondentScreen";
import CrudUsersScreen from "./showcase/manage_users/CrudUsersScreen";
import CrudTransactionScreen from "./showcase/manage_transactions/CrudTransactionScreen";
import CrudTransactionsCheckoutScreen from "./showcase/manage_transactions/CrudTransactionScreenCheckout";
import ShiftsRegisterScreen from "./showcase/shifts/ShiftsScreen";
import GenerateReports from "./showcase/manage_reports/GenerateReports";
import SnackReportThirdParty from "./snacks/ui/reports/SnackReportThirdParty"; // ✅ Importación del reporte de terceros

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Página principal y login */}
      <Route path="/" element={<HomeScreen />} />
      <Route path="/login" element={<HomeScreen />} />
      {/* Perfil */}
      <Route path="/profile" element={<ProfileScreen />} />
      {/* Gestión de corresponsales */}
      <Route path="/correspondents" element={<CrudCorrespondentScreen />} />
      <Route
        path="/my-correspondents"
        element={<CrudMyCorrespondentScreen />}
      />
      {/* Gestión de usuarios */}
      <Route path="/manageAdministrators" element={<CrudUsersScreen />} />
      {/* Gestión de transacciones */}
      <Route path="/manageTransactions" element={<CrudTransactionScreen />} />
      <Route path="/manageCash" element={<CrudTransactionsCheckoutScreen />} />
      {/* Gestión de reportes */}
      <Route path="/manageReports" element={<GenerateReports />} />
      <Route
        path="/reportThirdParty"
        element={<SnackReportThirdParty />}
      />{" "}
      {/* ✅ Nueva ruta */}
      {/* Turnos */}
      <Route
        path="/shifts/register/:correspondentId/:cashId"
        element={<ShiftsRegisterScreen />}
      />
    </Routes>

    {/* Barra de navegación siempre visible */}
    <SnackNavigationBar />
  </BrowserRouter>
);

export default App;
