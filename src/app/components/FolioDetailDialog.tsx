import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Folio } from "../data/mockData";
import { useTheme } from "../contexts/ThemeContext";
import { Package, User, Calendar, MapPin, Hash } from "lucide-react";

interface FolioDetailDialogProps {
  folio: Folio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const translations = {
  es: {
    title: "Detalles del Folio",
    folioId: "ID de Folio",
    timestamp: "Fecha y Hora",
    origin: "Área de Origen",
    type: "Tipo de Transacción",
    category: "Categoría",
    itemName: "Artículo",
    quantity: "Cantidad",
    status: "Estado",
    donor: "Donante",
    noDonor: "No especificado",
  },
  en: {
    title: "Folio Details",
    folioId: "Folio ID",
    timestamp: "Date and Time",
    origin: "Origin Area",
    type: "Transaction Type",
    category: "Category",
    itemName: "Item",
    quantity: "Quantity",
    status: "Status",
    donor: "Donor",
    noDonor: "Not specified",
  },
};

export function FolioDetailDialog({ folio, open, onOpenChange }: FolioDetailDialogProps) {
  const { language } = useTheme();
  const t = translations[language];

  if (!folio) return null;

  const obtenerDonante = (folioObj: Folio) => {
    const observaciones = folioObj?.observations || "";
    
    if (!observaciones) return "No especificado";
    
    // Expresión regular insensible a mayúsculas para aislar el texto posterior a "donante:"
    const regexDonante = /donante:\s*(.*)/i;
    const coincidencia = observaciones.match(regexDonante);
    
    if (coincidencia && coincidencia[1].trim() !== "") {
      return coincidencia[1].trim();
    }
    
    // Si es una entrada, no tiene el prefijo, pero sí hay texto, asumimos que es el donante directo
    if (folioObj?.type === "ENTRADA" || (folioObj as any)?.Operacion === "ENTRADA") {
      return observaciones.trim();
    }
    
    return "No especificado";
  };

  const donorDisplay = obtenerDonante(folio);

  const getStatusBadge = (status: Folio["status"]) => {
    const styles = {
      Completado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      Pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      "En Proceso": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription className="sr-only">Detalles del folio seleccionado.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Folio ID */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Hash className="w-5 h-5 text-[#1798BC] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.folioId}</p>
              <p className="font-mono font-semibold text-lg text-gray-900 dark:text-white">{folio.id}</p>
            </div>
            {getStatusBadge(folio.status)}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t.timestamp}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{folio.timestamp}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t.origin}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{folio.origin}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Package className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t.type}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{folio.type}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Package className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t.category}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{folio.category}</p>
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="p-4 bg-[#1798BC]/5 border border-[#1798BC]/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t.itemName}</p>
            <p className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{folio.itemName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.quantity}: <span className="font-semibold text-gray-900 dark:text-white">{folio.quantity} unidades</span>
            </p>
          </div>

          {/* Donor */}
          <div className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t.donor}</p>
              {donorDisplay !== 'No especificado' ? (
                <p className="font-semibold text-lg text-gray-900 dark:text-white">{donorDisplay}</p>
              ) : (
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 italic">{t.noDonor}</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
