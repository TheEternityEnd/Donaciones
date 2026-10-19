import { FileBarChart, Download, Calendar, FileText, Loader2 } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { storage } from "../components/data/Storage";
import { VistaHistorialCompleto } from "./type";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const translations = {
  es: {
    title: "Generador de Reportes Médicos",
    subtitle: "Genere reportes personalizados en formato PDF",
    monthlyReport: "Reporte Mensual",
    monthlyDesc: "Resumen completo de entradas, salidas y préstamos del mes",
    annualReport: "Estadísticas Anuales",
    annualDesc: "Análisis comparativo anual de donaciones",
    outflowReport: "Log de Salidas",
    outflowDesc: "Registro detallado de todas las salidas aprobadas",
    customReport: "Reporte Personalizado",
    startDate: "Fecha de Inicio",
    endDate: "Fecha de Fin",
    selectArea: "Seleccionar Área",
    all: "Todas",
    pharmacy: "Farmacia",
    orthopedics: "Ortopedia",
    generate: "Generar Reporte",
    download: "Descargar",
    historyTitle: "Historial de Reportes",
  },
  en: {
    title: "Medical Reports Generator",
    subtitle: "Generate custom reports in PDF format",
    monthlyReport: "Monthly Report",
    monthlyDesc: "Complete summary of entries, exits, and loans for the month",
    annualReport: "Annual Statistics",
    annualDesc: "Comparative annual analysis of donations",
    outflowReport: "Outflow Log",
    outflowDesc: "Detailed record of all approved outflows",
    customReport: "Custom Report",
    startDate: "Start Date",
    endDate: "End Date",
    selectArea: "Select Area",
    all: "All",
    pharmacy: "Pharmacy",
    orthopedics: "Orthopedics",
    generate: "Generate Report",
    download: "Download",
    historyTitle: "Reports History",
  },
};

