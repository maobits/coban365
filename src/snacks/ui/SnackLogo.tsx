import React from "react";
import { Box } from "@mui/material"; // Importa el contenedor de Material UI

/**
 * Componente SnackLogo
 *
 * Este componente muestra el logotipo de la aplicación con un ancho y alto personalizable.
 * Utiliza Material UI para una mejor gestión del estilo.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {number} props.width - Ancho del logo (opcional, por defecto 100).
 * @param {number} props.height - Alto del logo (opcional, por defecto 100).
 * @returns {JSX.Element} Elemento JSX que muestra la imagen del logo.
 */

// Importa la imagen del logo desde la ruta especificada
import LogoImage from "../../ingredients/images/logo.png";

const SnackLogo: React.FC<{ width?: number; height?: number }> = ({
  width = 100,
  height = 100,
}) => {
  return (
    <Box
      component="img"
      src={LogoImage} // Fuente de la imagen importada
      alt="Logo"
      sx={{
        width, // Aplica el ancho personalizado
        height, // Aplica el alto personalizado
        display: "block", // Evita márgenes extra
        mx: "auto", // Centra horizontalmente si se coloca en un contenedor flex
      }}
    />
  );
};

export default SnackLogo;
