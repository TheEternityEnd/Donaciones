import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Folio, Loan, Alert } from "../data/mockData";
import { storage } from "../components/data/Storage";

interface DataContextType {
  folios: Folio[];
  loans: Loan[];
  alerts: Alert[];
  addFolio: (folio: Folio) => void;
  updateLoanStatus: (loanId: string, status: Loan["status"]) => void;
  updateFolioStatus: (folioId: string, status: Folio["status"]) => void;
  dismissAlert: (alertId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  inventario: any[];
  beneficiarios: any[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [folios, setFolios] = useState<Folio[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [searchQuery, setSearchQueryState] = useState("");
  const [loading, setLoading] = useState(true);
  const [inventario, setInventario] = useState<any[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<any[]>([]);

  const loadData = async (query = searchQuery) => {
    setLoading(true);
    try {
      const [historialRaw, prestamosActivos, prestamosMora, inventarioRaw, beneficiariosRaw] = await Promise.all([
        storage.getHistorial(query).catch(() => []),
        storage.getPrestamosActivos().catch(() => []),
        storage.getPrestamosEnMora().catch(() => []),
        storage.getInventarioOrtopedia().catch(() => []),
        storage.getBeneficiariosOrtopedia().catch(() => [])
      ]);

      // --- MAPEO DE FOLIOS HISTÓRICOS ---
      const mappedFolios: Folio[] = (historialRaw || []).map((d: any) => {
        const rawType = d.tipo_movimiento || d.Operacion || "";
        const esCompletado = d.estatus_folio_bool || d.estatus_folio === 'true' || d.Estatus_Folio === 'true' || d.estatus_folio === true;

        return {
          id: `F-${d.id_folio || d.Folio}`,
          timestamp: d.fecha_registro_formateada || (d.Fecha_Sistema ? new Date(d.Fecha_Sistema).toLocaleString('es-MX', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
          }) : "Sin fecha"),
          origin: (d.area_origen || d.Modulo || "Farmacia") as any,
          type: rawType as any,
          category: d.Categoria || d.categoria || "N/A",
          status: esCompletado ? "Completado" : "Pendiente",
          donor: d.Beneficiario && d.Beneficiario !== '-' ? d.Beneficiario : undefined,
          itemName: d.Articulo || d.nombre_item || "N/A",
          quantity: Number(d.Cant || d.cantidad || 0),
          userId: d.id_usuario_registra || d.Registrado_Por || 1,
          observations: d.observaciones_generales || "Sin observaciones",
          statusBool: esCompletado,
          Fecha_Caducidad: d.Fecha_Caducidad || null
        };
      });
      setFolios(mappedFolios);

      // --- MAPEO DE PRÉSTAMOS ACTIVOS ---
      const loansData: Loan[] = (prestamosActivos || []).map((d: any) => {
        const dueDate = d.fecha_hora_devolucion_pactada || d.Vencimiento_Prestamo ? new Date(d.fecha_hora_devolucion_pactada || d.Vencimiento_Prestamo) : new Date();
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let currentStatus = 'Activo';
        const estatusPrestamoStr = String(d.estatus_prestamo || d.Estado_Prestamo || "").toUpperCase();
        
        if (estatusPrestamoStr === 'DEVUELTO' || d.estatus_folio === 'false' || d.estatus_folio === false || d.Estatus_Folio === 'false') {
           currentStatus = 'Devuelto';
        } else if (diffDays < 0) {
           currentStatus = 'Vencido';
        }

        const fPrestamo = d.fecha_hora_prestamo || d.Fecha_Sistema;
        const stringLoanDate = fPrestamo ? new Date(fPrestamo).toLocaleDateString() : "Sin fecha";
        const stringReturnDate = d.fecha_hora_devolucion_pactada || d.Vencimiento_Prestamo ? dueDate.toLocaleDateString() : "Sin fecha";

        return {
          id: `F-${d.id_folio || d.Folio}`,
          folioId: `F-${d.id_folio || d.Folio}`,
          equipment: d.nombre_item || d.Articulo || "Desconocido",
          recipient: d.nombre_solicitante || d.Beneficiario || "Desconocido",
          loanDate: stringLoanDate,
          returnDate: stringReturnDate,
          status: currentStatus as any,
          daysRemaining: diffDays
        };
      });
      setLoans(loansData);

      // --- MAPEO DE ALERTAS EN MORA ---
      const newAlerts: Alert[] = (prestamosMora || []).map((prestamo: any, i: number) => {
        const idFolioReal = prestamo.Folio || prestamo.id_folio || i;
        return {
          id: `A-mora-${idFolioReal}-${i}`,
          type: "urgent" as const,
          title: "Préstamo Vencido",
          description: `El préstamo F-${idFolioReal} de ${prestamo.Articulo || prestamo.nombre_item || "Equipo"} a ${prestamo.Beneficiario || prestamo.nombre_solicitante || "Beneficiario"} está vencido.`,
          timestamp: new Date().toISOString().split('T')[0],
          actionRequired: true,
        };
      });
      setAlerts(newAlerts);

      setInventario(inventarioRaw || []);
      setBeneficiarios(beneficiariosRaw || []);

    } catch (error) {
      console.error("Error loading data context:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("donationsUpdated", handleUpdate);
    return () => window.removeEventListener("donationsUpdated", handleUpdate);
  }, []);

  const handleSearchQueryChange = (query: string) => {
    setSearchQueryState(query);
    loadData(query);
  };

  const addFolio = (folio: Folio) => {};
  const updateLoanStatus = (loanId: string, status: Loan["status"]) => {};
  const updateFolioStatus = (folioId: string, status: Folio["status"]) => {};

  const dismissAlert = (alertId: string) => {
    setAlerts((prev: Alert[]) => prev.filter((alert: Alert) => alert.id !== alertId));
  };

  return (
    <DataContext.Provider
      value={{
        folios,
        loans,
        alerts,
        addFolio,
        updateLoanStatus,
        updateFolioStatus,
        dismissAlert,
        searchQuery,
        setSearchQuery: handleSearchQueryChange,
        loading,
        inventario,
        beneficiarios,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
}