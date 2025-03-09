// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomeScreen from "./showcase/home/HomeScreen";
import ProfileScreen from "./showcase/profile/ProfileScreen";

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      {/* Rutas del perfil */}
      <Route path="/profile" element={<ProfileScreen />} />
      {/* Rutas asociadas a permisos especiales */}
      <Route path="/manageCorrespondents" element={<HomeScreen />} />
      <Route path="/manageAdministrators" element={<HomeScreen />} />
      <Route path="/manageReports" element={<HomeScreen />} />
    </Routes>
  </BrowserRouter>
);

export default App;
