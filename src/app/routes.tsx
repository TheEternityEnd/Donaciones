import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Inventory } from "./pages/Inventory";
import { DonationRegistry } from "./pages/DonationRegistry";
import { OutflowRequests } from "./pages/OutflowRequests";
import { EquipmentLoans } from "./pages/EquipmentLoans";
import { MedicalReports } from "./pages/MedicalReports";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "inventory", Component: Inventory },
      { path: "registry", Component: DonationRegistry },
      { path: "outflow", Component: OutflowRequests },
      { path: "loans", Component: EquipmentLoans },
      { path: "reports", Component: MedicalReports },
    ],
  },
], {
  // 🌟 CONFIGURACIÓN CRUCIAL: Sincroniza el enrutador de React con la subruta de Nginx
  basename: "/donaciones"
});