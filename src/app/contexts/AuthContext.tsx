import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id_usuario: number;
  nombre: string;
  rol: string;
  email: string;
  idioma_pref: string;
  tema_pref: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updatePreferencesLocally: (idioma: string, tema: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔌 CONEXIÓN REAL AL ECOSISTEMA
  useEffect(() => {
    const verificarSesionReal = async () => {
      try {
        // 1. Intentamos consultar la sesión real decodificada en la cookie mediante el backend
        const response = await fetch('/api/donaciones/usuario-activo', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.id_usuario) {
            setUser({
              id_usuario: data.id_usuario,
              nombre: data.nombre || data.nombre_usuario || 'Admin',
              rol: data.rol || 'Administrador',
              email: data.email || 'admin@centrocomunitario.org',
              idioma_pref: data.idioma_pref || 'es',
              tema_pref: data.tema_pref || 'light'
            });
            return;
          }
        }
      } catch (error) {
        console.error("Error al verificar sesión real mediante la API:", error);
      }

      // 2. Fallback 1: Intentar leer del localStorage (Login Central alternativo)
      try {
        const usuarioSesion = localStorage.getItem('usuario') || localStorage.getItem('user');
        if (usuarioSesion) {
          const parsed = JSON.parse(usuarioSesion);
          setUser({
            id_usuario: parsed.id_usuario || 1,
            nombre: parsed.nombre || parsed.nombre_usuario || 'Admin',
            rol: parsed.rol || 'Administrador',
            email: parsed.email || 'admin@centrocomunitario.org',
            idioma_pref: parsed.idioma_pref || 'es',
            tema_pref: parsed.tema_pref || 'light'
          });
          return;
        }
      } catch (error) {
        console.error("Error al leer de localStorage:", error);
      }

      // 3. Fallback 2: Usuario predeterminado/default para asegurar operatividad en desarrollo
      console.log("Cargando usuario predeterminado de desarrollo.");
      setUser({
        id_usuario: 1,
        nombre: 'Admin',
        rol: 'Administrador',
        email: 'admin@centrocomunitario.org',
        idioma_pref: 'es',
        tema_pref: 'light'
      });
    };

    verificarSesionReal().finally(() => {
      setLoading(false);
    });
  }, []);

  // El login real ya lo maneja el Módulo Central, dejamos las funciones como pasarelas limpias
  const login = async (email: string, password?: string) => {
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const updatePreferencesLocally = (idioma: string, tema: string) => {
    setUser((prev) => prev ? { ...prev, idioma_pref: idioma, tema_pref: tema } : null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updatePreferencesLocally, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}