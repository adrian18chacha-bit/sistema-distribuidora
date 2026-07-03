let currentModulo = 'sd';

function renderEmptyRow(body, cols, message) {
    body.innerHTML = `
        <tr class="text-center text-slate-500 dark:text-slate-400">
            <td class="px-7 py-10" colspan="${cols}">${message}</td>
        </tr>`;
}

async function cambiarModulo(modulo) {
    currentModulo = modulo;
    
    const container = document.getElementById('module-container');
    
    // Skeleton temporal
    container.style.opacity = '0';
    setTimeout(() => {
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                <div class="h-64 skeleton rounded-3xl"></div>
                <div class="h-64 skeleton rounded-3xl"></div>
                <div class="h-96 skeleton rounded-3xl md:col-span-2"></div>
            </div>`;
        container.style.opacity = '1';
    }, 150);
    
    try {
        // Cargar placa dinÃƒÂ¡micamente
        const response = await fetch(`./views/${modulo}.html`);
        if (!response.ok) throw new Error('MÃƒÂ³dulo no encontrado');
        const html = await response.text();
        
        setTimeout(() => {
            container.innerHTML = html;
            // Animación de entrada
            container.style.opacity = '1';
            
            // Post-carga: configurar UI especÃƒÂ­fica
            const moduloHeader = document.getElementById('modulo-header');
            if (moduloHeader) {
                moduloHeader.style.display = (modulo === 'home' || modulo === 'settings') ? 'none' : 'block';
            }

            // Actualizar botones de navegación sidebar
            document.querySelectorAll('.nav-btn').forEach(btn => {
                if (btn.dataset.target === modulo) {
                    btn.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white');
                    btn.classList.remove('text-slate-500', 'dark:text-slate-400', 'hover:text-slate-900', 'dark:hover:text-white', 'hover:bg-slate-50', 'dark:hover:bg-slate-800/50');
                } else {
                    btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white');
                    btn.classList.add('text-slate-500', 'dark:text-slate-400', 'hover:text-slate-900', 'dark:hover:text-white', 'hover:bg-slate-50', 'dark:hover:bg-slate-800/50');
                }
            });

            // Actualizar botones de navegación móvil (bottom bar)
            document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
                if (btn.dataset.target === modulo) {
                    btn.classList.add('text-blue-600', 'dark:text-blue-400');
                    btn.classList.remove('text-slate-400');
                } else {
                    btn.classList.remove('text-blue-600', 'dark:text-blue-400');
                    btn.classList.add('text-slate-400');
                }
            });

            const titulo = document.getElementById('modulo-titulo');
            const subtitulo = document.getElementById('modulo-subtitulo');
            if (titulo) titulo.textContent = modulo === 'sd' ? 'Ventas' : modulo === 'fi' ? 'Finanzas' : modulo === 'mm' ? 'Inventario' : modulo === 'pp' ? 'producción' : modulo === 'crm' ? 'Directorio de Clientes' : 'Configuración';
            if (subtitulo) subtitulo.textContent = modulo === 'sd'
                ? 'Gestiona pedidos, información de clientes y control de entregas en tiempo real.'
                : modulo === 'fi'
                    ? 'Registra gastos, analiza utilidades y controla el flujo financiero de la empresa.'
                    : modulo === 'mm'
                        ? 'Administra inventario, proveedores y stock con visibilidad completa del almacÃƒÂ©n.'
                        : modulo === 'pp' ? 'Planifica la producción con órdenes y estados para asegurar fabricación y entrega.' : 'Ajustes globales y datos de la empresa (Marca Blanca).';

            const labels = {
                sd: ['Ventas', 'Gastos', 'Utilidad Neta'],
                fi: ['Facturación', 'Gastos', 'Resultados'],
                mm: ['Stock', 'Proveedores', 'Productos'],
                pp: ['Órdenes', 'Productos', 'Estado'],
                settings: ['Ventas', 'Gastos', 'Utilidad Neta']
            };
            
            if (labels[modulo]) {
                const l1 = document.getElementById('card-1-label');
                const l2 = document.getElementById('card-2-label');
                const l3 = document.getElementById('card-3-label');
                if(l1) l1.textContent = labels[modulo][0];
                if(l2) l2.textContent = labels[modulo][1];
                if(l3) l3.textContent = labels[modulo][2];
            }

            if (typeof refreshModuloActual === 'function') {
                refreshModuloActual();
            }
            
            aplicarPermisosUI(); // Asegurar permisos en nueva vista
        }, 300); // Dar tiempo a fade-out
    } catch (e) {
        console.error('Error al cargar mÃƒÂ³dulo:', e);
        container.innerHTML = `<div class="p-8 text-center text-red-500">Error al cargar el mÃƒÂ³dulo ${modulo}</div>`;
        container.style.opacity = '1';
    }
}

function refreshModuloActual() {
    poblarSelects();
    if (currentModulo === 'sd') {
        actualizarInterfaz();
    } else if (currentModulo === 'fi') {
        actualizarGastos();
    } else if (currentModulo === 'mm') {
        actualizarInventario();
    } else if (currentModulo === 'pp') {
        actualizarPlanproducción();
    } else if (currentModulo === 'home') {
        actualizarHome();
    } else if (currentModulo === 'crm') {
        if(typeof actualizarCRM === 'function') actualizarCRM();
    }
}

function actualizarHome() {
    let totalVentas = 0;
    let entregadosHoy = 0;
    let stockCritico = 0;
    let gastosMes = 0;

    const hoy = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
    
    pedidosActuales.forEach(p => {
        totalVentas += Number(p.precio_total || 0);
        const fecha = new Date(p.creado_en).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
        if (p.entregado && fecha === hoy) entregadosHoy++;
    });

    inventarioActual.forEach(i => {
        if (Number(i.stock || 0) <= 5) stockCritico++;
    });

    gastosActuales.forEach(g => {
        gastosMes += Number(g.monto || 0);
    });

    const mVentas = document.getElementById('home-metric-ventas');
    const mPedidos = document.getElementById('home-metric-pedidos');
    const mStock = document.getElementById('home-metric-stock');
    const mGastos = document.getElementById('home-metric-gastos');

    if (mVentas) mVentas.textContent = `S/. ${totalVentas.toFixed(2)}`;
    if (mPedidos) mPedidos.textContent = entregadosHoy;
    if (mStock) mStock.textContent = stockCritico;
    if (mGastos) mGastos.textContent = `S/. ${gastosMes.toFixed(2)}`;
}

function poblarSelects() {
    const clienteSelect = document.getElementById('cliente-select');
    if (clienteSelect && typeof clientesDB !== 'undefined') {
        const selectedCliente = clienteSelect.value;
        clienteSelect.innerHTML = '<option value="">Seleccionar cliente</option><option value="NUEVO">+ Cliente Nuevo</option>';
        clientesDB.forEach(c => {
            clienteSelect.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
        });
        clienteSelect.value = selectedCliente;
    }

    let prodOptions = '<option value="">Seleccionar producto (Inventario)</option><option value="NUEVO">+ Producto Libre</option>';
    if (typeof inventarioDB !== 'undefined') {
        inventarioDB.forEach(item => {
            prodOptions += `<option value="${item.id}">${item.nombre} (Stock: ${item.stock})</option>`;
        });
    }

    const productoSelect = document.getElementById('producto-select');
    if (productoSelect) {
        const selectedProd = productoSelect.value;
        productoSelect.innerHTML = prodOptions;
        productoSelect.value = selectedProd;
    }

    const ppProductoSelect = document.getElementById('pp-producto');
    if (ppProductoSelect) {
        const selectedPPProd = ppProductoSelect.value;
        ppProductoSelect.innerHTML = prodOptions;
        ppProductoSelect.value = selectedPPProd;
    }
}

function aplicarPermisosUI() {
    if (window.userRol === 'vendedor' || window.userRol === 'repartidor') {
        const btnFI = document.getElementById('btn-nav-fi') || document.getElementById('module-fi');
        const btnMM = document.getElementById('btn-nav-mm') || document.getElementById('module-mm');
        const btnPP = document.getElementById('btn-nav-pp') || document.getElementById('module-pp');
        const btnSettings = document.getElementById('btn-nav-settings');
        const btnNavMobileSettings = document.querySelector('button[onclick="cambiarModulo(\'settings\')"]');
        const btnNavMobileInventario = document.querySelector('button[onclick="cambiarModulo(\'mm\')"]');
        const btnNavMobileproducción = document.querySelector('button[onclick="cambiarModulo(\'pp\')"]');
        const btnNavMobileFinanzas = document.querySelector('button[onclick="cambiarModulo(\'fi\')"]');
        
        if (btnFI) btnFI.style.display = 'none';
        if (btnMM) btnMM.style.display = 'none';
        if (btnPP) btnPP.style.display = 'none';
        if (btnSettings) btnSettings.style.display = 'none';
        
        if (btnNavMobileSettings) btnNavMobileSettings.style.display = 'none';
        if (btnNavMobileInventario) btnNavMobileInventario.style.display = 'none';
        if (btnNavMobileproducción) btnNavMobileproducción.style.display = 'none';
        if (btnNavMobileFinanzas) btnNavMobileFinanzas.style.display = 'none';
        
        if (window.userRol === 'repartidor') {
            const formRegistrar = document.getElementById('form-registrar-pedido');
            if (formRegistrar) formRegistrar.style.display = 'none';
        }
        
        const card3 = document.getElementById('card-3-container');
        const card4 = document.getElementById('card-4-container');
        if (card3) card3.style.display = 'none';
        if (card4) card4.style.display = 'none';
    } else {
        // Si es Admin, mostrar el botÃƒÂ³n de settings
        const btnSettings = document.getElementById('btn-nav-settings');
        if (btnSettings) btnSettings.classList.remove('hidden');
    }
}

function toggleNuevoCliente() {
    const cSelect = document.getElementById('cliente-select');
    const cNuevo = document.getElementById('cliente-nuevo-container');
    if (cSelect && cNuevo) {
        if (cSelect.value === 'NUEVO') {
            cNuevo.classList.remove('hidden');
        } else {
            cNuevo.classList.add('hidden');
        }
    }
}

function toggleNuevoProducto() {
    const pSelect = document.getElementById('producto-select');
    const pNuevo = document.getElementById('producto-nuevo');
    if (pSelect && pNuevo) {
        if (pSelect.value === 'NUEVO') {
            pNuevo.classList.remove('hidden');
            pNuevo.focus();
        } else {
            pNuevo.classList.add('hidden');
        }
    }
}

function actualizarInterfaz() {
    const body = document.getElementById('body-tabla');
    if (!body) return;
    const header = document.getElementById('header-tabla');
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



    if (header) {
        header.innerHTML = '';
    }
    const fechaDesde = document.getElementById('filtro-fecha-desde')?.value || '';
    const fechaHasta = document.getElementById('filtro-fecha-hasta')?.value || '';
    const pedidosFiltrados = pedidosActuales.filter((pedido) => {
        const textoMatch = `${pedido.cliente} ${pedido.producto}`.toLowerCase().includes(query);
        if (!textoMatch) return false;
        if (fechaDesde || fechaHasta) {
            const fechaPedido = new Date(pedido.creado_en).toISOString().split('T')[0];
            if (fechaDesde && fechaPedido < fechaDesde) return false;
            if (fechaHasta && fechaPedido > fechaHasta) return false;
        }
        return true;
    });

    pedidosFiltrados.forEach((pedido) => {
        const fechaTexto = new Date(pedido.creado_en).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
        body.innerHTML += `
            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col md:grid md:grid-cols-12 md:items-center gap-4 hover:shadow-md transition-shadow">
                <div class="md:col-span-4">
                    <p class="text-sm text-slate-900 dark:text-white truncate">${pedido.cliente}</p>
                    <p class="text-[10px] text-slate-500 uppercase mt-0.5 truncate">${pedido.producto} &bull; ${fechaTexto}</p>
                </div>
                <div class="md:col-span-3 md:text-center text-sm text-slate-900 dark:text-slate-500">
                    S/. ${Number(pedido.precio_total || 0).toFixed(2)}
                </div>
                <div class="md:col-span-2 md:text-center">
                    <span class="px-3 py-1 rounded-full text-[10px]  ${pedido.entregado ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}">${pedido.entregado ? 'LISTO' : 'PENDIENTE'}</span>
                </div>
                <div class="md:col-span-3 flex items-center md:justify-end gap-2">
                    <button onclick="enviarWhatsApp('${pedido.cliente}','${pedido.producto}',${pedido.precio_total}, ${pedido.entregado})" class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors" title="WhatsApp">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793 0-.853.448-1.273.607-1.446.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.101-.177.211-.077.383.101.173.448.738.961 1.193.661.587 1.216.768 1.39.853.173.087.275.072.376-.044.101-.116.434-.506.549-.68.116-.173.231-.144.39-.087s1.011.477 1.184.564c.173.087.289.13.332.202.045.072.045.419-.1.824z"/></svg>
                    </button>
                    <button onclick="clonarVenta(${pedido.id})" class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors" title="Clonar Pedido">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                    </button>
                    <button onclick="generarReciboPDF(${pedido.id})" class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title="Recibo">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 3v4h4" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 13h10" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17h7" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h10" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 21h14a2 2 0 0 0 2-2V8l-6-5H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"/></svg>
                    </button>
                    ${!pedido.entregado ? `<button onclick="marcarEntregado(${pedido.id})" class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30  transition-colors" title="Listo"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></button>` : ''}
                    ${window.userRol !== 'repartidor' ? `<button onclick="eliminarPedido(${pedido.id})" class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" title="Eliminar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>` : ''}
                </div>
            </div>`;
    });

    if (pedidosFiltrados.length === 0) {
        body.innerHTML = `<div class="text-center text-slate-500 p-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">No hay pedidos registrados.</div>`;
    }

    renderChart(pendientes, listos);
}

function actualizarGastos() {
    const body = document.getElementById('body-gastos');
    if (!body) return;
    const query = document.getElementById('buscador-gastos')?.value.toLowerCase() || '';
    body.innerHTML = '';

    let totalVentas = pedidosActuales.reduce((sum, pedido) => sum + Number(pedido.precio_total || 0), 0);
    let totalGastos = 0;

    const gastosFiltrados = gastosActuales.filter((gasto) => gasto.descripcion.toLowerCase().includes(query));
    gastosFiltrados.forEach((gasto) => {
            totalGastos += Number(gasto.monto || 0);
            const fechaTexto = new Date(gasto.creado_en).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
            body.innerHTML += `
                <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col md:grid md:grid-cols-12 md:items-center gap-4 hover:shadow-md transition-shadow">
                    <div class="md:col-span-6">
                        <p class="text-sm text-slate-900 dark:text-white truncate">${gasto.descripcion}</p>
                        <p class="text-[10px] text-slate-500 uppercase mt-0.5">${fechaTexto}</p>
                    </div>
                    <div class="md:col-span-3 md:text-center text-sm text-slate-900 dark:text-white">
                        S/. ${Number(gasto.monto).toFixed(2)}
                    </div>
                    <div class="md:col-span-3 flex justify-start md:justify-center">
                        <button onclick="eliminarGasto(${gasto.id})" class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" title="Eliminar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                </div>`;
        });

    if (gastosFiltrados.length === 0) {
        body.innerHTML = `<div class="text-center text-slate-500 p-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">No hay gastos registrados.</div>`;
    }

    if (window.renderVentasMesChart) { setTimeout(() => {
        window.renderVentasMesChart(pedidosActuales); }, 50);
    }

}

function actualizarInventario() {
    const bodyInventario = document.getElementById('body-inventario');
    const bodyProveedores = document.getElementById('body-proveedores');
    if (!bodyInventario || !bodyProveedores) return;
    bodyInventario.innerHTML = '';
    bodyProveedores.innerHTML = '';

    const totalStock = inventarioActual.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    if (inventarioActual.length === 0) {
        bodyInventario.innerHTML = `<div class="text-center text-slate-500 p-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">No hay productos en el inventario.</div>`;
    } else {
        inventarioActual.forEach((item) => {
            bodyInventario.innerHTML += `
                <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col md:grid md:grid-cols-12 md:items-center gap-4 hover:shadow-md transition-shadow">
                    <div class="md:col-span-5 text-sm text-slate-900 dark:text-white truncate">
                        ${item.nombre}
                    </div>
                    <div class="md:col-span-3 md:text-center text-[10px] uppercase  text-slate-500 dark:text-slate-400">
                        ${item.categoria || 'SIN CATEGORÃƒÂA'}
                    </div>
                    <div class="md:col-span-2 md:text-center text-sm text-slate-800 dark:text-slate-100">
                        ${item.stock}
                    </div>
                    <div class="md:col-span-2 flex justify-start md:justify-center">
                        <button onclick="eliminarInventario('${item.id}')" class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" title="Eliminar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                </div>`;
        });
    }

    if (proveedoresActual.length === 0) {
        bodyProveedores.innerHTML = `<div class="text-center text-slate-500 p-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">No hay proveedores registrados.</div>`;
    } else {
        proveedoresActual.forEach((proveedor) => {
            bodyProveedores.innerHTML += `
                <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col md:grid md:grid-cols-12 md:items-center gap-4 hover:shadow-md transition-shadow">
                    <div class="md:col-span-9 text-sm text-slate-900 dark:text-white truncate">
                        ${proveedor.nombre}
                    </div>
                    <div class="md:col-span-3 flex justify-start md:justify-center">
                        <button onclick="eliminarProveedor('${proveedor.id}')" class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" title="Eliminar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                </div>`;
        });
    }

}

function filtrarGastos() {
    actualizarGastos();
}

function filtrarPP() {
    actualizarPlanproducción();
}

function actualizarPlanproducción() {
    const body = document.getElementById('body-pp');
    if (!body) return;
    const query = document.getElementById('buscador-pp')?.value.toLowerCase() || '';
    body.innerHTML = '';

    let totalOrdenes = 0;
    let totalCantidad = 0;

    const ordenesFiltradas = ppActual.filter((orden) => {
        const text = `${orden.producto} ${orden.estado}`.toLowerCase();
        return text.includes(query) || String(orden.cantidad).includes(query) || orden.id.toLowerCase().includes(query);
    });

    ordenesFiltradas.forEach((orden) => {
        totalOrdenes += 1;
        totalCantidad += Number(orden.cantidad || 0);
        const colorEstado = orden.estado === 'COMPLETADO' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : orden.estado === 'EN_PROCESO' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-600 bg-slate-100 dark:bg-slate-800';
        body.innerHTML += `
            <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col md:grid md:grid-cols-12 md:items-center gap-4 hover:shadow-md transition-shadow">
                <div class="md:col-span-3 text-sm text-slate-900 dark:text-white truncate">
                    ${orden.id}
                </div>
                <div class="md:col-span-3">
                    <p class="text-sm text-slate-900 dark:text-white truncate">${orden.producto}</p>
                    <p class="text-[10px] text-slate-500 uppercase mt-0.5">Cant: <span class="text-sm text-slate-900 dark:text-white">${orden.cantidad}</span></p>
                </div>
                <div class="md:col-span-2 md:text-center text-[10px] text-slate-500 ">
                    ${orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString() : 'N/A'}
                </div>
                <div class="md:col-span-2 md:text-center">
                    <span class="px-3 py-1 rounded-full text-[10px]  ${colorEstado}">${orden.estado}</span>
                </div>
                <div class="md:col-span-2 flex justify-start md:justify-center gap-2">
                    <button onclick="avanzarEstadoPP('${orden.id}')" class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Avanzar Estado"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></button>
                    <button onclick="eliminarOrdenPP('${orden.id}')" class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" title="Eliminar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
            </div>`;
    });

    if (ordenesFiltradas.length === 0) {
        body.innerHTML = `<div class="text-center text-slate-500 p-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">No hay órdenes registradas.</div>`;
    }
}

function actualizarTema() {
    const isDark = document.documentElement.classList.contains('dark');
    const toggleBtns = [
        document.getElementById('btn-theme-toggle'),
        document.getElementById('btn-theme-toggle-mobile')
    ];

    toggleBtns.forEach(toggleBtn => {
        if (toggleBtn) {
            if (isDark) {
                // Icono de Luna (Oscuro)
                toggleBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
            } else {
                // Icono de Sol (Claro)
                toggleBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`;
            }
        }
    });
}