export function MedicalReports() {
  const { language } = useTheme();
  const t = translations[language];

  const [data, setData] = useState<VistaHistorialCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [area, setArea] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await storage.getHistorial();
        setData(result);
      } catch (error) {
        console.error("Error fetching historial:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generatePDF = (reportName: string, filteredData: VistaHistorialCompleto[]) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text(reportName, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total de registros: ${filteredData.length}`, 14, 36);

    // Table
    autoTable(doc, {
      startY: 40,
      head: [["Folio", "Fecha", "Operación", "Módulo", "Artículo", "Cant.", "Beneficiario"]],
      body: filteredData.map(d => [
        d.Folio,
        new Date(d.Fecha_Sistema).toLocaleDateString(),
        d.Operacion,
        d.Modulo,
        d.Articulo,
        d.Cant,
        d.Beneficiario || "-"
      ]),
      theme: 'grid',
      headStyles: { fillColor: [23, 152, 188] },
    });

    const filename = `${reportName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(filename);
  };

  const handleQuickReport = (reportType: string) => {
    if (loading) return;
    toast.info(
      language === "es" ? "Generando reporte..." : "Generating report...",
      { description: reportType }
    );

    let filtered = [...data];
    const currentDate = new Date();

    if (reportType === t.monthlyReport) {
      filtered = data.filter(d => {
        const itemDate = new Date(d.Fecha_Sistema);
        return itemDate.getMonth() === currentDate.getMonth() && itemDate.getFullYear() === currentDate.getFullYear();
      });
    } else if (reportType === t.annualReport) {
      filtered = data.filter(d => {
        const itemDate = new Date(d.Fecha_Sistema);
        return itemDate.getFullYear() === currentDate.getFullYear();
      });
    } else if (reportType === t.outflowReport) {
      filtered = data.filter(d => d.Operacion === 'SALIDA');
    }

    setTimeout(() => {
      generatePDF(reportType, filtered);
      toast.success(
        language === "es" ? "Reporte generado" : "Report generated",
        { description: language === "es" ? "PDF descargado exitosamente." : "PDF downloaded successfully." }
      );
    }, 500);
  };

  const handleCustomReport = () => {
    if (loading) return;
    if (!startDate || !endDate) {
      toast.error(language === "es" ? "Fechas inválidas" : "Invalid dates");
      return;
    }

    toast.info(language === "es" ? "Generando reporte..." : "Generating report...");

    let filtered = data.filter(d => {
      const itemDate = new Date(d.Fecha_Sistema);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    });

    if (area !== "all") {
      filtered = filtered.filter(d => 
        (area === "pharmacy" && d.Modulo.toLowerCase() === 'farmacia') || 
        (area === "orthopedics" && d.Modulo.toLowerCase() === 'ortopedia')
      );
    }

    setTimeout(() => {
      generatePDF(t.customReport, filtered);
      toast.success(
        language === "es" ? "Reporte personalizado generado" : "Custom report generated"
      );
    }, 500);
  };

  const handleHistoryDownload = (reportName: string) => {
    if (loading) return;
    toast.info(
      language === "es" ? "Generando histórico..." : "Generating history...",
      { description: reportName }
    );
    setTimeout(() => {
      generatePDF(reportName, data); // Uses general data to mock historical DL
      toast.success(
        language === "es" ? "Reporte generado" : "Report generated"
      );
    }, 500);
  };

  const reportTypes = [
    {
      title: t.monthlyReport,
      description: t.monthlyDesc,
      icon: FileText,
      color: "#1798BC",
    },
    {
      title: t.annualReport,
      description: t.annualDesc,
      icon: FileBarChart,
      color: "#8B5CF6",
    },
    {
      title: t.outflowReport,
      description: t.outflowDesc,
      icon: Download,
      color: "#F59E0B",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          {t.title} 
          {loading && <Loader2 className="ml-3 w-5 h-5 animate-spin text-[#1798BC]" />}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t.subtitle}</p>
      </div>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportTypes.map((report, index) => (
          <Card key={index} className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: `${report.color}20` }}
            >
              <report.icon className="w-6 h-6" style={{ color: report.color }} />
            </div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{report.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{report.description}</p>
            <Button
              onClick={() => handleQuickReport(report.title)}
              disabled={loading}
              className="w-full bg-[#1798BC] hover:bg-[#147a9a] text-white gap-2"
            >
              <Download className="w-4 h-4" />
              {t.download} PDF
            </Button>
          </Card>
        ))}
      </div>

      {/* Custom Report Generator */}
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#1798BC]/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[#1798BC]" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{t.customReport}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Configure los parámetros del reporte</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="startDate">{t.startDate}</Label>
            <Input 
              type="date" 
              id="startDate" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">{t.endDate}</Label>
            <Input 
              type="date" 
              id="endDate" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area">{t.selectArea}</Label>
            <select
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1798BC]"
            >
              <option value="all">{t.all}</option>
              <option value="pharmacy">{t.pharmacy}</option>
              <option value="orthopedics">{t.orthopedics}</option>
            </select>
          </div>
        </div>

        <Button
          onClick={handleCustomReport}
          disabled={loading}
          className="w-full md:w-auto bg-[#1798BC] hover:bg-[#147a9a] text-white gap-2"
        >
          <FileBarChart className="w-4 h-4" />
          {t.generate}
        </Button>
      </Card>

      {/* Recent Reports History */}
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">{t.historyTitle}</h3>
        <div className="space-y-3">
          {[
            { name: "Reporte Mensual - Marzo 2024", date: "2024-03-20", size: "245 KB" },
            { name: "Log de Salidas - Q1 2024", date: "2024-03-15", size: "189 KB" },
            { name: "Estadísticas Anuales 2023", date: "2024-03-10", size: "412 KB" },
          ].map((report, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{report.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {report.date} • {report.size}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleHistoryDownload(report.name)}
                disabled={loading}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {t.download}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}