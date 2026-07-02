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

function exportarGastosExcel() {
    if (!Array.isArray(gastosActuales) || gastosActuales.length === 0) {
        alert('No hay gastos registrados para exportar.');
        return;
    }

    const datosMapeados = gastosActuales.map((gasto) => ({
        'Descripción del Gasto': gasto.descripcion || '',
        'Monto (S/.)': Number(gasto.monto || 0),
        Fecha: gasto.creado_en ? new Date(gasto.creado_en).toLocaleDateString('es-PE') : ''
    }));

    exportToExcelAutoWidth(datosMapeados, 'Gastos', 'Reporte_Gastos.xlsx');
}
