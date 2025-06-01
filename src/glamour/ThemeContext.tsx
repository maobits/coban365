// src/glamour/ThemeContext.tsx

import React, { createContext, useContext } from "react";

// 1. Interfaz del tema
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    background_grey: string;
    text: string;
    text_white: string;
  };
  fonts: {
    main: string;
    heading: string;
  };
}

// 2. Interfaz del tema parcial
interface PartialTheme {
  colors?: Partial<Theme["colors"]>;
  fonts?: Partial<Theme["fonts"]>;
}

// 3. Valor por defecto (defaultTheme)
const defaultTheme: Theme = {
  colors: {
    primary: "#1a1a1a", // Negro profundo (usado como fondo principal o encabezados)
    secondary: "#4d4d4d", // Gris oscuro (usado para botones, bordes, íconos activos)
    background: "#ffffff", // Blanco puro (fondo principal)
    background_grey: "#f2f2f2", // Gris claro (fondo de secciones o tarjetas)
    text: "#1a1a1a", // Texto principal (negro casi puro)
    text_white: "#ffffff", // Texto blanco (para fondos oscuros)
  },
  fonts: {
    main: "Roboto, sans-serif",
    heading: "Montserrat, sans-serif",
  },
};

// 4. Creación del contexto con valor por defecto
const ThemeContext = createContext<Theme>(defaultTheme);

// 5. Tipado de las props del ThemeProvider
interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: PartialTheme;
}

// 5 (continuación). Implementación del ThemeProvider
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  theme = {},
}) => {
  // Combinamos el tema por defecto con el que se reciba por props
  const mergedTheme: Theme = {
    colors: { ...defaultTheme.colors, ...(theme.colors || {}) },
    fonts: { ...defaultTheme.fonts, ...(theme.fonts || {}) },
  };

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

// 6. Hook personalizado para consumir el contexto
export const useTheme = (): Theme => {
  return useContext(ThemeContext);
};
