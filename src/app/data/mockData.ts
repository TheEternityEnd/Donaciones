export interface Folio {
  id: string;
  timestamp: string;
  origin: string;
  type: string;
  category?: string;
  status: "Completado" | "Pendiente" | "En Proceso";
  donor?: string;
  itemName?: string;
  quantity?: number;
  userId?: number;
  observations?: string;
  statusBool?: boolean;
}

export interface Loan {
  id: string;
  folioId: string;
  equipment: string;
  recipient: string;
  loanDate: string;
  returnDate: string;
  status: "Activo" | "Vencido" | "Devuelto";
  daysRemaining: number;
}

export interface Alert {
  id: string;
  type: "warning" | "info" | "urgent";
  title: string;
  description: string;
  timestamp: string;
  actionRequired: boolean;
}

export const mockFolios: Folio[] = [
  {
    id: "F-2024-1245",
    timestamp: "2024-03-20 09:15",
    origin: "Farmacia",
    type: "Entrada",
    category: "Medicamentos",
    status: "Completado",
    donor: "Cruz Roja Internacional",
    itemName: "Antibióticos (Amoxicilina 500mg)",
    quantity: 200,
  },
  {
    id: "F-2024-1246",
    timestamp: "2024-03-20 10:30",
    origin: "Ortopedia",
    type: "Salida",
    category: "Equipos Médicos",
    status: "Pendiente",
    itemName: "Silla de Ruedas",
    quantity: 1,
  },
  {
    id: "F-2024-1247",
    timestamp: "2024-03-19 14:22",
    origin: "Farmacia",
    type: "Salida",
    category: "Medicamentos",
    status: "En Proceso",
    itemName: "Analgésicos (Paracetamol)",
    quantity: 50,
  },
  {
    id: "F-2024-1248",
    timestamp: "2024-03-19 11:05",
    origin: "Ortopedia",
    type: "Préstamo",
    category: "Equipos Médicos",
    status: "Completado",
    itemName: "Muletas Ajustables",
    quantity: 2,
  },
  {
    id: "F-2024-1249",
    timestamp: "2024-03-18 16:48",
    origin: "Farmacia",
    type: "Entrada",
    category: "Medicamentos",
    status: "Completado",
    donor: "Hospital Central",
    itemName: "Antiinflamatorios (Ibuprofeno)",
    quantity: 150,
  },
  {
    id: "F-2024-1250",
    timestamp: "2024-03-18 13:20",
    origin: "Ortopedia",
    type: "Entrada",
    category: "Equipos Médicos",
    status: "Completado",
    donor: "Donación Anónima",
    itemName: "Andadores para Adultos",
    quantity: 3,
  },
  {
    id: "F-2024-1251",
    timestamp: "2024-03-17 09:55",
    origin: "Farmacia",
    type: "Salida",
    category: "Medicamentos",
    status: "Completado",
    itemName: "Antihipertensivos",
    quantity: 30,
  },
  {
    id: "F-2024-1252",
    timestamp: "2024-03-17 08:10",
    origin: "Ortopedia",
    type: "Salida",
    category: "Equipos Médicos",
    status: "Pendiente",
    itemName: "Bastón de Apoyo",
    quantity: 1,
  },
];

export const mockLoans: Loan[] = [
  {
    id: "L-402",
    folioId: "F-2024-1248",
    equipment: "Muletas Ajustables",
    recipient: "María González",
    loanDate: "2024-03-19",
    returnDate: "2024-03-15",
    status: "Vencido",
    daysRemaining: -5,
  },
  {
    id: "L-403",
    folioId: "F-2024-1240",
    equipment: "Silla de Ruedas Estándar",
    recipient: "Carlos Méndez",
    loanDate: "2024-03-18",
    returnDate: "2024-03-25",
    status: "Activo",
    daysRemaining: 5,
  },
  {
    id: "L-404",
    folioId: "F-2024-1235",
    equipment: "Andador con Frenos",
    recipient: "Ana Ramírez",
    loanDate: "2024-03-16",
    returnDate: "2024-03-30",
    status: "Activo",
    daysRemaining: 10,
  },
  {
    id: "L-405",
    folioId: "F-2024-1230",
    equipment: "Muletas Pediátricas",
    recipient: "Luis Torres",
    loanDate: "2024-03-15",
    returnDate: "2024-03-22",
    status: "Activo",
    daysRemaining: 2,
  },
];

export const mockAlerts: Alert[] = [
  {
    id: "A-001",
    type: "urgent",
    title: "Préstamo Vencido",
    description: "El préstamo #402 (Muletas) está vencido desde hace 5 días",
    timestamp: "2024-03-20",
    actionRequired: true,
  },
  {
    id: "A-002",
    type: "warning",
    title: "Solicitud de Salida Pendiente",
    description: "Farmacia requiere aprobación para salida de medicamentos (F-2024-1246)",
    timestamp: "2024-03-20",
    actionRequired: true,
  },
  {
    id: "A-003",
    type: "info",
    title: "Inventario Bajo",
    description: "Stock de Paracetamol por debajo del mínimo (15 unidades)",
    timestamp: "2024-03-19",
    actionRequired: false,
  },
  {
    id: "A-004",
    type: "warning",
    title: "Medicamentos Próximos a Vencer",
    description: "12 lotes de medicamentos vencen en los próximos 30 días",
    timestamp: "2024-03-18",
    actionRequired: true,
  },
];

export const kpiData = {
  totalEntriesMonth: 45,
  pendingOutflows: {
    pharmacy: 3,
    orthopedics: 2,
  },
  activeLoans: 12,
  expiringSupplies: 8,
};
