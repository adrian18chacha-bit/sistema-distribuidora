function calcIGV(subtotal) {
    const IGV = 0.18;
    const valor = Number(subtotal);
    return Number.isFinite(valor) ? valor * IGV : 0;
}

function totalToSubtotalIGV(totalConIGV) {
    const total = Number(totalConIGV);
    if (!Number.isFinite(total)) return { subtotal: 0, igv: 0 };
    const subtotal = total / 1.18;
    const igv = total - subtotal;
    return { subtotal, igv };
}

function exportarExcelReal() {
    const info = pedidosActuales.map((pedido) => {
        const total = Number(pedido.precio_total) || 0;
        const { subtotal, igv } = totalToSubtotalIGV(total);
        return {
            FECHA: new Date(pedido.creado_en).toLocaleDateString('es-PE'),
            CLIENTE: pedido.cliente,
            PRODUCTO: pedido.producto,
            SUBTOTAL: subtotal.toFixed(2),
            IGV: igv.toFixed(2),
            TOTAL: total.toFixed(2),
            ESTADO: pedido.entregado ? 'Listo' : 'Pendiente'
        };
    });

    exportToExcelAutoWidth(info, 'Ventas', 'Reporte_Distribuidora_Chavez');
}

function exportarInventarioExcel() {
    if (!Array.isArray(inventarioActual) || inventarioActual.length === 0) {
        alert('No hay inventario disponible para exportar.');
        return;
    }

    const datosMapeados = inventarioActual.map((item) => ({
        Producto: item.nombre || '',
        Categoría: item.categoria || 'SIN CATEGORÍA',
        'Stock Disponible': Number(item.stock || 0),
        Fecha: item.creado_en ? new Date(item.creado_en).toLocaleDateString('es-PE') : ''
    }));

    exportToExcelAutoWidth(datosMapeados, 'Inventario', 'Reporte_Inventario.xlsx');
}

function generarReciboPDF(idPedido) {
    const pedido = pedidosDB.find((item) => String(item.id) === String(idPedido));
    if (!pedido) {
        alert('No se encontró el pedido');
        return;
    }

    const total = Number(pedido.precio_total) || 0;
    const { subtotal, igv } = totalToSubtotalIGV(total);
    const fecha = new Date(pedido.creado_en).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const estado = pedido.entregado ? 'LISTO' : 'PENDIENTE';
    const empresa = 'Distribuidora Chávez';
    const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;

    if (!jsPDFConstructor) {
        alert('No se pudo generar el recibo: jsPDF no está disponible.');
        return;
    }

    try {
        const doc = new jsPDFConstructor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = 20;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor('#0d6efd');
        doc.text(empresa, margin, y);

        y += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#111111');
        doc.text('Recibo de Venta', margin, y);
        y += 10;
        doc.setFontSize(10);
        doc.text(`Recibo: #${idPedido}`, margin, y);
        doc.text(`Fecha: ${fecha}`, pageWidth - margin, y, { align: 'right' });

        y += 10;
        doc.setDrawColor(13, 110, 253);
        doc.setLineWidth(0.6);
        doc.line(margin, y, pageWidth - margin, y);

        y += 12;
        const clienteLines = doc.splitTextToSize(`Cliente: ${pedido.cliente}`, pageWidth - margin * 2);
        doc.text(clienteLines, margin, y);
        y += clienteLines.length * 6;

        const productoLines = doc.splitTextToSize(`Producto: ${pedido.producto}`, pageWidth - margin * 2);
        doc.text(productoLines, margin, y);
        y += productoLines.length * 6;

        doc.text(`Estado: ${estado}`, margin, y);
        y += 12;

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.4);
        doc.line(margin, y, pageWidth - margin, y);

        y += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Detalle de Pago', margin, y);
        y += 8;
        doc.setFont('helvetica', 'normal');

        const details = [
            ['Subtotal', `S/. ${subtotal.toFixed(2)}`],
            ['IGV (18%)', `S/. ${igv.toFixed(2)}`],
            ['Total', `S/. ${total.toFixed(2)}`]
        ];

        details.forEach(([label, value]) => {
            doc.text(label, margin, y);
            doc.text(value, pageWidth - margin, y, { align: 'right' });
            y += 8;
        });

        y += 12;
        doc.setDrawColor(13, 110, 253);
        doc.setLineWidth(0.6);
        doc.line(margin, y, pageWidth - margin, y);

        y += 10;
        doc.setFontSize(10);
        doc.setTextColor('#666666');
        const footerLines = doc.splitTextToSize('Gracias por tu compra • Distribuidora Chávez', pageWidth - margin * 2);
        doc.text(footerLines, margin, y);

        const fileName = `Recibo_${empresa.replace(/\s+/g, '_')}_#${idPedido}.pdf`;
        const isIOS = /iP(hone|od|ad)/i.test(navigator.userAgent);
        const downloadSupported = 'download' in document.createElement('a');

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);

        if (!isIOS && downloadSupported) {
            anchor.click();
        } else {
            const opened = window.open(url, '_blank');
            if (!opened) {
                window.location.href = url;
            }
        }

        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
        console.error('Error generando PDF con jsPDF:', error);
        alert('No se pudo generar el recibo. Intenta de nuevo o usa otro navegador.');
    }
}
