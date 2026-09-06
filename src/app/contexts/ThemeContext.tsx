import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

type Theme = "light" | "dark";
type Language = "es" | "en";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, updatePreferencesLocally } = useAuth();
  
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("es");

  useEffect(() => {
    if (user) {
      setTheme((user.tema_pref as Theme) || "light");
      setLanguage((user.idioma_pref as Language) || "es");
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (user) {
      updatePreferencesLocally(language, newTheme);
      try {
        await fetch('http://localhost:5000/api/usuarios/ajustes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_usuario: user.id_usuario,
            idioma_pref: language,
            tema_pref: newTheme
          })
        });
      } catch (error) {
        console.error("Error al guardar tema remoto:", error);
      }
    }
  };

  const toggleLanguage = async () => {
    const newLanguage = language === "es" ? "en" : "es";
    setLanguage(newLanguage);
    if (user) {
      updatePreferencesLocally(newLanguage, theme);
      try {
        await fetch('http://localhost:5000/api/usuarios/ajustes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_usuario: user.id_usuario,
            idioma_pref: newLanguage,
            tema_pref: theme
          })
        });
      } catch (error) {
        console.error("Error al guardar idioma remoto:", error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, language, toggleLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
