import { Users, Calendar, AlertCircle, CheckCircle, Clock, Plus } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { storage } from "../components/data/Storage";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { KPICard } from "../components/KPICard";
import { TrendingUp, AlertTriangle } from "lucide-react";

const translations = {
  es: {
    title: "Préstamos de Equipos Médicos",
    subtitle: "Control de equipos en préstamo con fechas de retorno",
    equipment: "Equipo",
    recipient: "Beneficiario",
    loanDate: "Fecha de Préstamo",
    returnDate: "Fecha de Retorno",
    status: "Estado",
    daysRemaining: "días restantes",
    overdue: "días de retraso",
    markReturned: "Marcar como Devuelto",
    active: "Activo",
    overdueBadge: "Vencido",
    returned: "Devuelto",
    newLoan: "Nuevo Préstamo",
    selectBeneficiary: "Seleccionar Beneficiario",
    selectEquipment: "Seleccionar Equipo",
    expectedReturnDate: "Fecha Esperada de Retorno",
    cancel: "Cancelar",
    save: "Guardar Préstamo"
  },
  en: {
    title: "Medical Equipment Loans",
    subtitle: "Control of loaned equipment with return dates",
    equipment: "Equipment",
    recipient: "Recipient",
    loanDate: "Loan Date",
    returnDate: "Return Date",
    status: "Status",
    daysRemaining: "days remaining",
    overdue: "days overdue",
    markReturned: "Mark as Returned",
    active: "Active",
    overdueBadge: "Overdue",
    returned: "Returned",
    newLoan: "New Loan",
    selectBeneficiary: "Select Beneficiary",
    selectEquipment: "Select Equipment",
    expectedReturnDate: "Expected Return Date",
    cancel: "Cancel",
    save: "Save Loan"
  },
};

