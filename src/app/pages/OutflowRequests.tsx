import { ArrowRightLeft, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useTheme } from "../contexts/ThemeContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { storage } from "../components/data/Storage";
import { VistaHistorialCompleto } from "./type";
import { useData } from "../contexts/DataContext";

const translations = {
  es: {
    title: "Solicitudes de Salida",
    subtitle: "Gestión de solicitudes de farmacia y ortopedia",
    approve: "Aprobar",
    reject: "Rechazar",
    requestedBy: "Solicitado por",
    requestDate: "Fecha de Solicitud",
    quantity: "Cantidad",
    reason: "Detalle",
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Rechazado",
  },
  en: {
    title: "Outflow Requests",
    subtitle: "Management of pharmacy and orthopedics requests",
    approve: "Approve",
    reject: "Reject",
    requestedBy: "Requested by",
    requestDate: "Request Date",
    quantity: "Quantity",
    reason: "Detail",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
  },
};

export function OutflowRequests() {
  const { language } = useTheme();
  const t = translations[language];
  const { inventario: ortopediaStock } = useData();
  const [requestsList, setRequestsList] = useState<VistaHistorialCompleto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await storage.getSolicitudes();
      setRequestsList(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const mapStatusFrontend = (req: VistaHistorialCompleto) => {
    // If it's explicitly 'false' in Estatus_Folio, it is still pending
    if ((req as any).Estatus_Folio === 'false') return "pending";
    if (req.Estado_Prestamo === 'PENDIENTE') return "pending";
    if (req.Estado_Prestamo === 'ACTIVO' || req.Estado_Prestamo === 'DEVUELTO') return "approved";
    if (req.Estado_Prestamo === 'CANCELADO' || req.Estado_Prestamo === 'RECHAZADO') return "rejected";
    if (req.Operacion === 'SALIDA') return "approved";
    return "pending";
  };

  const handleApprove = async (folioId: number) => {
    try {
      const success = await storage.actualizarSolicitud(folioId, 'ACTIVO');
      if (success) {
        setRequestsList((prev) =>
          prev.map((req) => (req.Folio === folioId ? { ...req, Estado_Prestamo: "ACTIVO" } : req))
        );
        toast.success(language === "es" ? "Solicitud aprobada" : "Request approved", {
          description: language === "es"
            ? `La solicitud (Folio: ${folioId}) ha sido aprobada exitosamente.`
            : `Request (Folio: ${folioId}) has been approved successfully.`,
        });
      }
    } catch (error) {
      toast.error(language === "es" ? "Error al aprobar" : "Error approving request");
    }
  };

  const handleReject = async (folioId: number) => {
    try {
      const success = await storage.actualizarSolicitud(folioId, 'CANCELADO');
      if (success) {
        setRequestsList((prev) =>
          prev.map((req) => (req.Folio === folioId ? { ...req, Estado_Prestamo: "CANCELADO" } : req))
        );
        toast.error(language === "es" ? "Solicitud rechazada" : "Request rejected", {
          description: language === "es"
            ? `La solicitud (Folio: ${folioId}) ha sido rechazada.`
            : `Request (Folio: ${folioId}) has been rejected.`,
        });
      }
    } catch (error) {
      toast.error(language === "es" ? "Error al rechazar" : "Error rejecting request");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return <Badge className={styles[status as keyof typeof styles]}>{t[status as keyof typeof t]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          {t.title}
          {loading && <Loader2 className="ml-3 w-5 h-5 animate-spin text-[#1798BC]" />}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading && requestsList.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1798BC]" />
            <span className="ml-3 text-gray-500">Cargando solicitudes...</span>
          </div>
        )}
        {requestsList.length === 0 && !loading && (
          <p className="text-gray-500 text-center py-8">
            {language === "es" ? "No hay solicitudes pendientes o recientes." : "No pending or recent requests."}
          </p>
        )}
        {requestsList.map((request) => {
          const frontStatus = mapStatusFrontend(request);

          let stockInfo = null;
          if (request.Modulo === 'Ortopedia') {
            const item = ortopediaStock.find(i => i.nombre === request.Articulo || i.id_articulo === (request as any).id_item_externo);
            if (item) {
              stockInfo = item.stock || item.cantidad_disponible || 0;
            }
          }

          return (
            <Card key={`REQ-${request.Folio}`} className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-[#1798BC]/10 flex items-center justify-center flex-shrink-0">
                    <ArrowRightLeft className="w-6 h-6 text-[#1798BC]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{request.Articulo}</h3>
                      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {request.Modulo}
                      </Badge>
                      {getStatusBadge(frontStatus)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{t.requestedBy}:</span>{" "}
                        <span className="text-gray-900 dark:text-white">{request.Registrado_Por || request.Beneficiario || "Usuario"}</span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{t.requestDate}:</span>{" "}
                        <span className="text-gray-900 dark:text-white">{new Date(request.Fecha_Sistema).toLocaleDateString()}</span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{t.quantity}:</span>{" "}
                        <span className="text-gray-900 dark:text-white">{request.Cant}</span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">ID:</span>{" "}
                        <span className="font-mono text-gray-900 dark:text-white">FOLIO-{request.Folio}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{t.reason}:</span> {request.Operacion === 'PRESTAMO' ? 'Préstamo de equipo/artículo' : 'Salida o asignación directa'} para {request.Beneficiario ? request.Beneficiario : "Público General"}.
                      </p>
                      {stockInfo !== null && frontStatus === "pending" && (
                        <p className={`text-sm mt-2 font-medium ${stockInfo >= request.Cant ? "text-green-600" : "text-red-600"}`}>
                          Stock disponible en Ortopedia: {stockInfo} unidades
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {frontStatus === "pending" && (
                  <div className="flex gap-2 flex-shrink-0 flex-col md:flex-row">
                    <Button
                      onClick={() => handleApprove(request.Folio)}
                      className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t.approve}
                    </Button>
                    <Button
                      onClick={() => handleReject(request.Folio)}
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50 gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      {t.reject}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}