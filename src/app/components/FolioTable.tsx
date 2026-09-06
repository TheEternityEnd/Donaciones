import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2, Pencil, ExternalLink } from "lucide-react";
import { Folio } from "../data/mockData";
import { useTheme } from "../contexts/ThemeContext";
import { useData } from "../contexts/DataContext";
import { FolioDetailDialog } from "./FolioDetailDialog";
import { EditDonationDialog } from "./EditDonationDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { API_URL } from "./data/Storage";
import { toast } from "sonner";
import { useNavigate } from "react-router";

interface FolioTableProps {
  folios: Folio[];
  limit?: number;
}

const translations = {
  es: {
    title: "Últimos Folios Registrados",
    filters: "Filtros:",
    all: "Todos",
    pharmacy: "Farmacia",
    orthopedics: "Ortopedia",
    folio: "Folio ID",
    timestamp: "Fecha/Hora",
    origin: "Área de Origen",
    type: "Tipo",
    category: "Categoría",
    item: "Artículo",
    quantity: "Cantidad",
    status: "Estado",
    completed: "Completado",
    pending: "Pendiente",
    inProcess: "En Proceso",
    entrance: "Entrada",
    exit: "Salida",
    loan: "Préstamo",
  },
  en: {
    title: "Latest Registered Folios",
    filters: "Filters:",
    all: "All",
    pharmacy: "Pharmacy",
    orthopedics: "Orthopedics",
    folio: "Folio ID",
    timestamp: "Date/Time",
    origin: "Origin Area",
    type: "Type",
    category: "Category",
    item: "Item",
    quantity: "Quantity",
    status: "Status",
    completed: "Completed",
    pending: "Pending",
    inProcess: "In Process",
    entrance: "Entrance",
    exit: "Exit",
    loan: "Loan",
  },
};

