import {
    VistaHistorialCompleto,
    UsuarioConfig,
    ReporteCategoria,
    FolioMaestro,
    DetalleOperacion,
    ControlPrestamo,
    InventarioItem
} from '../../pages/type';

/**
 * 🌟 CONFIGURACIÓN DE MICRO-FRONTEND NATIVA
 * Dejamos la ruta relativa para que use automáticamente el dominio del Proxy Maestro de Nginx
 * y corregimos el prefijo para evitar que se duplique la palabra /donaciones.
 */
export const API_URL = '/api/donaciones';

/**
 * 🔑 FUNCIÓN AUXILIAR: Opciones de Configuración para Fetch
 * Forza al navegador a incluir la cookie 'auth_token' del Login Central en todas las peticiones,
 * eliminando la necesidad de leer de forma manual el localStorage.
 */
const getFetchOptions = (method: string = 'GET', body?: any) => {
    return {
        method,
        credentials: 'include' as const, // 🌟 Clave para arrastrar la cookie de sesión de forma automática
        headers: {
            'Content-Type': 'application/json'
        },
        ...(body ? { body: JSON.stringify(body) } : {})
    };
};

export const storage = {

    // --- PANEL DE CONTROL (HISTORIAL) ---
    /**
     * Obtiene el listado completo de donaciones. 
     * Soporta una cadena de búsqueda para filtrar por Folio, Beneficiario o Artículo.
     */
    async getHistorial(searchQuery: string = ''): Promise<any[]> {
        const url = searchQuery
            ? `${API_URL}/historial?search=${encodeURIComponent(searchQuery)}`
            : `${API_URL}/historial`;

        const response = await fetch(url, getFetchOptions('GET'));
        const data = await response.json();
        
        if (!Array.isArray(data)) return [];
        
        return data.map((item: any) => {
            // Tratamiento de Fechas
            const rawDate = item.fecha_registro || item.Fecha_Sistema;
            let fechaFormateada = rawDate;
            if (rawDate) {
                const date = new Date(rawDate);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                fechaFormateada = `${day}/${month}/${year} ${hours}:${minutes}`;
            }

            return {
                ...item,
                // Propiedad computada para estatus_folio ('true'/'false' a booleano)
                estatus_folio_bool: item.estatus_folio === 'true',
                // Guardar la fecha ya formateada
                fecha_registro_formateada: fechaFormateada
            };
        });
    },

    /**
     * Obtiene el inventario actual calculado.
     */
    async getInventario(): Promise<InventarioItem[]> {
        const response = await fetch(`${API_URL}/inventario`, getFetchOptions('GET'));
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    /**
     * Obtiene el inventario de ortopedia.
     * [CORREGIDO]: Ajustado al endpoint plano mapeado en el backend de donaciones
     */
    async getInventarioOrtopedia(): Promise<any[]> {
        const response = await fetch(`${API_URL}/ortopedia-inventario`, getFetchOptions('GET'));
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    /**
     * Obtiene los beneficiarios registrados en ortopedia.
     * [CORREGIDO]: Ajustado al endpoint plano mapeado en el backend de donaciones
     */
    async getBeneficiariosOrtopedia(): Promise<any[]> {
        const response = await fetch(`${API_URL}/ortopedia-beneficiarios`, getFetchOptions('GET'));
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    // --- GESTIÓN DE PRÉSTAMOS (FORMATO AMARILLO) ---
    /**
     * Obtiene los préstamos de equipo médico que aún no han sido devueltos.
     * [CORREGIDO]: Ruta directa unificada sin sub-enrutador anidado
     */
    async getPrestamosActivos(): Promise<VistaHistorialCompleto[]> {
        const response = await fetch(`${API_URL}/prestamos-activos`, getFetchOptions('GET'));
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    /**
     * Obtiene los préstamos que ya pasaron su fecha de devolución pactada.
     * [CORREGIDO]: Ruta directa unificada sin sub-enrutador anidado
     */
    async getPrestamosEnMora(): Promise<VistaHistorialCompleto[]> {
        const response = await fetch(`${API_URL}/prestamos-mora`, getFetchOptions('GET'));
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    /**
     * Actualiza un préstamo a estado 'DEVUELTO'.
     * [CORREGIDO]: Ruta directa unificada
     */
    async finalizarPrestamo(id_folio: number, notas: string): Promise<boolean> {
        const response = await fetch(`${API_URL}/prestamos-devolucion`, getFetchOptions('PUT', { id_folio, notas }));
        return response.ok;
    },

    // --- REPORTES Y GRÁFICAS ---
    /**
     * Obtiene estadísticas de donaciones por categoría para el Dashboard.
     */
    async getReporteCategorias(): Promise<ReporteCategoria[]> {
        const response = await fetch(`${API_URL}/reportes/categorias`, getFetchOptions('GET'));
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    // --- CONFIGURACIÓN DE USUARIO ---
    /**
     * Obtiene las preferencias de Idioma y Tema (Claro/Oscuro) del usuario.
     */
    async getUsuarioConfig(idUsuario: number = 1): Promise<UsuarioConfig> {
        const response = await fetch(`${API_URL}/usuarios-config/${idUsuario}`, getFetchOptions('GET'));
        const data = await response.json();
        return data;
    },

    // --- REGISTRO DE MOVIMIENTOS (TRANSACCIÓN) ---
    /**
     * Registra un nuevo folio de Entrada, Salida o Préstamo.
     * El backend procesará esto como una transacción SQL unificada.
     */
    async registrarMovimiento(payload: {
        folio: Omit<FolioMaestro, 'id_folio'>,
        detalle: Omit<DetalleOperacion, 'id_detalle'>,
        prestamo?: Omit<ControlPrestamo, 'id_prestamo'>
    }): Promise<{ success: boolean, id_folio?: number }> {
        const response = await fetch(`${API_URL}/registrar`, getFetchOptions('POST', payload));
        return await response.json();
    },

    // --- SOLICITUDES DE SALIDA ---
    /**
     * Obtiene el listado de solicitudes pendientes o salidas actuales.
     */
    async getSolicitudes(): Promise<VistaHistorialCompleto[]> {
        const response = await fetch(`${API_URL}/solicitudes`, getFetchOptions('GET'));
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    /**
     * Actualiza el estado de una solicitud (Aprobada / Rechazada)
     * nuevo_estado será 'ACTIVO' o 'CANCELADO'
     */
    async actualizarSolicitud(id_folio: number, nuevo_estado: 'ACTIVO' | 'CANCELADO'): Promise<boolean> {
        const response = await fetch(`${API_URL}/solicitudes/estado`, getFetchOptions('PUT', { id_folio, nuevo_estado }));
        return response.ok;
    }
};