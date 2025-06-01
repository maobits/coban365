import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import SnackLogo from "../../snacks/ui/SnackLogo";
import { useTheme } from "../../glamour/ThemeContext";
import { recoverPassword } from "../../store/notifications/Notifications"; // Asegúrate de tener este servicio

const SnackLogin: React.FC<{
  onLogin: (email: string, password: string) => void;
}> = ({ onLogin }) => {
  const { colors, fonts } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isRecovering) {
      const result = await recoverPassword(email);
      setMessage(result.message);
    } else {
      onLogin(email, password);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor={colors.background_grey}
    >
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
          <Box display="flex" justifyContent="center" mb={2}>
            <SnackLogo width={80} height={80} />
          </Box>

          <Typography
            variant="h5"
            align="center"
            fontWeight="bold"
            color={colors.primary}
            fontFamily={fonts.heading}
            gutterBottom
          >
            {isRecovering ? "Recuperar Contraseña" : "Iniciar Sesión"}
          </Typography>

          {message && (
            <Typography
              variant="body2"
              color="success.main"
              align="center"
              sx={{ mt: 1 }}
            >
              {message}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
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

            {!isRecovering && (
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
            )}

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
              {isRecovering ? "Enviar Enlace" : "Ingresar"}
            </Button>

            <Typography
              variant="body2"
              align="center"
              sx={{
                marginTop: 2,
                color: colors.secondary,
                fontFamily: fonts.main,
                cursor: "pointer",
                textDecoration: "underline",
                "&:hover": { color: colors.primary },
              }}
              onClick={() => {
                setIsRecovering(!isRecovering);
                setMessage("");
              }}
            >
              {isRecovering
                ? "← Volver al inicio de sesión"
                : "¿Olvidaste tu contraseña?"}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SnackLogin;
