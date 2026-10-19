import { Search, Plus } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useData } from "../contexts/DataContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { NewEntryDialog } from "./NewEntryDialog";
import { useState } from "react";

const translations = {
  es: {
    title: "Gestión de Donaciones - Módulo V",
    searchPlaceholder: "Buscar por Folio #, Donante, o Nombre del Artículo",
    newEntry: "Registrar Nueva Entrada",
  },
  en: {
    title: "Donation Management - Module V",
    searchPlaceholder: "Search by Folio #, Donor, or Item Name",
    newEntry: "Register New Entry",
  },
};

export function TopBar() {
  const { language } = useTheme();
  const { searchQuery, setSearchQuery } = useData();
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const t = translations[language];

  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between gap-4">
        {/* Page Title */}
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white whitespace-nowrap">{t.title}</h1>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          />
        </div>

        {/* Quick Action Button */}
        <Button 
          onClick={() => setNewEntryOpen(true)}
          className="bg-[#1798BC] hover:bg-[#147a9a] text-white whitespace-nowrap gap-2"
        >
          <Plus className="w-4 h-4" />
          {t.newEntry}
        </Button>
      </header>

      <NewEntryDialog open={newEntryOpen} onOpenChange={setNewEntryOpen} />
    </>
  );
}