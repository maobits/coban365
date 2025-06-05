import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../glamour/ThemeContext";
import { getProfiles } from "../../store/profile/Profile";
import {
  createUser,
  updateUser,
  deleteUser,
} from "../../store/profile/CrudUser";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { InputAdornment } from "@mui/material";

/**
 * Componente SnackCrudUser
 *
 * Permite la gestión de usuarios (CRUD) con selección de roles y permisos.
 * @param {Object} props - Propiedades del componente.
 * @param {string[]} props.permissions - Lista de permisos del usuario autenticado.
 * @returns {JSX.Element} Elemento JSX que representa la gestión de usuarios.
 */
const SnackCrudUser: React.FC<{ permissions: string[] }> = ({
  permissions,
}) => {
  const { colors, fonts } = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [showPassword, setShowPassword] = useState(false);

  // Lista de roles disponibles
  const roles = ["admin", "superadmin", "cajero"];

  // Lista de permisos disponibles
  const permissionsList = [
    "manageCorrespondents",
    "manageCorrespondent",
    "manageAdministrators",
    "manageReports",
    "manageCash",
  ];

  // Estado inicial para un nuevo usuario
  const [newUser, setNewUser] = useState({
    email: "",
    fullname: "",
    phone: "",
    password: "",
    role: "",
    permissions: [],
  });

  // Estado para usuario seleccionado (Edición)
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    if (!permissions.includes("manageAdministrators")) {
      navigate("/profile");
    }
  }, [permissions, navigate]);

  // Cargar lista de usuarios al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await getProfiles();
        if (usersData.success && Array.isArray(usersData.users)) {
          setUsers(usersData.users);
        }
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para abrir modal de creación
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  // Función para cerrar modal de creación
  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetNewUser();
  };

  // Resetear formulario de nuevo usuario
  const resetNewUser = () => {
    setNewUser({
      email: "",
      fullname: "",
      phone: "",
      password: "",
      role: "",
      permissions: [],
    });
  };

  // Crear nuevo usuario
  const handleCreateUser = async () => {
    try {
      if (
        newUser.email.trim() === "" ||
        newUser.fullname.trim() === "" ||
        newUser.password.trim() === "" ||
        newUser.role.trim() === ""
      ) {
        setAlertMessage("Todos los campos son obligatorios.");
        setAlertType("error");
        return;
      }

      const response = await createUser({
        ...newUser,
        permissions: newUser.permissions,
      });

      if (response.success) {
        setAlertMessage("Usuario creado exitosamente.");
        setAlertType("success");
        handleCloseDialog();

        // Actualizar la lista de usuarios
        const updatedList = await getProfiles();
        if (updatedList.success) {
          setUsers(updatedList.users);
        }
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      console.error("Error al crear usuario:", error);
      setAlertMessage("Error en el servidor.");
      setAlertType("error");
    }
  };

  const handleEditUser = (user: any) => {
    let userPermissions = [];

    if (typeof user.permissions === "string") {
      try {
        const parsedPermissions = JSON.parse(user.permissions);
        userPermissions = Array.isArray(parsedPermissions)
          ? parsedPermissions
          : parsedPermissions.permissions || [];
      } catch (error) {
        console.error("Error al parsear permisos:", error);
      }
    } else if (
      typeof user.permissions === "object" &&
      user.permissions !== null
    ) {
      userPermissions = Array.isArray(user.permissions)
        ? user.permissions
        : user.permissions.permissions || [];
    }

    setSelectedUser({
      ...user,
      permissions: userPermissions,
    });

    setOpenEditDialog(true);
  };

  // Guardar cambios en usuario editado
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      // 🔹 Asegurar que los permisos enviados sean exactamente los seleccionados
      const updatedUser = {
        ...selectedUser,
        permissions: selectedUser.permissions, // 🔹 Enviamos la lista exacta de permisos seleccionados
      };

      console.log(
        "Enviando datos de actualización:",
        JSON.stringify(updatedUser)
      );

      const response = await updateUser(updatedUser);

      if (response.success) {
        setAlertMessage("Usuario actualizado correctamente.");
        setAlertType("success");

        const updatedList = await getProfiles();
        if (updatedList.success) {
          setUsers(updatedList.users);
        }

        setOpenEditDialog(false);
      } else {
        setAlertMessage(response.message);
        setAlertType("error");
      }
    } catch (error) {
      setAlertMessage("Error en la actualización.");
      setAlertType("error");
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario?"))
      return;

    try {
      const response = await deleteUser(userId);

      if (response.success) {
        alert("Usuario eliminado correctamente");

        // Actualizar la lista de usuarios después de eliminar uno
        const updatedList = await getProfiles();
        if (updatedList.success) {
          setUsers(updatedList.users);
        }
      } else {
        alert("Error al eliminar: " + response.message);
      }
    } catch (error) {
      alert("Error en la eliminación");
    }
  };

  {
    /* Permisos con etiquetas. */
  }
  const translatedPermissions = [
    { value: "manageCorrespondents", label: "Gestionar corresponsales" },
    { value: "manageCorrespondent", label: "Gestionar su corresponsal" },
    { value: "manageAdministrators", label: "Gestionar administradores" },
    { value: "manageReports", label: "Gestionar reportes" },
    { value: "manageCash", label: "Gestionar la caja" }, // ← nuevo
  ];

  /*  Permisos por defecto*/
  const getDefaultPermissionsByRole = (role: string): string[] => {
    switch (role) {
      case "admin":
        return ["manageCorrespondent", "manageReports"];
      case "superadmin":
        return [
          "manageCorrespondents",
          "manageReports",
          "manageAdministrators",
        ];
      case "cajero":
        return ["manageCash"];
      default:
        return [];
    }
  };

  return (
    <Box
      sx={{
        padding: 3,
        backgroundColor: colors.background,
        minHeight: "100vh",
      }}
    >
      <Typography
        variant="h4"
        fontFamily={fonts.heading}
        color={colors.primary}
        gutterBottom
      >
        Gestión de Usuarios
      </Typography>

      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={handleOpenDialog}
      >
        Nuevo Usuario
      </Button>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ marginTop: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Nombre Completo</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.fullname}</TableCell>
                  <TableCell>{user.phone || "No registrado"}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo para agregar usuario */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: colors.background,
            color: colors.text_white,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: fonts.heading, color: colors.primary }}>
          Nuevo Usuario
        </DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <TextField
            fullWidth
            label="Nombre Completo"
            variant="outlined"
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
            onChange={(e) =>
              setNewUser({ ...newUser, fullname: e.target.value })
            }
          />
          <TextField
            fullWidth
            label="Teléfono"
            variant="outlined"
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
          />
          <TextField
            fullWidth
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            sx={{
              mb: 2,
              backgroundColor: colors.background,
              borderRadius: 1,
            }}
            InputLabelProps={{
              shrink: true, // 🔧 Esto arregla el label visualmente
              style: { color: colors.text },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    sx={{ color: colors.secondary }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              style: { color: colors.text },
            }}
          />
          <Autocomplete
            options={roles}
            getOptionLabel={(option) => option}
            value={newUser.role}
            onChange={(_, value) =>
              setNewUser({
                ...newUser,
                role: value || "",
                permissions: value ? getDefaultPermissionsByRole(value) : [],
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Rol"
                fullWidth
                variant="outlined"
                sx={{
                  mb: 2,
                  backgroundColor: colors.background,
                  borderRadius: 1,
                }}
              />
            )}
          />

          <Autocomplete
            multiple
            options={translatedPermissions}
            getOptionLabel={(option) => option.label}
            value={translatedPermissions.filter((p) =>
              newUser.permissions.includes(p.value)
            )}
            onChange={(_, newPermissions) =>
              setNewUser({
                ...newUser,
                permissions: newPermissions.map((p) => p.value),
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Permisos"
                fullWidth
                variant="outlined"
                sx={{
                  mb: 2,
                  backgroundColor: colors.background,
                  borderRadius: 1,
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: colors.text_white }}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            sx={{ backgroundColor: colors.secondary }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Edición de Usuario */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: colors.background,
            color: colors.text_white,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: fonts.heading, color: colors.primary }}>
          Editar Usuario
        </DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          <TextField
            fullWidth
            label="Email"
            value={selectedUser?.email || ""}
            onChange={(e) =>
              setSelectedUser({ ...selectedUser, email: e.target.value })
            }
            sx={{
              mt: 2, // 🔹 Agregamos margen superior aquí
              mb: 2,
              backgroundColor: colors.background,
              borderRadius: 1,
            }}
          />
          <TextField
            fullWidth
            label="Nombre Completo"
            value={selectedUser?.fullname || ""}
            onChange={(e) =>
              setSelectedUser({ ...selectedUser, fullname: e.target.value })
            }
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
          />
          <TextField
            fullWidth
            label="Teléfono"
            value={selectedUser?.phone || ""}
            onChange={(e) =>
              setSelectedUser({ ...selectedUser, phone: e.target.value })
            }
            sx={{ mb: 2, backgroundColor: colors.background, borderRadius: 1 }}
          />

          {/* Selección de Rol */}
          <Autocomplete
            options={roles}
            getOptionLabel={(option) => option}
            value={selectedUser?.role || ""}
            onChange={(_, value) =>
              setSelectedUser({ ...selectedUser, role: value || "" })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Rol"
                fullWidth
                variant="outlined"
                sx={{
                  mb: 2,
                  backgroundColor: colors.background,
                  borderRadius: 1,
                }}
              />
            )}
          />

          {/* Selección de Permisos */}
          {/* Selección de Permisos */}
          <Autocomplete
            multiple
            options={translatedPermissions}
            getOptionLabel={(option) => option.label}
            value={translatedPermissions.filter((p) =>
              selectedUser?.permissions.includes(p.value)
            )}
            onChange={(_, newPermissions) =>
              setSelectedUser({
                ...selectedUser,
                permissions: newPermissions.map((p) => p.value),
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Permisos"
                fullWidth
                variant="outlined"
                sx={{
                  mb: 2,
                  backgroundColor: colors.background,
                  borderRadius: 1,
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenEditDialog(false)}
            sx={{ color: colors.text_white }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdateUser}
            variant="contained"
            sx={{ backgroundColor: colors.secondary }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SnackCrudUser;
