import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useTheme } from "../contexts/ThemeContext";
import { Folio } from "../data/mockData";
import { toast } from "sonner";
import { API_URL } from "./data/Storage";

interface EditDonationDialogProps {
  folio: Folio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const translations = {
  es: {
    title: "Editar Registro de Donación",
    itemName: "Nombre del Artículo",
    quantity: "Cantidad",
    origin: "Área de Origen",
    donor: "Donante",
    save: "Guardar Cambios",
    cancel: "Cancelar",
    success: "Registro actualizado exitosamente",
    error: "Error al actualizar registro",
  },
  en: {
    title: "Edit Donation Registry",
    itemName: "Item Name",
    quantity: "Quantity",
    origin: "Origin Area",
    donor: "Donor",
    save: "Save Changes",
    cancel: "Cancel",
    success: "Registry updated successfully",
    error: "Error updating registry",
  },
};

export function EditDonationDialog({ folio, open, onOpenChange }: EditDonationDialogProps) {
  const { language } = useTheme();
  const t = translations[language];

  const [formData, setFormData] = useState({
    itemName: "",
    quantity: 1,
    origin: "",
    donor: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (folio && open) {
      // Helper function to extract donor robustly
      const extractDonor = (f: Folio) => {
        const obs = f.observations || "";
        const match = obs.match(/donante:\s*(.*)/i);
        if (match && match[1].trim() !== "") return match[1].trim();
        if (f.type === "ENTRADA" || (f as any).Operacion === "ENTRADA") return obs.trim();
        return "";
      };

      setFormData({
        itemName: folio.itemName || "",
        quantity: folio.quantity || 1,
        origin: folio.origin || "Farmacia",
        donor: extractDonor(folio) !== "No especificado" ? extractDonor(folio) : "",
      });
    }
  }, [folio, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio) return;
    
    setLoading(true);
    try {
      const idStr = folio.id.replace('F-', '');
      const response = await fetch(`${API_URL}/actualizar/${idStr}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area_origen: formData.origin,
          nombre_item: formData.itemName,
          cantidad: formData.quantity,
          observaciones_generales: formData.donor ? `Donante: ${formData.donor}` : "Sin observaciones",
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      toast.success(t.success);
      window.dispatchEvent(new Event("donationsUpdated"));
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription className="sr-only">Edita los detalles del folio seleccionado.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="itemName">{t.itemName}</Label>
            <Input
              id="itemName"
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">{t.quantity}</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="origin">{t.origin}</Label>
            <Select 
              value={formData.origin} 
              onValueChange={(value) => setFormData({ ...formData, origin: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Farmacia">Farmacia</SelectItem>
                <SelectItem value="Ortopedia">Ortopedia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="donor">{t.donor} (Opcional)</Label>
            <Input
              id="donor"
              value={formData.donor}
              onChange={(e) => setFormData({ ...formData, donor: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "..." : t.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
