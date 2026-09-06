import { TrendingUp, AlertTriangle, Users, Package } from "lucide-react";
import { KPICard } from "../components/KPICard";
import { FolioTable } from "../components/FolioTable";
import { AlertPanel } from "../components/AlertPanel";
import { useTheme } from "../contexts/ThemeContext";
import { useData } from "../contexts/DataContext";

const translations = {
  es: {
    totalEntries: "Entradas del Mes",
    pendingOutflows: "Salidas Pendientes",
    activeLoans: "Préstamos Activos",
    expiringSupplies: "Insumos por Vencer",
    pharmacyOrthopedics: "Farm./Ortop.",
  },
  en: {
    totalEntries: "Monthly Entries",
    pendingOutflows: "Pending Outflows",
    activeLoans: "Active Loans",
    expiringSupplies: "Expiring Supplies",
    pharmacyOrthopedics: "Pharm./Orth.",
  },
};

export function Dashboard() {
  const { language } = useTheme();
  const t = translations[language];

  const { folios, loans, inventario, loading } = useData();

  // Generar alertas dinámicas
  const dynamicAlerts: any[] = [];
  
  loans.forEach((loan) => {
    if (loan.status === 'Vencido' || loan.daysRemaining < 0) {
      dynamicAlerts.push({
        id: `mora-${loan.id}`,
        type: "urgent",
        priority: 1,
        title: language === "es" ? "Préstamo en Mora" : "Overdue Loan",
        description: language === "es" 
          ? `El préstamo ${loan.id} de ${loan.equipment} a ${loan.recipient} está vencido.`
          : `Loan ${loan.id} of ${loan.equipment} to ${loan.recipient} is overdue.`,
        timestamp: loan.returnDate,
        actionRequired: true,
        actionPath: "/loans",
        actionText: language === "es" ? "Ver Préstamos" : "View Loans"
      });
    } else if (loan.daysRemaining >= 0 && loan.daysRemaining <= 3 && loan.status !== 'Devuelto') {
      dynamicAlerts.push({
        id: `vencer-${loan.id}`,
        type: "warning",
        priority: 3,
        title: language === "es" ? "Préstamo por Vencer" : "Expiring Loan",
        description: language === "es" 
          ? `El préstamo ${loan.id} de ${loan.equipment} vence en ${loan.daysRemaining} días.`
          : `Loan ${loan.id} of ${loan.equipment} expires in ${loan.daysRemaining} days.`,
        timestamp: loan.returnDate,
        actionRequired: true,
        actionPath: "/loans",
        actionText: language === "es" ? "Ver Préstamos" : "View Loans"
      });
    }
  });

  if (inventario) {
    inventario.forEach((item) => {
      const stock = item.cantidad_disponible !== undefined ? item.cantidad_disponible : (item.stock || 0);
      if (stock <= 0) {
        dynamicAlerts.push({
          id: `stock-${item.id_articulo}`,
          type: "urgent",
          priority: 2,
          title: language === "es" ? "Desabasto Total" : "Out of Stock",
          description: language === "es"
            ? `El artículo ${item.nombre} se ha quedado sin stock.`
            : `Item ${item.nombre} is out of stock.`,
          timestamp: new Date().toLocaleDateString(),
          actionRequired: true,
          actionPath: "/inventory",
          actionText: language === "es" ? "Ir a Inventario" : "Go to Inventory"
        });
      } else if (stock < 5) {
        dynamicAlerts.push({
          id: `reorden-${item.id_articulo}`,
          type: "warning",
          priority: 4,
          title: language === "es" ? "Punto de Reorden" : "Reorder Point",
          description: language === "es"
            ? `El artículo ${item.nombre} cuenta con stock bajo (${stock} unidades).`
            : `Item ${item.nombre} has low stock (${stock} units).`,
          timestamp: new Date().toLocaleDateString(),
          actionRequired: true,
          actionPath: "/inventory",
          actionText: language === "es" ? "Revisar Stock" : "Check Stock"
        });
      }
    });
  }

  if (folios) {
    const now = new Date();
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(now.getDate() + 60);

    folios.forEach((folio) => {
      if (folio.origin === 'Farmacia' && folio.type === 'ENTRADA' && (folio as any).Fecha_Caducidad) {
        const caducidad = new Date((folio as any).Fecha_Caducidad);
        if (caducidad <= sixtyDaysFromNow) {
          const diffDays = Math.ceil((caducidad.getTime() - now.getTime()) / (1000 * 3600 * 24));
          dynamicAlerts.push({
            id: `caducidad-${folio.id}`,
            type: "critical_info",
            priority: diffDays <= 0 ? 0 : 5,
            title: language === "es" ? "Caducidad Próxima" : "Expiring Soon",
            description: language === "es"
              ? `El lote del folio ${folio.id} de ${folio.itemName} caduca en ${diffDays < 0 ? 0 : diffDays} días.`
              : `Batch from folio ${folio.id} of ${folio.itemName} expires in ${diffDays < 0 ? 0 : diffDays} days.`,
            timestamp: caducidad.toLocaleDateString(),
            actionRequired: true,
            actionPath: "/registry",
            actionText: language === "es" ? "Gestionar Salida" : "Manage Outflow"
          });
        }
      }
    });
  }

  // Ordenar de mayor prioridad (0, 1, 2) a menor prioridad (5)
  dynamicAlerts.sort((a, b) => a.priority - b.priority);

  // Cálculos de KPI basados en DataContext
  const currentMonthEntries = folios.filter(d => (d.type || '').toUpperCase() === 'ENTRADA').length;
  const pendingOutflowsCount = folios.filter(d => (d.type || '').toUpperCase() === 'SALIDA' && d.status === 'Pendiente').length;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title={t.totalEntries}
          value={loading ? "..." : currentMonthEntries}
          icon={TrendingUp}
          trend={{ value: "Mes actual", isPositive: true }}
          color="#1798BC"
        />
        <KPICard
          title={t.pendingOutflows}
          value={loading ? "..." : pendingOutflowsCount}
          icon={AlertTriangle}
          color="#F59E0B"
        />
        <KPICard title={t.activeLoans} value={loading ? "..." : loans.length} icon={Users} color="#8B5CF6" />
        <KPICard title={t.expiringSupplies} value={loading ? "..." : 0} icon={Package} color="#EF4444" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Central Log - Takes 2 columns */}
        <div className="lg:col-span-2">
          <FolioTable folios={folios} limit={6} />
        </div>

        {/* Alerts Panel - Takes 1 column */}
        <div className="lg:col-span-1">
          <AlertPanel alerts={dynamicAlerts} />
        </div>
      </div>
    </div>
  );
}