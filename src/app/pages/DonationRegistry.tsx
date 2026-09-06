import { FileText, Calendar, User, Package, Trash2, Pencil } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useTheme } from "../contexts/ThemeContext";
import { FolioDetailDialog } from "../components/FolioDetailDialog";
import { EditDonationDialog } from "../components/EditDonationDialog";
import { useState } from "react";
import { useData } from "../contexts/DataContext";
import { API_URL } from "../components/data/Storage";
import { toast } from "sonner";
import { Folio } from "../data/mockData"; // 🌟 Importamos explícitamente el tipo Folio

const translations = {
  es: {
    title: "Registro de Donaciones",
    subtitle: "Sistema de folios para control de entradas",
    viewDetails: "Ver Detalles",
    donor: "Donante",
    date: "Fecha",
    items: "Artículos",
    area: "Área",
  },
  en: {
    title: "Donation Registry",
    subtitle: "Folio system for entry control",
    viewDetails: "View Details",
    donor: "Donor",
    date: "Date",
    items: "Items",
    area: "Area",
  },
};

export function DonationRegistry() {
  const { language } = useTheme();
  const t = translations[language];
  const { folios, loading, searchQuery } = useData();
  const [selectedFolio, setSelectedFolio] = useState<Folio | null>(null); // 🌟 Tipado correcto para evitar el tipo 'any'
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // 🛡️ [ROBUSTO]: Mapeo de donantes tolerante a variaciones de base de datos
  const obtenerDonante = (folioObj: Folio): string => {
    const observaciones = folioObj.observations || (folioObj as any).observaciones_generales || "";
    const beneficiario = folioObj.donor || (folioObj as any).Beneficiario || (folioObj as any).recipient || "";
    
    if (beneficiario && beneficiario !== "-") return beneficiario;
    if (!observaciones) return "No especificado";

    const regexDonante = /donante:\s*(.*)/i;
    const coincidencia = observaciones.match(regexDonante);
    if (coincidencia && coincidencia[1].trim() !== "") return coincidencia[1].trim();

    const operacion = (folioObj.type || (folioObj as any).Operacion || "").toUpperCase();
    if (operacion === "ENTRADA") return observaciones.trim();
    
    return "No especificado";
  };

  // Filtrado seguro tipado con la interfaz del contexto
  const donations = (folios || [])
    .filter((d: Folio) => {
      const operacion = (d.type || (d as any).Operacion || "").toUpperCase();
      return operacion === "ENTRADA";
    })
    .filter((d: Folio) => {
      if (!searchQuery) return true;
      const term = searchQuery.toLowerCase();
      const donante = obtenerDonante(d).toLowerCase();
      const idStr = String(d.id || (d as any).Folio || "").toLowerCase();
      const articuloStr = String(d.itemName || (d as any).Articulo || "").toLowerCase();
      
      return idStr.includes(term) || articuloStr.includes(term) || donante.includes(term);
    });

  const handleViewDetails = (folio: Folio) => {
    setSelectedFolio(folio);
    setDetailsOpen(true);
  };

  const handleEdit = (folio: Folio) => {
    setSelectedFolio(folio);
    setEditOpen(true);
  };

  const handleDeletePrompt = (folio: Folio) => {
    setSelectedFolio(folio);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedFolio) return;
    try {
      const origId = selectedFolio.id || (selectedFolio as any).Folio;
      const idStr = String(origId).replace("F-", "");
      const res = await fetch(`${API_URL}/eliminar/${idStr}`, { method: "DELETE" }); // 🌟 Ajustado a ruta directa simplificada del proxy
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(language === "es" ? "Registro eliminado" : "Registry deleted");
      window.dispatchEvent(new Event("donationsUpdated"));
    } catch (e) {
      toast.error(language === "es" ? "Error al eliminar" : "Error deleting");
    } finally {
      document.body.style.pointerEvents = "auto";
      setDeleteOpen(false);
    }
  };

  // Helper seguro para formatear fechas sin arriesgar cierres inesperados por split
  const formatearFecha = (dObj: Folio) => {
    const rawDate = dObj.timestamp || (dObj as any).Fecha_Sistema || "";
    if (!rawDate) return "Sin fecha";
    return rawDate.includes("T") ? rawDate.split("T")[0] : rawDate.split(" ")[0];
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Cargando historial de donaciones...
            </div>
          ) : donations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No hay donaciones registradas.
            </div>
          ) : (
            donations.map((donation: Folio) => {
              const currentId = donation.id || (donation as any).Folio;
              const currentModulo = donation.origin || (donation as any).Modulo || "Donaciones";
              const currentCantidad = donation.quantity || (donation as any).Cant || 0;

              return (
                <Card key={currentId} className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-[#1798BC]/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-[#1798BC]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-mono font-semibold text-lg text-gray-900 dark:text-white">
                            {currentId.startsWith("F-") ? currentId : `F-${currentId}`}
                          </h3>
                          <Badge className="bg-[#1798BC]/10 text-[#1798BC] border-[#1798BC]/20">
                            {currentModulo}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          {obtenerDonante(donation) !== "No especificado" && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <User className="w-4 h-4" />
                              <span>
                                {t.donor}: <span className="font-medium text-gray-900 dark:text-white">{obtenerDonante(donation)}</span>
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {t.date}: <span className="font-medium text-gray-900 dark:text-white">{formatearFecha(donation)}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Package className="w-4 h-4" />
                            <span>
                              {t.items}:{" "}
                              <span className="font-medium text-gray-900 dark:text-white">{currentCantidad} u.</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        onClick={() => handleViewDetails(donation)}
                        variant="outline" 
                        size="sm"
                      >
                        {t.viewDetails}
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleEdit(donation)}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:hover:bg-amber-900/40"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => handleDeletePrompt(donation)}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:hover:bg-red-900/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <FolioDetailDialog 
        folio={selectedFolio} 
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