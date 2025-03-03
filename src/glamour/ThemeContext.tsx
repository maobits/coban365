// src/glamour/ThemeContext.tsx (o la ruta que prefieras)

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
    primary: "#580666",
    secondary: "#f43e05",
    background: "#ffffff",
    background_grey: "#F5F5F5",
    text: "#333333",
    text_white: "#ffffff",
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
