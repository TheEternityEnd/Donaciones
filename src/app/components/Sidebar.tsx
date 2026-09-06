import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Package,
  FileText,
  ArrowRightLeft,
  Users,
  FileBarChart,
  Moon,
  Sun,
  Languages,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "./ui/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigationItems = [
  { icon: LayoutDashboard, label: { es: "Dashboard", en: "Dashboard" }, path: "/" },
  { icon: Package, label: { es: "Inventario", en: "Inventory" }, path: "/inventory" },
  { icon: FileText, label: { es: "Registro de Donaciones", en: "Donation Registry" }, path: "/registry" },
  { icon: ArrowRightLeft, label: { es: "Solicitudes de Salida", en: "Outflow Requests" }, path: "/outflow" },
  { icon: Users, label: { es: "Préstamos de Equipos", en: "Equipment Loans" }, path: "/loans" },
  { icon: FileBarChart, label: { es: "Reportes Médicos", en: "Medical Reports" }, path: "/reports" },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { theme, toggleTheme, language, toggleLanguage } = useTheme();
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 px-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1798BC] flex items-center justify-center">
              <span className="text-white font-bold text-lg">PE</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 dark:text-white text-sm">Fundación</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Palabras de Esperanza</span>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-[#1798BC] flex items-center justify-center">
            <span className="text-white font-bold text-lg">PE</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                isActive
                  ? "bg-[#1798BC] text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "")} />
                {!collapsed && <span className="text-sm font-medium">{item.label[language]}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Utilities */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={collapsed ? (language === "es" ? "Español" : "English") : ""}
        >
          <Languages className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{language === "es" ? "Español" : "English"}</span>}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={collapsed ? (theme === "light" ? "Modo Claro" : "Modo Oscuro") : ""}
        >
          {theme === "light" ? <Moon className="w-5 h-5 flex-shrink-0" /> : <Sun className="w-5 h-5 flex-shrink-0" />}
          {!collapsed && (
            <span className="text-sm font-medium">{theme === "light" ? "Modo Oscuro" : "Modo Claro"}</span>
          )}
        </button>

        {/* User Profile */}
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#1798BC] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col items-start overflow-hidden text-left">
              <span className="text-sm font-medium truncate w-full">{user?.nombre || "Admin User"}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">{user?.email || "admin@centrocomunitario.org"}</span>
            </div>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
