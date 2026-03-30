'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { exportTicketsMaestroAction, type TicketMaestroRow } from '../exportActions';

// ─── Paleta de colores según estado ───────────────────────────────────────────
const ESTADO_COLORS: Record<string, { bg: string; font: string }> = {
    abierto:          { bg: 'FFE0F2FE', font: 'FF0369A1' },
    en_progreso:      { bg: 'FFE0E7FF', font: 'FF4338CA' },
    pendiente:        { bg: 'FFFFF7ED', font: 'FFC2410C' },
    programado:       { bg: 'FFF3E8FF', font: 'FF7C3AED' },
    esperando_agente: { bg: 'FFF1F5F9', font: 'FF475569' },
    resuelto:         { bg: 'FFD1FAE5', font: 'FF065F46' },
    cerrado:          { bg: 'FFF1F5F9', font: 'FF374151' },
    anulado:          { bg: 'FFFEE2E2', font: 'FFB91C1C' },
};

const PRIORIDAD_COLORS: Record<string, { bg: string; font: string }> = {
    crítica: { bg: 'FFF3E8FF', font: 'FF7C3AED' },
    alta:    { bg: 'FFFEE2E2', font: 'FFB91C1C' },
    media:   { bg: 'FFFEF3C7', font: 'FFD97706' },
    baja:    { bg: 'FFE0F2FE', font: 'FF0369A1' },
};

export function ExportarMaestroButton() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await exportTicketsMaestroAction();

            if ('error' in result) {
                setError(result.error);
                return;
            }

            const rows: TicketMaestroRow[] = result.data;

            // ─── ExcelJS dinámico ─────────────────────────────────────────────
            const ExcelJS = (await import('exceljs')).default;
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Systel × Loop';
            workbook.created = new Date();

            const sheet = workbook.addWorksheet('Tickets Maestro', {
                views: [{ state: 'frozen', ySplit: 4 }],
                pageSetup: {
                    paperSize: 9, // A4
                    orientation: 'landscape',
                    fitToPage: true,
                    fitToWidth: 1,
                },
            });

            // ── Fila 1: Título principal ──────────────────────────────────────
            const TOTAL_COLS = 18;
            const lastCol = String.fromCharCode(64 + TOTAL_COLS); // 'R'
            sheet.mergeCells(`A1:${lastCol}1`);
            const titleCell = sheet.getCell('A1');
            titleCell.value = 'Reporte Maestro de Tickets — Systel × Loop';
            titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E3A8A' } };
            titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
            sheet.getRow(1).height = 32;

            // ── Fila 2: Fecha de generación + contador ────────────────────────
            sheet.mergeCells(`A2:${lastCol}2`);
            const subCell = sheet.getCell('A2');
            subCell.value = `Generado el ${new Date().toLocaleString('es-CL')} — ${rows.length} ticket(s)`;
            subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF64748B' } };
            subCell.alignment = { vertical: 'middle', horizontal: 'left' };
            subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
            sheet.getRow(2).height = 20;

            // ── Fila 3: Espaciador ────────────────────────────────────────────
            sheet.getRow(3).height = 8;

            // ── Fila 4: Encabezados de columnas ──────────────────────────────
            const headers = Object.keys(rows[0] ?? {}) as (keyof TicketMaestroRow)[];
            const headerRow = sheet.getRow(4);
            headerRow.values = ['', ...headers]; // offset col A = index 0
            headerRow.height = 28;

            // Aplicar estilo a cada celda header (B4 en adelante = columna 2+)
            headers.forEach((_, idx) => {
                const cell = headerRow.getCell(idx + 2);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
                cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
                cell.border = {
                    bottom: { style: 'medium', color: { argb: 'FF3B5FC0' } },
                    right:  { style: 'thin',   color: { argb: 'FF3B5FC0' } },
                };
            });

            // ── Filas de datos (desde fila 5) ────────────────────────────────
            rows.forEach((row, rowIdx) => {
                const sheetRow = sheet.addRow(['', ...headers.map(h => row[h])]);
                sheetRow.height = 18;

                const isEven = rowIdx % 2 === 0;
                const estadoRaw = row['Estado']?.toLowerCase() ?? '';
                const prioridadRaw = row['Prioridad']?.toLowerCase() ?? '';

                headers.forEach((header, colIdx) => {
                    const cell = sheetRow.getCell(colIdx + 2);
                    const isTextCol = ['Materiales Usados', 'Detalle Viáticos', 'Último Comentario'].includes(header);

                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: colIdx === 0 ? 'center' : (isTextCol ? 'left' : 'left'),
                        wrapText: isTextCol,
                    };
                    cell.font = { name: 'Arial', size: 9 };
                    cell.border = {
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        right:  { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    };

                    // Fondo alternado base
                    const baseBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

                    if (header === 'Estado') {
                        const c = ESTADO_COLORS[estadoRaw];
                        if (c) {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.bg } };
                            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: c.font } };
                        } else {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseBg } };
                        }
                    } else if (header === 'Prioridad') {
                        const c = PRIORIDAD_COLORS[prioridadRaw];
                        if (c) {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.bg } };
                            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: c.font } };
                        } else {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseBg } };
                        }
                    } else if (header === 'N° Ticket') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
                        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    } else if (header === 'Viáticos Total' && row['Viáticos Total'] !== '$0') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
                        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFB45309' } };
                    } else {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseBg } };
                    }
                });

                // Ajustar altura si tiene texto largo
                const comentario = row['Último Comentario'] ?? '';
                if (comentario.length > 80) sheetRow.height = 36;
                if (comentario.length > 160) sheetRow.height = 54;
            });

            // ── Anchos de columna optimizados ─────────────────────────────────
            const colWidths: Record<string, number> = {
                'N° Ticket':        10,
                'Título':           30,
                'Estado':           14,
                'Prioridad':        11,
                'Cliente':          20,
                'Restaurante':      22,
                'Categoría':        18,
                'Subcategoría':     20,
                'Elemento':         18,
                'Creado Por':       20,
                'Técnico Asignado': 20,
                'Fecha Creación':   14,
                'Fecha Resolución': 14,
                'Acción':           18,
                'Materiales Usados': 28,
                'Viáticos Total':    13,
                'Detalle Viáticos':  30,
                'Último Comentario': 40,
            };

            // Col A = oculta/auxiliar
            sheet.getColumn(1).width = 0.5;
            headers.forEach((header, idx) => {
                const col = sheet.getColumn(idx + 2);
                col.width = colWidths[header] ?? 15;
            });

            // ── Descargar ──────────────────────────────────────────────────────
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer as ArrayBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const fecha = new Date().toISOString().split('T')[0];
            const fileName = `Reporte_Tickets_Loop_${fecha}.xlsx`;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Error exportando maestro:', err);
            setError('Error inesperado al generar el reporte.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={handleExport}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm whitespace-nowrap"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generando...
                    </>
                ) : (
                    <>
                        <FileSpreadsheet className="w-4 h-4" />
                        Exportar Reporte
                    </>
                )}
            </button>
            {error && (
                <p className="text-xs text-red-600 font-medium max-w-[200px] text-right">{error}</p>
            )}
        </div>
    );
}