export function FolioTable({ folios, limit }: FolioTableProps) {
  const { language } = useTheme();
  const { searchQuery } = useData();
  const navigate = useNavigate();
  const t = translations[language];
  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "ENTRADA" | "SALIDA" | "PRESTAMO">("all");
  const [selectedFolio, setSelectedFolio] = useState<Folio | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Apply filters and search
  let filteredFolios = filter === "all" ? folios : folios.filter((f) => f.origin === filter);
  if (typeFilter !== "all") {
    filteredFolios = filteredFolios.filter((f) => {
      const typeUpper = (typeof f.type === 'string' ? f.type : "").toUpperCase();
      return typeUpper === typeFilter || (typeFilter === 'PRESTAMO' && typeUpper === 'PRÉSTAMO');
    });
  }
  
  const obtenerDonante = (folioObj: Folio) => {
    const observaciones = folioObj?.observations || "";
    if (!observaciones) return "No especificado";
    const regexDonante = /donante:\s*(.*)/i;
    const coincidencia = observaciones.match(regexDonante);
    if (coincidencia && coincidencia[1].trim() !== "") {
      return coincidencia[1].trim();
    }
    if (folioObj?.type === "ENTRADA" || (folioObj as any)?.Operacion === "ENTRADA") {
      return observaciones.trim();
    }
    return "No especificado";
  };

  if (searchQuery) {
    filteredFolios = filteredFolios.filter((f) => {
      const term = searchQuery.toLowerCase();
      const donante = obtenerDonante(f).toLowerCase();
      return (
        (f.id && f.id.toLowerCase().includes(term)) ||
        (f.itemName && f.itemName.toLowerCase().includes(term)) ||
        donante.includes(term)
      );
    });
  }

  // Apply limit if specified
  if (limit && limit > 0) {
    filteredFolios = filteredFolios.slice(0, limit);
  }

  const getStatusBadge = (status: Folio["status"]) => {
    const styles = {
      Completado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      Pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      "En Proceso": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    const labels = {
      Completado: t.completed,
      Pendiente: t.pending,
      "En Proceso": t.inProcess,
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getTypeBadge = (type: Folio["type"] | string) => {
    const typeUpper = (typeof type === 'string' ? type : "").toUpperCase();
    
    let style = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    if (typeUpper === 'ENTRADA' || typeUpper === 'ENTRANCE') {
        style = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    } else if (typeUpper === 'SALIDA' || typeUpper === 'EXIT') {
        style = "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
    } else if (typeUpper === 'PRÉSTAMO' || typeUpper === 'PRESTAMO' || typeUpper === 'LOAN') {
        style = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    }
    
    const labels: any = {
      ENTRADA: t.entrance,
      SALIDA: t.exit,
      PRÉSTAMO: t.loan,
      PRESTAMO: t.loan,
    };
    return <Badge className={style}>{labels[typeUpper] || typeUpper}</Badge>;
  };

  const handleRowClick = (folio: Folio) => {
    setSelectedFolio(folio);
    setDetailsOpen(true);
  };

  const handleEdit = (folio: Folio, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFolio(folio);
    setEditOpen(true);
  };

  const handleDeletePrompt = (folio: Folio, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFolio(folio);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedFolio) return;
    try {
      const idStr = selectedFolio.id.replace("F-", "");
      const res = await fetch(`${API_URL}/eliminar/${idStr}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(language === "es" ? "Registro eliminado" : "Registry deleted");
      window.dispatchEvent(new Event("donationsUpdated"));
    } catch (e) {
      toast.error(language === "es" ? "Error al eliminar" : "Error deleting");
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t.title}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t.filters}</span>
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === "all"
                  ? "bg-[#1798BC] text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {t.all}
            </button>
            {Array.from(new Set(folios.map(f => f.origin))).filter(Boolean).map((origin) => (
              <button
                key={origin}
                onClick={() => setFilter(origin as string)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filter === origin
                    ? "bg-[#1798BC] text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {origin}
              </button>
            ))}
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                typeFilter === "all"
                  ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Tipos: Todos
            </button>
            <button
              onClick={() => setTypeFilter("ENTRADA")}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                typeFilter === "ENTRADA"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100"
              }`}
            >
              {t.entrance}
            </button>
            <button
              onClick={() => setTypeFilter("SALIDA")}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                typeFilter === "SALIDA"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-100"
              }`}
            >
              {t.exit}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>id_folio</TableHead>
                <TableHead>tipo_movimiento</TableHead>
                <TableHead>area_origen</TableHead>
                <TableHead>fecha_registro</TableHead>
                <TableHead>id_usuario_registra</TableHead>
                <TableHead>Donante</TableHead>
                <TableHead className="text-center">estatus_folio</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFolios.map((folio) => (
                <TableRow 
                  key={folio.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  onClick={() => handleRowClick(folio)}
                >
                  <TableCell className="font-mono text-sm font-medium">{folio.id.replace('F-', '')}</TableCell>
                  <TableCell>{getTypeBadge(folio.type)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600 font-bold bg-[#1798BC]/10 text-[#1798BC] px-3 py-1 shadow-sm">
                      {folio.origin}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">{folio.timestamp}</TableCell>
                  <TableCell className="text-sm">{folio.userId}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate" title={folio.observations}>
                    {obtenerDonante(folio) !== "No especificado" ? (
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {obtenerDonante(folio)}
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 italic">No especificado</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {folio.statusBool ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                        onClick={(e) => handleEdit(folio, e)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                        onClick={(e) => handleDeletePrompt(folio, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {limit && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center bg-gray-50/50 dark:bg-gray-800/50">
            <Button 
              variant="outline" 
              className="w-full md:w-auto text-[#1798BC] border-[#1798BC] hover:bg-[#1798BC] hover:text-white"
              onClick={() => navigate("/registry")}
            >
              {language === "es" ? "Ver historial completo" : "View complete history"}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </Card>

      <FolioDetailDialog 
        folio={folios.find(f => f.id === selectedFolio?.id) || selectedFolio} 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
      />

      <EditDonationDialog
        folio={selectedFolio}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "es" ? "¿Estás seguro de eliminar este registro?" : "Are you sure you want to delete this record?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "es" 
                ? "Esta acción es irreversible y afectará los históricos de inventario."
                : "This action cannot be undone and will affect inventory history."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "es" ? "Cancelar" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {language === "es" ? "Eliminar" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}