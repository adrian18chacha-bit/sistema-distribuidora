let currentModulo = 'sd';

function renderEmptyRow(body, cols, message) {
    body.innerHTML = `
        <tr class="text-center text-slate-500 dark:text-slate-400">
            <td class="px-7 py-10" colspan="${cols}">${message}</td>
        </tr>`;
}

function cambiarModulo(modulo) {
    currentModulo = modulo;
    ['sd', 'fi', 'mm', 'pp'].forEach((m) => {
        const btn = document.getElementById(`module-${m}`);
        const section = document.getElementById(`section-${m}`);
        if (btn) btn.className = m === modulo
            ? 'px-5 py-2 rounded-lg text-xs font-bold transition-all bg-white text-blue-700 shadow-sm'
            : 'px-5 py-2 rounded-lg text-xs font-bold transition-all text-white opacity-70';
        if (section) section.classList.toggle('hidden', m !== modulo);
    });

    const titulo = document.getElementById('modulo-titulo');
    const subtitulo = document.getElementById('modulo-subtitulo');
    if (titulo) titulo.textContent = modulo === 'sd' ? 'Módulo SD' : modulo === 'fi' ? 'Módulo FI' : modulo === 'mm' ? 'Módulo MM' : 'Módulo PP';
    if (subtitulo) subtitulo.textContent = modulo === 'sd'
        ? 'Gestiona pedidos, información de clientes y control de entregas en tiempo real.'
        : modulo === 'fi'
            ? 'Registra gastos, analiza utilidades y controla el flujo financiero de la empresa.'
            : modulo === 'mm'
                ? 'Administra inventario, proveedores y stock con visibilidad completa del almacén.'
                : 'Planifica la producción con órdenes y estados para asegurar fabricación y entrega.';

    const labels = {
        sd: ['Ventas', 'Gastos', 'Utilidad Neta'],
        fi: ['Facturación', 'Gastos', 'Resultados'],
        mm: ['Stock', 'Proveedores', 'Productos'],
        pp: ['Órdenes', 'Productos', 'Estado']
    };
    document.getElementById('card-1-label').textContent = labels[modulo][0];
    document.getElementById('card-2-label').textContent = labels[modulo][1];
    document.getElementById('card-3-label').textContent = labels[modulo][2];

    if (modulo === 'sd') {
        actualizarInterfaz();
    } else if (modulo === 'fi') {
        actualizarGastos();
    } else if (modulo === 'mm') {
        actualizarInventario();
    } else {
        actualizarPlanProduccion();
    }
}

function refreshModuloActual() {
    if (currentModulo === 'sd') {
        actualizarInterfaz();
    } else if (currentModulo === 'fi') {
        actualizarGastos();
    } else if (currentModulo === 'mm') {
        actualizarInventario();
    } else {
        actualizarPlanProduccion();
    }
}

