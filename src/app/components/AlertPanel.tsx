import { AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert } from "../data/mockData";
import { useTheme } from "../contexts/ThemeContext";
import { useData } from "../contexts/DataContext";
import { Button } from "./ui/button";
import { useNavigate } from "react-router";

interface AlertPanelProps {
  alerts: Alert[];
}

const translations = {
  es: {
    title: "Acciones Requeridas",
    actionRequired: "Acción Requerida",
    dismiss: "Descartar",
  },
  en: {
    title: "Action Required",
    actionRequired: "Action Required",
    dismiss: "Dismiss",
  },
};

export function AlertPanel({ alerts }: AlertPanelProps) {
  const { language } = useTheme();
  const { dismissAlert } = useData();
  const navigate = useNavigate();
  const t = translations[language];

  const getAlertIcon = (type: Alert["type"] | "critical_info") => {
    switch (type) {
      case "urgent":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "critical_info":
        return <AlertCircle className="w-5 h-5 text-purple-500" />;
    }
  };

  const getAlertBadgeColor = (type: Alert["type"] | "critical_info") => {
    switch (type) {
      case "urgent":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "warning":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "info":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "critical_info":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t.title}</h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
        {alerts.map((alert) => (
          <div key={alert.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative group">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissAlert(alert.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">{alert.title}</h4>
                  {alert.actionRequired && (
                    <Badge className={`text-xs ${getAlertBadgeColor(alert.type)}`}>{t.actionRequired}</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{alert.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-500">{alert.timestamp}</p>
                  {(alert as any).actionPath && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-7 px-3 border-[#1798BC] text-[#1798BC] hover:bg-[#1798BC] hover:text-white"
                      onClick={() => navigate((alert as any).actionPath)}
                    >
                      {(alert as any).actionText || "Resolver"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}