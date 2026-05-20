/**
 * Excel Export Utilities - Auto-width Column Formatting
 * Exporta datos con columnas ajustadas automáticamente según el contenido
 */

function exportToExcelAutoWidth(data, sheetName = 'Datos', fileName = 'export.xlsx') {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  // Crear hoja de cálculo
  const ws = XLSX.utils.json_to_sheet(data);

  // Calcular ancho de columnas basado en contenido
  const colWidths = [];
  const headers = Object.keys(data[0]);
  
  headers.forEach((header, idx) => {
    // Encontrar la longitud máxima en la columna
    const maxLen = Math.max(
      header.length,
      ...data.map(row => {
        const val = row[header];
        return String(val || '').length;
      })
    );
    // Agregar padding y convertir a ancho de Excel (aproximadamente 1.2 caracteres por unidad)
    colWidths[idx] = { wch: Math.min(maxLen + 3, 50) };
  });

  ws['!cols'] = colWidths;

  // Aplicar estilos a headers (opcional, requiere pro de XLSX)
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_col(col) + '1';
    if (ws[cellAddress]) {
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0066cc' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
      };
    }
  }

  // Aplicar ajuste de texto a todas las celdas de datos
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = ws[cellAddress].s || {};
        ws[cellAddress].s.alignment = {
          horizontal: 'left',
          vertical: 'top',
          wrapText: true
        };
      }
    }
  }

  // Crear workbook y agregar hoja
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generar nombre de archivo con timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  const finalFileName = `${fileName.split('.')[0]}_${timestamp}.xlsx`;

  // Descargar
  XLSX.writeFile(wb, finalFileName);
}

/**
 * Exporta tabla HTML a Excel con formato automático
 */
function exportTableToExcel(tableSelector, fileName = 'tabla') {
  const table = document.querySelector(tableSelector);
  if (!table) {
    alert('Tabla no encontrada');
    return;
  }

  const data = [];
  const rows = table.querySelectorAll('tr');

  // Extraer headers
  const headers = [];
  rows[0]?.querySelectorAll('th, td').forEach(cell => {
    headers.push(cell.textContent.trim());
  });

  // Extraer datos
  for (let i = 1; i < rows.length; i++) {
    const row = {};
    const cells = rows[i].querySelectorAll('td');
    headers.forEach((header, idx) => {
      row[header] = cells[idx]?.textContent.trim() || '';
    });
    if (Object.values(row).some(v => v)) {
      data.push(row);
    }
  }

  exportToExcelAutoWidth(data, 'Datos', fileName);
}

/**
 * Exporta array de objetos con filas separadas por tipo
 */
function exportVentasGastosExcel(ventas, gastos) {
  const ws = XLSX.utils.json_to_sheet([]);
  const wb = XLSX.utils.book_new();

  // Hoja de Ventas
  if (ventas && ventas.length > 0) {
    const wsVentas = XLSX.utils.json_to_sheet(ventas);
    applyAutoWidthFormatting(wsVentas, ventas);
    XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas');
  }

  // Hoja de Gastos
  if (gastos && gastos.length > 0) {
    const wsGastos = XLSX.utils.json_to_sheet(gastos);
    applyAutoWidthFormatting(wsGastos, gastos);
    XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos');
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Reporte_${timestamp}.xlsx`);
}

/**
 * Aplica formato de ancho automático a una hoja
 */
function applyAutoWidthFormatting(ws, data) {
  if (!data || data.length === 0) return;

  const colWidths = [];
  const headers = Object.keys(data[0]);

  headers.forEach((header, idx) => {
    const maxLen = Math.max(
      header.length,
      ...data.map(row => String(row[header] || '').length)
    );
    colWidths[idx] = { wch: Math.min(maxLen + 3, 50) };
  });

  ws['!cols'] = colWidths;

  // Estilos de header
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_col(col) + '1';
    if (ws[cellAddress]) {
      ws[cellAddress].s = {
        font: { bold: true },
        alignment: { horizontal: 'center', wrapText: true }
      };
    }
  }
}