function actualizarInterfaz() {
    const header = document.getElementById('header-tabla');
    const body = document.getElementById('body-tabla');
    body.innerHTML = '';
    let totalVentas = 0;
    let totalGastos = 0;
    let pendientes = 0;
    let listos = 0;
    const query = document.getElementById('buscador').value.toLowerCase();

    pedidosActuales.forEach((pedido) => {
        totalVentas += Number(pedido.precio_total || 0);
        if (pedido.entregado) {
            listos += 1;
        } else {
            pendientes += 1;
        }
    });
    gastosActuales.forEach((gasto) => {
        totalGastos += Number(gasto.monto || 0);
    });

    document.getElementById('resumen-ventas').textContent = `S/. ${totalVentas.toFixed(2)}`;
    document.getElementById('resumen-gastos').textContent = `S/. ${totalGastos.toFixed(2)}`;
    document.getElementById('resumen-utilidad').textContent = `S/. ${(totalVentas - totalGastos).toFixed(2)}`;

    header.innerHTML = '<th class="px-7 py-5 text-left">Cliente</th><th class="px-7 py-5 text-center">Total</th><th class="px-7 py-5 text-center">Estado</th><th class="px-7 py-5 text-center">Acciones</th>';
    const pedidosFiltrados = pedidosActuales.filter((pedido) => (`${pedido.cliente} ${pedido.producto}`.toLowerCase().includes(query)));

    pedidosFiltrados.forEach((pedido) => {
        const fechaTexto = new Date(pedido.creado_en).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
        body.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all text-left">
                <td class="px-7 py-5 font-bold dark:text-white">${pedido.cliente}<br><span class="text-[10px] text-slate-400 font-normal uppercase">${pedido.producto} • ${fechaTexto}</span></td>
                <td class="px-7 py-5 text-center font-black text-blue-600 dark:text-blue-400">S/. ${Number(pedido.precio_total || 0).toFixed(2)}</td>
                <td class="px-7 py-5 text-center"><span class="px-2.5 py-1 rounded-lg text-[10px] font-black ${pedido.entregado ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}">${pedido.entregado ? 'LISTO' : 'PENDIENTE'}</span></td>
                <td class="px-7 py-5 flex justify-center items-center gap-3">
                    <button onclick="enviarWhatsApp('${pedido.cliente}','${pedido.producto}',${pedido.precio_total})" class="text-emerald-500 hover:scale-125 transition-transform" title="WhatsApp">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.853.448-1.273.607-1.446.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.101-.177.211-.077.383.101.173.448.738.961 1.193.661.587 1.216.768 1.39.853.173.087.275.072.376-.044.101-.116.434-.506.549-.68.116-.173.231-.144.39-.087s1.011.477 1.184.564c.173.087.289.13.332.202.045.072.045.419-.1.824z"/></svg>
                    </button>
                    <button onclick="generarReciboPDF(${pedido.id})" class="text-slate-800 dark:text-slate-100 hover:scale-125 transition-transform text-lg" title="Recibo">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v4h4" /><path d="M7 13h10" /><path d="M7 17h7" /><path d="M7 7h10" /><path d="M5 21h14a2 2 0 0 0 2-2V8l-6-5H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"/></svg>
                    </button>
                    ${!pedido.entregado ? `<button onclick="marcarEntregado(${pedido.id})" class="text-blue-500 font-black hover:scale-125 transition-transform text-lg" title="Listo">✓</button>` : ''}
                    <button onclick="eliminarPedido(${pedido.id})" class="text-rose-500 hover:scale-125 transition-transform text-lg" title="Eliminar">✕</button>
                </td>
            </tr>`;
    });

    if (pedidosFiltrados.length === 0) {
        renderEmptyRow(body, 4, 'No hay pedidos registrados.');
    }

    renderChart(pendientes, listos);
}

function actualizarGastos() {
    const query = document.getElementById('buscador-gastos')?.value.toLowerCase() || '';
    const body = document.getElementById('body-gastos');
    body.innerHTML = '';

    let totalVentas = pedidosActuales.reduce((sum, pedido) => sum + Number(pedido.precio_total || 0), 0);
    let totalGastos = 0;

    const gastosFiltrados = gastosActuales.filter((gasto) => gasto.descripcion.toLowerCase().includes(query));
    gastosFiltrados.forEach((gasto) => {
            totalGastos += Number(gasto.monto || 0);
            const fechaTexto = new Date(gasto.creado_en).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
            body.innerHTML += `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all text-left">
                    <td class="px-7 py-5 font-bold dark:text-white">${gasto.descripcion}<br><span class="text-[10px] text-slate-400 font-normal uppercase">${fechaTexto}</span></td>
                    <td class="px-7 py-5 text-center font-black text-rose-500">S/. ${Number(gasto.monto).toFixed(2)}</td>
                    <td class="px-7 py-5 text-center"><button onclick="eliminarGasto(${gasto.id})" class="text-rose-500 font-bold hover:scale-125 transition-transform text-lg">✕</button></td>
                </tr>`;
        });

    if (gastosFiltrados.length === 0) {
        renderEmptyRow(body, 3, 'No hay gastos registrados.');
    }

    document.getElementById('resumen-ventas').textContent = `S/. ${totalVentas.toFixed(2)}`;
    document.getElementById('resumen-gastos').textContent = `S/. ${totalGastos.toFixed(2)}`;
    document.getElementById('resumen-utilidad').textContent = `S/. ${(totalVentas - totalGastos).toFixed(2)}`;
}

function actualizarInventario() {
    const bodyInventario = document.getElementById('body-inventario');
    const bodyProveedores = document.getElementById('body-proveedores');
    bodyInventario.innerHTML = '';
    bodyProveedores.innerHTML = '';

    const totalStock = inventarioActual.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    if (inventarioActual.length === 0) {
        renderEmptyRow(bodyInventario, 4, 'No hay productos en el inventario.');
    } else {
        inventarioActual.forEach((item) => {
            bodyInventario.innerHTML += `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all text-left">
                <td class="px-7 py-5 font-bold dark:text-white">${item.nombre}</td>
                <td class="px-7 py-5 text-center uppercase text-slate-500 dark:text-slate-300">${item.categoria || 'SIN CATEGORÍA'}</td>
                <td class="px-7 py-5 text-center font-black text-slate-800 dark:text-slate-100">${item.stock}</td>
                <td class="px-7 py-5 text-center"><button onclick="eliminarInventario('${item.id}')" class="text-rose-500 font-bold hover:scale-125 transition-transform text-lg">✕</button></td>
            </tr>`;
        });
    }

    if (proveedoresActual.length === 0) {
        renderEmptyRow(bodyProveedores, 2, 'No hay proveedores registrados.');
    } else {
        proveedoresActual.forEach((proveedor) => {
            bodyProveedores.innerHTML += `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all text-left">
                <td class="px-7 py-5 font-bold dark:text-white">${proveedor.nombre}</td>
                <td class="px-7 py-5 text-center"><button onclick="eliminarProveedor('${proveedor.id}')" class="text-rose-500 font-bold hover:scale-125 transition-transform text-lg">✕</button></td>
            </tr>`;
        });
    }

    document.getElementById('resumen-ventas').textContent = `${inventarioActual.length}`;
    document.getElementById('resumen-gastos').textContent = `${proveedoresActual.length}`;
    document.getElementById('resumen-utilidad').textContent = `${totalStock}`;
}

function filtrarGastos() {
    actualizarGastos();
}

function filtrarPP() {
    actualizarPlanProduccion();
}

function actualizarPlanProduccion() {
    const query = document.getElementById('buscador-pp')?.value.toLowerCase() || '';
    const body = document.getElementById('body-pp');
    body.innerHTML = '';

    let totalOrdenes = 0;
    let totalCantidad = 0;

    ppActual.filter((orden) => {
        const text = `${orden.producto} ${orden.estado}`.toLowerCase();
        return text.includes(query) || String(orden.cantidad).includes(query) || orden.id.toLowerCase().includes(query);
    }).forEach((orden) => {
        totalOrdenes += 1;
        totalCantidad += Number(orden.cantidad || 0);
        body.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all text-left">
                <td class="px-7 py-5 font-bold dark:text-white">${orden.id}</td>
                <td class="px-7 py-5 text-center text-slate-800 dark:text-slate-100">${orden.producto}</td>
                <td class="px-7 py-5 text-center font-black text-slate-800 dark:text-slate-100">${orden.cantidad}</td>
                <td class="px-7 py-5 text-center text-slate-500 dark:text-slate-400">${orden.fecha_entrega}</td>
                <td class="px-7 py-5 text-center"><span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${orden.estado === 'COMPLETADO' ? 'bg-emerald-50 text-emerald-700' : orden.estado === 'EN_PROCESO' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}">${orden.estado.replace('_', ' ')}</span></td>
                <td class="px-7 py-5 text-center">
                    ${orden.estado !== 'COMPLETADO' ? `<button onclick="finalizarProduccion('${orden.id}')" class="text-emerald-600 font-bold hover:scale-125 transition-transform mr-3 text-sm">Finalizar Producción</button>` : ''}
                    <button onclick="eliminarOrdenPP('${orden.id}')" class="text-rose-500 font-bold hover:scale-125 transition-transform text-lg">✕</button>
                </td>
            </tr>`;
    });

    if (totalOrdenes === 0) {
        renderEmptyRow(body, 6, 'No hay órdenes planificadas.');
    }

    document.getElementById('resumen-ventas').textContent = `${totalOrdenes}`;
    document.getElementById('resumen-gastos').textContent = `${ppActual.length}`;
    document.getElementById('resumen-utilidad').textContent = `${totalCantidad}`;
}

