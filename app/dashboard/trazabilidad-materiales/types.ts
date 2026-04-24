export interface ConsumoRow {
    inventarioId: string;
    nc: string;
    ticketId: string | null;
    local: string;       // sigla (para filtros y búsqueda)
    localSigla: string;  // ej. "KNN"
    localTitulo: string; // ej. "Revisión de POS"
    fecha: string;       // tickets.fecha_resolucion — fecha real del Acta de Cierre
    tecnico: string;
    modelo: string;
    familia: string;
    cantidad: number;
    estadoTicket: string;
}
