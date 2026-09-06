/* tipos de datos de la base de datos */
/**
 * Tipos de datos para el esquema 'donaciones'
 * Proyecto: Donations Control Center Dashboard
 */

// 1. Configuración de Usuario y UI
export interface UsuarioConfig {
  id_usuario?: number;
  nombre: string;
  rol: 'Admin' | 'Farmacia' | 'Ortopedia';
  email: string;
  idioma_pref: 'es' | 'en';
  tema_pref: 'light' | 'dark';
}

// 2. Núcleo de Movimientos (Folios)
export interface FolioMaestro {
  id_folio?: number;
  tipo_movimiento: string;
  area_origen: string;
  fecha_registro?: Date;
  id_usuario_registra: number;
  observaciones_generales?: string;
  estatus_folio: string; // 'true' o 'false'
  estatus_folio_bool?: boolean; // Propiedad computada para el frontend
}

// 3. Detalle de los Artículos en la Donación
export interface DetalleOperacion {
  id_detalle?: number;
  id_folio: number;
  categoria: 'MEDICAMENTO' | 'INSUMO' | 'EQUIPO' | 'DENTAL' | 'ROPA';
  id_item_externo?: number; // ID de farmacia u ortopedia
  nombre_item: string;
  cantidad: number;
  lote_serie?: string;
  estado_fisico_entrega?: string;
}

// 4. Control de Préstamos (Formato Amarillo)
export interface ControlPrestamo {
  id_prestamo?: number;
  id_folio: number;
  nombre_solicitante: string;
  telefono_solicitante?: string;
  fecha_hora_prestamo: Date;
  fecha_hora_devolucion_pactada?: Date;
  fecha_hora_devolucion_real?: Date;
  estatus_prestamo: 'ACTIVO' | 'DEVUELTO' | 'MORA' | 'DAÑADO';
  compromiso_responsabilidad: boolean;
  notas_devolucion?: string;
  id_usuario_entrega?: number;
  id_usuario_recibe?: number;
}

/**
 * 5. VISTA CONSOLIDADA (Lo que llega al Dashboard)
 * Este tipo refleja exactamente las columnas de 'vista_historial_completo'
 */
export interface VistaHistorialCompleto {
  Folio: number;
  Fecha_Sistema: Date;
  Operacion: 'ENTRADA' | 'SALIDA' | 'PRESTAMO';
  Modulo: string;
  Articulo: string;
  Categoria: string;
  Cant: number;
  Beneficiario: string | null;
  Contacto: string | null;
  Vencimiento_Prestamo: Date | null;
  Estado_Prestamo: string | null;
  Registrado_Por: string;
  idioma_pref: 'es' | 'en';
  tema_pref: 'light' | 'dark';
}

// 6. Tipos para Reportes y Gráficas
export interface ReporteCategoria {
  Categoria: string;
  total: number;
}

export interface AlertaStock {
  nombre: string;
  stock_actual: number;
  modulo: 'Farmacia' | 'Ortopedia';
}

export interface InventarioItem {
  category: string;
  name: string;
  subcategory: string;
  stock: number;
  minimum: number;
}