// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomeScreen from "./showcase/home/HomeScreen";
import ProfileScreen from "./showcase/profile/ProfileScreen";
import SnackNavigationBar from "./snacks/ui/SnackNavigationBar";
import CrudCorrespondentScreen from "./showcase/manage_correspondent/CrudCorrespondentScreen";
import CrudUsersScreen from "./showcase/manage_users/CrudUsersScreen";

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
      <Route path="/manageAdministrators" element={<CrudUsersScreen />} />
      <Route path="/manageReports" element={<HomeScreen />} />
    </Routes>
    <SnackNavigationBar /> {/* Barra de navegación siempre visible */}
  </BrowserRouter>
);

export default App;