export function EquipmentLoans() {
  const { language } = useTheme();
  const t = translations[language];
  const { loans, loading, inventario, beneficiarios } = useData();
  const { user } = useAuth();

  if (!user) return null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // Calcular KPIs directamente del contexto (sin endpoints adicionales)
  const activeLoansCount = loans.filter(l => l.status === "Activo" || l.status === "Vencido").length;
  const overdueLoansCount = loans.filter(l => l.status === "Vencido").length;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const totalMonthLoans = loans.filter(l => {
    // Si la fecha es string "DD/MM/YYYY" o similar, la parseamos rudimentariamente para este demo.
    // Asumiremos que el mes actual es suficientemente bueno si filtramos por date.
    if (!l.loanDate) return false;
    // Basic check as Date objects or simple strings.
    const parts = l.loanDate.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      return month === currentMonth && year === currentYear;
    }
    return true; // fallback
  }).length;

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment || !selectedBeneficiary || !returnDate) {
      toast.error(language === "es" ? "Por favor completa todos los campos" : "Please fill all fields");
      return;
    }

    const eqId = parseInt(selectedEquipment, 10);
    const selectedEqObj = inventario.find((eq) => eq.id_articulo === eqId);
    if (!selectedEqObj) return;

    if (selectedEqObj.cantidad_disponible < 1) {
      toast.error(language === "es" ? "Inventario insuficiente" : "Insufficient inventory", {
        description: language === "es" ? "El equipo seleccionado no tiene stock disponible." : "Selected equipment is out of stock."
      });
      return;
    }

    try {
      const result = await storage.registrarMovimiento({
        folio: {
          tipo_movimiento: "PRESTAMO",
          area_origen: "Ortopedia",
          id_usuario_registra: user.id_usuario,
          observaciones_generales: "Préstamo de equipo médico",
          estatus_folio: "true"
        },
        detalle: {
          id_folio: 0,
          categoria: "EQUIPO",
          id_item_externo: selectedEqObj.id_articulo,
          nombre_item: selectedEqObj.nombre,
          cantidad: 1
        },
        prestamo: {
          id_folio: 0,
          nombre_solicitante: selectedBeneficiary,
          fecha_hora_prestamo: new Date(),
          fecha_hora_devolucion_pactada: new Date(returnDate),
          estatus_prestamo: "ACTIVO",
          compromiso_responsabilidad: true
        }
      });

      if (result.success) {
        toast.success(language === "es" ? "Préstamo registrado exitosamente" : "Loan registered successfully");
        setIsModalOpen(false);
        setSelectedBeneficiary("");
        setSelectedEquipment("");
        setReturnDate("");
        window.dispatchEvent(new Event("donationsUpdated"));
      } else {
        toast.error("Error", { description: "No se pudo registrar el préstamo" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", { description: "Error interno del servidor" });
    }
  };

  const handleMarkReturned = async (loanId: string, equipmentName: string) => {
    try {
      // Extraemos solo el número del folio "F-1234" -> 1234
      const idFolio = parseInt(loanId.replace("F-", ""), 10);
      const success = await storage.finalizarPrestamo(idFolio, "Devuelto en buen estado");

      if (success) {
        toast.success(language === "es" ? "Préstamo marcado como devuelto" : "Loan marked as returned", {
          description: language === "es"
            ? `${equipmentName} ha sido devuelto exitosamente.`
            : `${equipmentName} has been returned successfully.`,
        });
        window.dispatchEvent(new Event("donationsUpdated"));
      } else {
        toast.error("Error", { description: "No se pudo actualizar el préstamo" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error", { description: "Error interno del servidor" });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Activo: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      Vencido: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      Devuelto: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };
    const labels = {
      Activo: t.active,
      Vencido: t.overdueBadge,
      Devuelto: t.returned,
    };
    return <Badge className={styles[status as keyof typeof styles]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  const getDaysRemainingText = (days: number) => {
    if (days < 0) {
      return `${Math.abs(days)} ${t.overdue}`;
    }
    return `${days} ${t.daysRemaining}`;
  };

  const getProgressValue = (days: number) => {
    if (days < 0) return 100;
    const maxDays = 30;
    return Math.min(((maxDays - days) / maxDays) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t.subtitle}</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1798BC] hover:bg-[#147a9a] text-white gap-2 shadow-lg shadow-[#1798BC]/20 transition-all">
              <Plus className="w-4 h-4" />
              {t.newLoan}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-xl text-gray-900 dark:text-white">{t.newLoan}</DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400">
                {language === "es" ? "Registra un nuevo préstamo de equipo médico." : "Register a new medical equipment loan."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLoan} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="beneficiary" className="text-gray-700 dark:text-gray-300">{t.recipient}</Label>
                <Select value={selectedBeneficiary} onValueChange={setSelectedBeneficiary}>
                  <SelectTrigger id="beneficiary" className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue placeholder={t.selectBeneficiary} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {beneficiarios.map((b) => (
                      <SelectItem key={b.id_beneficiario} value={b.nombre_completo} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                        {b.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment" className="text-gray-700 dark:text-gray-300">{t.equipment}</Label>
                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger id="equipment" className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue placeholder={t.selectEquipment} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {inventario.map((eq) => {
                      const isDisabled = eq.cantidad_disponible <= 0 || !eq.cantidad_disponible;
                      return (
                        <SelectItem 
                          key={eq.id_articulo} 
                          value={eq.id_articulo.toString()} 
                          disabled={isDisabled}
                          className={`text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${isDisabled ? 'opacity-50' : ''}`}
                        >
                          {eq.nombre} (Disp: {eq.cantidad_disponible || 0})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="returnDate" className="text-gray-700 dark:text-gray-300">{t.expectedReturnDate}</Label>
                <Input
                  id="returnDate"
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  {t.cancel}
                </Button>
                <Button type="submit" className="bg-[#1798BC] hover:bg-[#147a9a] text-white">
                  {t.save}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tarjetas de KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title={language === "es" ? "Préstamos Activos" : "Active Loans"}
          value={loading ? "..." : activeLoansCount}
          icon={Users}
          color="#1798BC"
        />
        <KPICard
          title={language === "es" ? "Préstamos Vencidos" : "Overdue Loans"}
          value={loading ? "..." : overdueLoansCount}
          icon={AlertTriangle}
          color="#EF4444"
        />
        <KPICard
          title={language === "es" ? "Préstamos del Mes" : "Loans this Month"}
          value={loading ? "..." : totalMonthLoans}
          icon={TrendingUp}
          color="#8B5CF6"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Cargando préstamos...
          </div>
        ) : loans.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No hay préstamos registrados.
          </div>
        ) : (
          loans.map((loan) => (
            <Card key={loan.id} className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${loan.status === "Vencido"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-[#1798BC]/10 dark:bg-[#1798BC]/20"
                      }`}
                  >
                    {loan.status === "Vencido" ? (
                      <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    ) : (
                      <Users className="w-6 h-6 text-[#1798BC]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{loan.equipment}</h3>
                      {getStatusBadge(loan.status)}
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{loan.id}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{t.recipient}:</span>{" "}
                        <span className="text-gray-900 dark:text-white">{loan.recipient}</span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{t.loanDate}:</span>{" "}
                        <span className="text-gray-900 dark:text-white">{loan.loanDate}</span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{t.returnDate}:</span>{" "}
                        <span
                          className={
                            loan.daysRemaining < 0
                              ? "text-red-600 dark:text-red-400 font-semibold"
                              : "text-gray-900 dark:text-white"
                          }
                        >
                          {loan.returnDate}
                        </span>
                      </div>
                    </div>

                    {loan.status !== "Devuelto" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span
                            className={
                              loan.daysRemaining < 0
                                ? "text-red-600 dark:text-red-400 font-semibold"
                                : "text-gray-600 dark:text-gray-400"
                            }
                          >
                            {getDaysRemainingText(loan.daysRemaining)}
                          </span>
                          {loan.daysRemaining >= 0 && loan.daysRemaining <= 3 && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <Clock className="w-3 h-3 mr-1" />
                              Próximo a vencer
                            </Badge>
                          )}
                        </div>
                        <Progress
                          value={getProgressValue(loan.daysRemaining)}
                          className={loan.daysRemaining < 0 ? "bg-red-200 dark:bg-red-900/30" : ""}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {loan.status !== "Devuelto" && (
                  <Button
                    onClick={() => handleMarkReturned(loan.id, loan.equipment)}
                    className="bg-[#1798BC] hover:bg-[#147a9a] text-white gap-2 flex-shrink-0"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t.markReturned}
                  </Button>
                )}
              </div>
            </Card>
          )))}
      </div>
    </div>
  );
}