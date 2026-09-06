import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useData } from "../contexts/DataContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { Folio } from "../data/mockData";
import { storage } from "./data/Storage";

interface NewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const translations = {
  es: {
    title: "Registrar Nueva Entrada",
    origin: "Área de Origen",
    pharmacy: "Farmacia",
    orthopedics: "Ortopedia",
    type: "Tipo de Transacción",
    entrance: "Entrada",
    exit: "Salida",
    loan: "Préstamo",
    category: "Categoría",
    medicines: "Medicamentos",
    equipment: "Equipos Médicos",
    itemName: "Nombre del Artículo",
    quantity: "Cantidad",
    donor: "Donante (opcional)",
    cancel: "Cancelar",
    register: "Registrar",
    success: "Entrada registrada exitosamente",
    folioGenerated: "Folio generado:",
  },
  en: {
    title: "Register New Entry",
    origin: "Origin Area",
    pharmacy: "Pharmacy",
    orthopedics: "Orthopedics",
    type: "Transaction Type",
    entrance: "Entrance",
    exit: "Exit",
    loan: "Loan",
    category: "Category",
    medicines: "Medicines",
    equipment: "Medical Equipment",
    itemName: "Item Name",
    quantity: "Quantity",
    donor: "Donor (optional)",
    cancel: "Cancel",
    register: "Register",
    success: "Entry registered successfully",
    folioGenerated: "Folio generated:",
  },
};

export function NewEntryDialog({ open, onOpenChange }: NewEntryDialogProps) {
  const { addFolio, inventario: ortopediaItems, beneficiarios: ortopediaBeneficiarios } = useData();
  const { language } = useTheme();
  const { user } = useAuth();
  const t = translations[language];

  if (!user) return null;

  const [formData, setFormData] = useState({
    origin: "Farmacia" as "Farmacia" | "Ortopedia",
    type: "Entrada" as "Entrada" | "Salida",
    category: "",
    itemName: "",
    idItemExterno: null as number | null,
    quantity: "",
    donor: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await storage.registrarMovimiento({
        folio: {
          tipo_movimiento: formData.type.toUpperCase() as "ENTRADA" | "SALIDA" | "PRESTAMO",
          area_origen: formData.origin,
          id_usuario_registra: user.id_usuario,
          observaciones_generales: formData.donor ? `Donante: ${formData.donor}` : undefined,
          estatus_folio: "true",
        },
        detalle: {
          id_folio: 0,
          categoria: formData.category ? (formData.category as any) : (formData.origin === "Farmacia" ? "MEDICAMENTO" : "EQUIPO"),
          nombre_item: formData.itemName,
          id_item_externo: formData.idItemExterno || undefined,
          cantidad: parseInt(formData.quantity),
        }
      });

      if (response.success) {
        toast.success(t.success, {
          description: `${t.folioGenerated} F-${response.id_folio}`,
        });

        // Trigger an event so registries can reload
        window.dispatchEvent(new Event("donationsUpdated"));

        // Reset form
        setFormData({
          origin: "Farmacia",
          type: "Entrada",
          category: "",
          itemName: "",
          idItemExterno: null,
          quantity: "",
          donor: "",
        });

        onOpenChange(false);
      } else {
        toast.error("Error en registro", { description: "No se pudo guardar la entrada" });
      }
    } catch (error) {
      console.error("Error registrando movimiento:", error);
      toast.error("Error del Servidor", { description: "Hubo un problema al contactar con la base de datos." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <div>
          <DialogHeader>
            <DialogTitle>{t.title}</DialogTitle>
            <DialogDescription className="sr-only">
              Completa el formulario para registrar una nueva entrada, salida o préstamo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="origin">{t.origin}</Label>
                <select
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value as "Farmacia" | "Ortopedia" })}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="Farmacia">{t.pharmacy}</option>
                  <option value="Ortopedia">{t.orthopedics}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">{t.type}</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as "Entrada" | "Salida" })}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="Entrada">{t.entrance}</option>
                  <option value="Salida">{t.exit}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemName">{t.itemName}</Label>
                {formData.origin === "Ortopedia" ? (
                  <select
                    id="itemName"
                    value={formData.idItemExterno || ""}
                    onChange={(e) => {
                      const selectedId = parseInt(e.target.value);
                      const selectedItem = ortopediaItems.find(i => i.id_articulo === selectedId);
                      setFormData({ 
                        ...formData, 
                        idItemExterno: selectedId, 
                        itemName: selectedItem ? selectedItem.nombre : "" 
                      });
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="" disabled>Selecciona un artículo</option>
                    {ortopediaItems.map(item => (
                      <option key={item.id_articulo} value={item.id_articulo}>
                        {item.nombre} (Stock: {item.stock || 0})
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="itemName"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    placeholder="Ej: Antibióticos (Amoxicilina 500mg)"
                    required
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">{t.quantity}</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>

              {formData.type === "Entrada" && (
                <div className="space-y-2">
                  <Label htmlFor="donor">{t.donor}</Label>
                  <Input
                    id="donor"
                    value={formData.donor}
                    onChange={(e) => setFormData({ ...formData, donor: e.target.value })}
                    placeholder="Ej: Cruz Roja Internacional"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t.cancel}
              </Button>
              <Button type="submit" className="bg-[#1798BC] hover:bg-[#147a9a] text-white">
                {t.register}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
