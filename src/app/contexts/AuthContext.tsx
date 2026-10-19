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
    let redirigiendo = false;

    const redirigirAlLoginGeneral = () => {
      if (redirigiendo) return;
      redirigiendo = true;
      try {
        localStorage.removeItem('usuario');
        localStorage.removeItem('user');
      } catch {
        // Ignorar errores de acceso a localStorage
      }
      console.warn("🔒 No se detectó una sesión activa. Redirigiendo al Login Central...");
      window.location.replace("http://wordsofhope.dyndns.org/");
    };

    const verificarSesionReal = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const headers: Record<string, string> = {
          'Accept': 'application/json'
        };
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }

        // Consultamos la sesión real decodificada en la cookie o token mediante el backend
        const response = await fetch('/api/donaciones/usuario-activo', {
          credentials: 'include',
          headers
        });

        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
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
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error al verificar sesión real mediante la API:", error);
      }

      // Si no hay sesión válida en el backend, redirigir siempre al Login General
      redirigirAlLoginGeneral();
    };

    verificarSesionReal();
  }, []);

  // El login real ya lo maneja el Módulo Central, dejamos las funciones como pasarelas limpias
  const login = async (email: string, password?: string) => {
    return true;
  };

  const logout = () => {
    setUser(null);
    window.location.replace("/");
  };

  const updatePreferencesLocally = (idioma: string, tema: string) => {
    setUser((prev) => prev ? { ...prev, idioma_pref: idioma, tema_pref: tema } : null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updatePreferencesLocally, loading }}>
      {!loading && user ? children : null}
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