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

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      {/* Rutas de la autenticación */}
      <Route path="/login" element={<HomeScreen />} />
      {/* Rutas del perfil */}
      <Route path="/profile" element={<ProfileScreen />} />
      {/* Rutas asociadas a permisos especiales */}
      <Route path="/correspondents" element={<CrudCorrespondentScreen />} />
      <Route
        path="/my-correspondents"
        element={<CrudMyCorrespondentScreen />}
      />
      <Route path="/manageAdministrators" element={<CrudUsersScreen />} />
      <Route path="/manageTransactions" element={<CrudTransactionScreen />} />
      <Route path="/manageCash" element={<CrudTransactionsCheckoutScreen />} />
      <Route path="/manageReports" element={<HomeScreen />} />
      <Route
        path="/shifts/register/:correspondentId/:cashId"
        element={<ShiftsRegisterScreen />}
      />
    </Routes>
    <SnackNavigationBar /> {/* Barra de navegación siempre visible */}
  </BrowserRouter>
);

export default App;
