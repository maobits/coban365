import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import SnackLogo from "../../snacks/ui/SnackLogo"; // Importa el logo
import { useTheme } from "../../glamour/ThemeContext"; // Importa el tema global

/**
 * Componente SnackLogin
 *
 * Renderiza un formulario de inicio de sesión estilizado con Material UI y el tema de la App.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {(email: string, password: string) => void} props.onLogin - Función que maneja el inicio de sesión.
 * @returns {JSX.Element} Elemento JSX con el formulario de autenticación.
 */

const SnackLogin: React.FC<{
  onLogin: (email: string, password: string) => void;
}> = ({ onLogin }) => {
  const { colors, fonts } = useTheme(); // Obtiene el tema global
  const [email, setEmail] = useState(""); // Estado para el email
  const [password, setPassword] = useState(""); // Estado para la contraseña

  // Maneja el envío del formulario
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onLogin(email, password); // Llama al controlador de inicio de sesión
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor={colors.background_grey} // Fondo del formulario según el tema
    >
      {/* Tarjeta de inicio de sesión */}
      <Card
        sx={{
          width: 380,
          padding: 3,
          boxShadow: 6,
          borderRadius: 4,
          backgroundColor: colors.background,
        }}
      >
        <CardContent>
          {/* Logo centrado */}
          <Box display="flex" justifyContent="center" mb={2}>
            <SnackLogo width={80} height={80} />
          </Box>

          {/* Título estilizado con el tema */}
          <Typography
            variant="h5"
            align="center"
            fontWeight="bold"
            color={colors.primary}
            fontFamily={fonts.heading}
            gutterBottom
          >
            Iniciar Sesión
          </Typography>

          {/* Formulario */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Campo de Email */}
            <TextField
              fullWidth
              label="Correo Electrónico"
              variant="outlined"
              margin="normal"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: colors.primary },
                  "&:hover fieldset": { borderColor: colors.secondary },
                },
              }}
            />

            {/* Campo de Contraseña */}
            <TextField
              fullWidth
              label="Contraseña"
              variant="outlined"
              margin="normal"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: colors.primary },
                  "&:hover fieldset": { borderColor: colors.secondary },
                },
              }}
            />

            {/* Botón de Inicio de Sesión */}
            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{
                marginTop: 2,
                padding: 1,
                backgroundColor: colors.primary,
                fontFamily: fonts.main,
                "&:hover": {
                  backgroundColor: colors.secondary,
                },
              }}
            >
              Ingresar
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SnackLogin;