function setThemeMode(mode) {
    const isDark = mode === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    actualizarTema();
    if (typeof refreshModuloActual === 'function') refreshModuloActual();
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    setThemeMode(isDark ? 'light' : 'dark');
}

function enviarWhatsApp(cliente, producto, total, estadoPedido = 'PENDIENTE') {
    const estado = estadoPedido ? 'LISTO para entrega/recojo' : 'PENDIENTE de preparación';
    const empresa = window.configuracionGlobal?.nombre_empresa || 'Nuestra Empresa';
    const mensaje = `Hola ${cliente}! Somos ${empresa}. Te confirmamos que tu pedido de ${producto} por el monto de S/. ${total.toFixed(2)} se encuentra ${estado}. Gracias por tu preferencia!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`, '_blank');
}

function generarReciboPDF(idPedido) {
    const pedido = pedidosDB.find((item) => String(item.id) === String(idPedido));
    if (!pedido) {
        alert('No se encontrÃƒÂ³ el pedido');
        return;
    }

    const total = Number(pedido.precio_total) || 0;
    const { subtotal, igv } = totalToSubtotalIGV(total);
    const fecha = new Date(pedido.creado_en).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const estado = pedido.entregado ? 'LISTO' : 'PENDIENTE';
    const empresa = window.configuracionGlobal?.nombre_empresa || 'Mi Empresa';
    const rucEmpresa = window.configuracionGlobal?.ruc || '10000000000';
    
    const tipoComprobante = pedido.tipo_comprobante || 'Nota de Venta';
    const numeroComprobante = pedido.numero_comprobante || `#${idPedido}`;
    
    let tituloDocumento = 'NOTA DE VENTA';
    if (tipoComprobante === 'Factura') tituloDocumento = 'FACTURA ELECTRÃƒâ€œNICA';
    if (tipoComprobante === 'Boleta') tituloDocumento = 'BOLETA DE VENTA ELECTRÃƒâ€œNICA';
    
    const clienteObj = pedido.clientes || {};
    const clienteDocTexto = clienteObj.tipo_documento && clienteObj.numero_documento 
        ? ` - ${clienteObj.tipo_documento}: ${clienteObj.numero_documento}` 
        : '';
    const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;

    if (!jsPDFConstructor) {
        alert('No se pudo generar el recibo: jsPDF no estÃƒÂ¡ disponible.');
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
        
        doc.setFontSize(10);
        doc.setTextColor('#666666');
        doc.text(`RUC: ${rucEmpresa}`, margin, y + 6);

        y += 14;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#111111');
        doc.text(tituloDocumento, margin, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Comprobante: ${numeroComprobante}`, margin, y);
        doc.text(`Fecha: ${fecha}`, pageWidth - margin, y, { align: 'right' });

        y += 8;
        doc.setDrawColor(13, 110, 253);
        doc.setLineWidth(0.6);
        doc.line(margin, y, pageWidth - margin, y);

        y += 10;
        const clienteLines = doc.splitTextToSize(`Cliente: ${pedido.cliente}${clienteDocTexto}`, pageWidth - margin * 2);
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
        const footerLines = doc.splitTextToSize(`Representación impresa de la ${tituloDocumento}. \nGracias por tu compra - ${empresa}`, pageWidth - margin * 2);
        doc.text(footerLines, margin, y);

        const fileName = `${tipoComprobante}_${empresa.replace(/\s+/g, '_')}_${numeroComprobante.replace('#', '')}.pdf`;
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

// --- MÃ³dulo CRM (Clientes Avanzado) ---

function actualizarCRM() {
    const body = document.getElementById('body-crm');
    if (!body) return;
    const query = document.getElementById('buscador-crm')?.value.toLowerCase() || '';
    
    // Filtrar clientes
    const clientesFiltrados = clientesDB.filter(c => {
        const n = (c.nombre || '').toLowerCase();
        const d = (c.numero_documento || '').toLowerCase();
        return n.includes(query) || d.includes(query);
    });

    body.innerHTML = '';

    if (clientesFiltrados.length === 0) {
        body.innerHTML = `<div class="col-span-full text-center text-slate-500 p-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">No se encontraron clientes.</div>`;
        return;
    }

    clientesFiltrados.forEach(cliente => {
        const primeraLetra = (cliente.nombre || 'C').charAt(0).toUpperCase();
        body.innerHTML += `
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow cursor-pointer flex items-start gap-4 relative group" onclick="abrirHistorialCliente('${cliente.id}')">
            <button onclick="event.stopPropagation(); eliminarClienteDirecto('${cliente.id}')" class="absolute top-3 right-3 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full" title="Eliminar Cliente">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
            <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl shrink-0">${primeraLetra}</div>
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-800 dark:text-white truncate">${cliente.nombre}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">${cliente.tipo_documento || 'DNI'}: ${cliente.numero_documento || '---'}</p>
                <div class="mt-2 flex flex-col gap-1">
                    ${cliente.telefono ? `<p class="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 truncate"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg> ${cliente.telefono}</p>` : ''}
                </div>
            </div>
        </div>`;
    });
}

function abrirModalNuevoCliente() {
    document.getElementById('crm-cliente-id').value = '';
    document.getElementById('crm-nombre').value = '';
    document.getElementById('crm-tipo-doc').value = 'DNI';
    document.getElementById('crm-num-doc').value = '';
    document.getElementById('crm-telefono').value = '';
    document.getElementById('crm-direccion').value = '';
    document.getElementById('crm-notas').value = '';
    
    document.getElementById('btn-eliminar-cliente').classList.add('hidden');
    document.getElementById('modal-cliente-titulo').innerHTML = `<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> Registrar Cliente`;
    
    document.getElementById('modal-nuevo-cliente').classList.remove('hidden');
}

function abrirModalEditarCliente(clienteId) {
    const cliente = clientesDB.find(c => String(c.id) === String(clienteId));
    if(!cliente) return;
    
    document.getElementById('crm-cliente-id').value = cliente.id;
    document.getElementById('crm-nombre').value = cliente.nombre || '';
    document.getElementById('crm-tipo-doc').value = cliente.tipo_documento || 'DNI';
    document.getElementById('crm-num-doc').value = cliente.numero_documento || '';
    document.getElementById('crm-telefono').value = cliente.telefono || '';
    document.getElementById('crm-direccion').value = cliente.direccion || '';
    document.getElementById('crm-notas').value = cliente.notas || '';
    
    document.getElementById('btn-eliminar-cliente').classList.remove('hidden');
    document.getElementById('modal-cliente-titulo').innerHTML = `<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg> Editar Cliente`;
    
    document.getElementById('modal-nuevo-cliente').classList.remove('hidden');
    cerrarHistorialCliente();
}

function cerrarModalCliente() {
    document.getElementById('modal-nuevo-cliente').classList.add('hidden');
}

function cerrarHistorialCliente() {
    document.getElementById('modal-historial-cliente').classList.add('hidden');
}

function abrirHistorialCliente(clienteId) {
    const cliente = clientesDB.find(c => String(c.id) === String(clienteId));
    if(!cliente) return;

    // Set header info
    document.getElementById('historial-avatar').textContent = (cliente.nombre || 'C').charAt(0).toUpperCase();
    document.getElementById('historial-nombre').textContent = cliente.nombre;
    document.getElementById('historial-doc').textContent = `${cliente.tipo_documento || 'DNI'}: ${cliente.numero_documento || '---'}`;
    
    document.getElementById('historial-telefono').textContent = `Tel: ${cliente.telefono || '---'}`;
    document.getElementById('historial-direccion').textContent = `Dir: ${cliente.direccion || '---'}`;
    
    const notasBox = document.getElementById('historial-notas-box');
    if (cliente.notas) {
        document.getElementById('historial-notas').textContent = cliente.notas;
        notasBox.classList.remove('hidden');
    } else {
        notasBox.classList.add('hidden');
    }

    // Calcular stats de compras
    const pedidosDelCliente = pedidosActuales.filter(p => String(p.cliente_id) === String(cliente.id));
    
    let totalGastado = 0;
    pedidosDelCliente.forEach(p => { totalGastado += Number(p.precio_total || 0); });
    
    document.getElementById('historial-total-pedidos').textContent = pedidosDelCliente.length;
    document.getElementById('historial-total-gastado').textContent = window.configuracionGlobal?.moneda + ' ' + totalGastado.toFixed(2);

    // Renderizar lista de pedidos
    const lista = document.getElementById('historial-pedidos-lista');
    lista.innerHTML = '';
    
    if (pedidosDelCliente.length === 0) {
        lista.innerHTML = `<div class="text-center text-slate-500 py-6 text-sm">Este cliente aÃºn no tiene compras registradas.</div>`;
    } else {
        pedidosDelCliente.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en)).forEach(p => {
            const fecha = new Date(p.creado_en).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' });
            lista.innerHTML += `
            <div class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <p class="font-semibold text-slate-800 dark:text-white text-sm">${p.producto}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">${fecha} &bull; Cantidad: ${p.cantidad || 1}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-blue-600 dark:text-blue-400">${window.configuracionGlobal?.moneda} ${Number(p.precio_total).toFixed(2)}</p>
                    <span class="text-[10px] px-2 py-0.5 rounded-full ${p.entregado ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}">${p.entregado ? 'Entregado' : 'Pendiente'}</span>
                </div>
            </div>`;
        });
    }

    // Cambiar acciÃ³n del botÃ³n editar en el modal
    const headerTitle = document.getElementById('historial-nombre');
    const editBtn = document.createElement('button');
    editBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>`;
    editBtn.className = "ml-3 text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-lg transition-colors";
    editBtn.onclick = () => abrirModalEditarCliente(cliente.id);
    
    // Clean old edit buttons
    const oldBtn = headerTitle.parentElement.querySelector('button');
    if(oldBtn) oldBtn.remove();
    headerTitle.parentElement.appendChild(editBtn);
    headerTitle.parentElement.classList.add('flex', 'items-center');

    document.getElementById('modal-historial-cliente').classList.remove('hidden');
}

window.actualizarCRM = actualizarCRM;
window.abrirModalNuevoCliente = abrirModalNuevoCliente;
window.cerrarModalCliente = cerrarModalCliente;
window.abrirModalEditarCliente = abrirModalEditarCliente;
window.abrirHistorialCliente = abrirHistorialCliente;
window.cerrarHistorialCliente = cerrarHistorialCliente;

// Asegura que las funciones invocadas desde los botones sean accesibles globalmente
window.cambiarModulo = cambiarModulo;
window.aplicarPermisosUI = aplicarPermisosUI;

window.actualizarTema = actualizarTema;
window.toggleTheme = toggleTheme;
window.enviarWhatsApp = enviarWhatsApp;
window.generarReciboPDF = generarReciboPDF;
window.filtrarGastos = filtrarGastos;
window.filtrarPP = filtrarPP;
window.actualizarGastos = actualizarGastos;
window.actualizarInventario = actualizarInventario;
window.actualizarPlanproducción = actualizarPlanproducción;
window.guardarInventario = guardarInventario;
window.guardarProveedor = guardarProveedor;
window.guardarOrdenPP = guardarOrdenPP;
window.eliminarInventario = eliminarInventario;
window.eliminarProveedor = eliminarProveedor;
window.eliminarOrdenPP = eliminarOrdenPP;
window.addEventListener('DOMContentLoaded', actualizarTema);













