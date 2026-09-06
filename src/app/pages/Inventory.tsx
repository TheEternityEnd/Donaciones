import { Package, AlertCircle, TrendingDown, TrendingUp, Loader2 } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { useTheme } from "../contexts/ThemeContext";
import { useState, useEffect } from "react";
import { storage } from "../components/data/Storage";
import { InventarioItem } from "./type";

const translations = {
  es: {
    title: "Inventario General",
    pharmacy: "Farmacia",
    orthopedics: "Ortopedia",
    category: "Categoría",
    stock: "Stock Actual",
    minimum: "Mínimo",
    status: "Estado",
    normal: "Normal",
    low: "Bajo",
    critical: "Crítico",
    lastUpdate: "Última actualización",
  },
  en: {
    title: "General Inventory",
    pharmacy: "Pharmacy",
    orthopedics: "Orthopedics",
    category: "Category",
    stock: "Current Stock",
    minimum: "Minimum",
    status: "Status",
    normal: "Normal",
    low: "Low",
    critical: "Critical",
    lastUpdate: "Last updated",
  },
};

const inventoryData = [
  { name: "Antibióticos", category: "Farmacia", stock: 150, minimum: 50, status: "normal" },
  { name: "Analgésicos", category: "Farmacia", stock: 15, minimum: 30, status: "critical" },
  { name: "Antiinflamatorios", category: "Farmacia", stock: 85, minimum: 40, status: "normal" },
  { name: "Sillas de Ruedas", category: "Ortopedia", stock: 8, minimum: 5, status: "normal" },
  { name: "Muletas", category: "Ortopedia", stock: 12, minimum: 10, status: "low" },
  { name: "Andadores", category: "Ortopedia", stock: 6, minimum: 8, status: "critical" },
  { name: "Antihipertensivos", category: "Farmacia", stock: 45, minimum: 30, status: "normal" },
  { name: "Bastones", category: "Ortopedia", stock: 18, minimum: 12, status: "normal" },
];

export function Inventory() {
  const { language } = useTheme();
  const t = translations[language];

  const [data, setData] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await storage.getInventario();
        setData(result);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Error fetching inventory data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCalculatedStatus = (stock: number, minimum: number) => {
    const stockNum = Number(stock);
    const minNum = Number(minimum);
    if (stockNum <= minNum / 2) return "critical";
    if (stockNum <= minNum) return "low";
    return "normal";
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      normal: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      low: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return <Badge className={styles[status as keyof typeof styles] || styles.normal}>{t[status as keyof typeof t] || status}</Badge>;
  };

  const getStockPercentage = (stock: number, minimum: number) => {
    const stockNum = Number(stock);
    const minNum = Number(minimum);
    return Math.min((stockNum / (minNum * 2)) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.lastUpdate}: {lastUpdate.toLocaleDateString()} {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-[#1798BC] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.map((item, index) => {
            const status = getCalculatedStatus(item.stock, item.minimum);
            return (
              <Card key={index} className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1798BC]/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-[#1798BC]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.category}</p>
                    </div>
                  </div>
                  {getStatusBadge(status)}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t.stock}:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{item.stock} unidades</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t.minimum}:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{item.minimum} unidades</span>
                  </div>

                  <Progress value={getStockPercentage(item.stock, item.minimum)} className="h-2" />

                  {status === "critical" && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <p className="text-xs text-red-700 dark:text-red-400">Stock por debajo del mínimo requerido</p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