function actualizarTema() {
    const isDark = document.documentElement.classList.contains('dark');
    const lightBtn = document.getElementById('theme-light');
    const darkBtn = document.getElementById('theme-dark');

    if (lightBtn && darkBtn) {
        if (isDark) {
            darkBtn.classList.add('bg-white', 'text-slate-950');
            darkBtn.classList.remove('bg-transparent');
            lightBtn.classList.remove('bg-white', 'text-slate-950');
            lightBtn.classList.add('bg-transparent');
        } else {
            lightBtn.classList.add('bg-white', 'text-slate-950');
            lightBtn.classList.remove('bg-transparent');
            darkBtn.classList.remove('bg-white', 'text-slate-950');
            darkBtn.classList.add('bg-transparent');
        }
    }
}

function setThemeMode(mode) {
    const isDark = mode === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    actualizarTema();
    refreshModuloActual();
}

function enviarWhatsApp(cliente, producto, total) {
    const mensaje = `¡Hola ${cliente}! 👋 Confirmamos tu pedido de ${producto} por S/. ${total.toFixed(2)}. ¡Gracias! 🚛💧`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`, '_blank');
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
            const abierto = window.open(url, '_blank');
            if (!abierto) {
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

// Asegura que las funciones invocadas desde los botones sean accesibles globalmente
window.cambiarModulo = cambiarModulo;

window.actualizarTema = actualizarTema;
window.enviarWhatsApp = enviarWhatsApp;
window.generarReciboPDF = generarReciboPDF;
window.filtrarGastos = filtrarGastos;
window.filtrarPP = filtrarPP;
window.actualizarGastos = actualizarGastos;
window.actualizarInventario = actualizarInventario;
window.actualizarPlanProduccion = actualizarPlanProduccion;
window.guardarInventario = guardarInventario;
window.guardarProveedor = guardarProveedor;
window.guardarOrdenPP = guardarOrdenPP;
window.eliminarInventario = eliminarInventario;
window.eliminarProveedor = eliminarProveedor;
window.eliminarOrdenPP = eliminarOrdenPP;
window.addEventListener('DOMContentLoaded', actualizarTema);
