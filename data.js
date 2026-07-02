// Estado global de datos
let pedidosDB = [];
let gastosDB = [];
let inventarioDB = [];
let proveedoresDB = [];
let ppDB = [];
let clientesDB = [];
let pedidosActuales = [];
let gastosActuales = [];
let inventarioActual = [];
let proveedoresActual = [];
let ppActual = [];

// Configuración global (Marca Blanca)
window.configuracionGlobal = {
    nombre_empresa: 'Mi Empresa',
    ruc: '',
    direccion: '',
    telefono: ''
};

async function cargarTodo() {
    const { data: pedidos } = await _supabase.from('pedidos').select('*, clientes(*)').order('creado_en', { ascending: false }).limit(500);
    const { data: gastos } = await _supabase.from('gastos').select('*').order('creado_en', { ascending: false }).limit(500);
    const { data: clientes } = await _supabase.from('clientes').select('*').order('nombre');

    pedidosDB = (pedidos || []).map((p) => ({
        ...p,
        cliente: p.clientes ? p.clientes.nombre : p.cliente
    }));
    gastosDB = gastos || [];
    clientesDB = clientes || [];

    const clienteSelect = document.getElementById('cliente-select');
    if (clienteSelect) {
        const selectedValue = clienteSelect.value;
        clienteSelect.innerHTML = '<option value="">Seleccionar cliente</option><option value="NUEVO">+ Cliente Nuevo</option>';
        clientesDB.forEach((c) => {
            clienteSelect.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
        });
        clienteSelect.value = selectedValue;
    }

    await cargarInventario();
    await cargarPP();
    await cargarConfiguracion();
    aplicarFiltros();
    if (typeof refreshModuloActual === 'function') refreshModuloActual();
}

async function cargarInventario() {
    inventarioDB = [];
    proveedoresDB = [];

    try {
        const { data: inventario } = await _supabase.from('inventario').select('*').order('creado_en', { ascending: false }).limit(1000);
        inventarioDB = inventario || [];
    } catch (error) {
        console.warn('Tabla inventario no disponible:', error);
        inventarioDB = [];
    }

    try {
        const { data: proveedores } = await _supabase.from('proveedores').select('*').order('creado_en', { ascending: false }).limit(500);
        proveedoresDB = proveedores || [];
    } catch (error) {
        console.warn('Tabla proveedores no disponible:', error);
        proveedoresDB = [];
    }

    inventarioActual = [...inventarioDB];
    proveedoresActual = [...proveedoresDB];
}

async function cargarPP() {
    ppDB = [];

    try {
        const { data: ordenes } = await _supabase.from('plan_produccion').select('*').order('creado_en', { ascending: false }).limit(500);
        ppDB = ordenes || [];
    } catch (error) {
        console.warn('Tabla plan_produccion no disponible:', error);
    }

    const productoSelect = document.getElementById('producto-select');
    const ppProductoSelect = document.getElementById('pp-producto');
    
    if (productoSelect || ppProductoSelect) {
        const selectedProd = productoSelect ? productoSelect.value : '';
        const ppSelectedProd = ppProductoSelect ? ppProductoSelect.value : '';
        
        let options = '<option value="">Seleccionar producto (Inventario)</option>';
        inventarioDB.forEach(item => {
            options += `<option value="${item.id}">${item.nombre} (Stock: ${item.stock})</option>`;
        });
        
        if (productoSelect) {
            productoSelect.innerHTML = options;
            productoSelect.value = selectedProd;
        }
        if (ppProductoSelect) {
            ppProductoSelect.innerHTML = options;
            ppProductoSelect.value = ppSelectedProd;
        }
    }


    ppActual = [...ppDB];
}

function aplicarFiltros() {
    const filtroSelect = document.getElementById('filtro-fecha');
    const filtro = filtroSelect ? filtroSelect.value : 'todos';
    const hoy = new Date();

    const filtrarPorFecha = (items) => {
        if (filtro === 'todos') return items;
        return items.filter((item) => {
            const fechaItem = new Date(item.creado_en);
            if (filtro === 'hoy') {
                return fechaItem.getDate() === hoy.getDate() && fechaItem.getMonth() === hoy.getMonth() && fechaItem.getFullYear() === hoy.getFullYear();
            }
            if (filtro === 'mes') {
                return fechaItem.getMonth() === hoy.getMonth() && fechaItem.getFullYear() === hoy.getFullYear();
            }
            if (filtro === 'semana1') {
                const hace1Sem = new Date(hoy);
                hace1Sem.setDate(hace1Sem.getDate() - 7);
                return fechaItem >= hace1Sem && fechaItem <= hoy;
            }
            if (filtro === 'semana2') {
                const hace2Sem = new Date(hoy);
                hace2Sem.setDate(hace2Sem.getDate() - 14);
                return fechaItem >= hace2Sem && fechaItem <= hoy;
            }
            if (filtro === 'semana4') {
                const hace4Sem = new Date(hoy);
                hace4Sem.setDate(hace4Sem.getDate() - 28);
                return fechaItem >= hace4Sem && fechaItem <= hoy;
            }
            return true;
        });
    };

    pedidosActuales = filtrarPorFecha(pedidosDB);
    gastosActuales = filtrarPorFecha(gastosDB);
    if (typeof refreshModuloActual === 'function') {
        refreshModuloActual();
    } else {
        actualizarInterfaz();
    }
}

async function guardarPedido() {
    const clienteSelect = document.getElementById('cliente-select');
    let clienteId = clienteSelect.value;
    const productoSelect = document.getElementById('producto-select');
    let inventarioId = productoSelect.value;
    let productoText = '';
    
    if (inventarioId === 'NUEVO') {
        productoText = document.getElementById('producto-nuevo').value.trim();
        inventarioId = null;
        if (!productoText) {
            Swal.fire('Atención', 'Por favor, ingresa el nombre del producto libre.', 'warning');
            return;
        }
    } else {
        productoText = inventarioId ? productoSelect.options[productoSelect.selectedIndex].text.split(' (Stock')[0] : '';
    }

    const cantidad = parseInt(document.getElementById('cantidad').value) || 1;
    const precio = parseFloat(document.getElementById('precio').value);
    
    let nombreClienteText = '';
    const tipoComprobante = document.getElementById('tipo-comprobante') ? document.getElementById('tipo-comprobante').value : 'Nota de Venta';
    
    // Generar un número de comprobante básico por ahora (luego se puede vincular a un correlativo real)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefijo = tipoComprobante === 'Factura' ? 'F001' : tipoComprobante === 'Boleta' ? 'B001' : 'T001';
    const numeroComprobante = `${prefijo}-${randomNum}`;

    if (clienteId === 'NUEVO') {
        const nuevoNombre = document.getElementById('cliente-nuevo').value.trim();
        const tipoDoc = document.getElementById('tipo-documento') ? document.getElementById('tipo-documento').value : 'DNI';
        const numDoc = document.getElementById('numero-documento') ? document.getElementById('numero-documento').value.trim() : '';
        
        if (!nuevoNombre || (!inventarioId && productoText === '') || !precio) {
            Swal.fire('Atención', 'Por favor, completa todos los campos del pedido.', 'warning');
            return;
        }
        
        const { data: nuevoC, error: errC } = await _supabase.from('clientes').insert([{ 
            nombre: nuevoNombre,
            tipo_documento: tipoDoc,
            numero_documento: numDoc
        }]).select();
        if (errC || !nuevoC || nuevoC.length === 0) {
            console.error("Error al crear cliente:", errC);
            Swal.fire('Error', 'No se pudo crear el cliente. Verifica si has agregado las columnas en Supabase: ' + (errC ? errC.message : 'Error desconocido'), 'error');
            return;
        }
        clienteId = nuevoC[0].id;
        nombreClienteText = nuevoNombre;
    } else if (!clienteId || (!inventarioId && productoText === '') || !precio) {
        Swal.fire('Atención', 'Por favor, completa todos los campos del pedido.', 'warning');
        return;
    } else {
        nombreClienteText = clienteSelect.options[clienteSelect.selectedIndex].text;
    }

    const { error } = await _supabase.from('pedidos').insert([{ 
        cliente_id: clienteId, 
        cliente: nombreClienteText, 
        producto: productoText, 
        inventario_id: inventarioId,
        cantidad: cantidad,
        precio_total: precio, 
        entregado: false,
        tipo_comprobante: tipoComprobante,
        numero_comprobante: numeroComprobante
    }]);
    
    if (error) {
        Swal.fire('Error', 'No se pudo guardar el pedido.', 'error');
        return;
    }

    Swal.fire({ title: '¡Éxito!', text: 'Pedido registrado correctamente.', icon: 'success', timer: 1500, showConfirmButton: false });
    
    clienteSelect.value = '';
    const clienteNuevoInput = document.getElementById('cliente-nuevo');
    const clienteNuevoContainer = document.getElementById('cliente-nuevo-container');
    if (clienteNuevoInput) clienteNuevoInput.value = '';
    if (document.getElementById('numero-documento')) document.getElementById('numero-documento').value = '';
    if (clienteNuevoContainer) clienteNuevoContainer.classList.add('hidden');
    
    productoSelect.value = '';
    const productoNuevoInput = document.getElementById('producto-nuevo');
    if (productoNuevoInput) {
        productoNuevoInput.value = '';
        productoNuevoInput.classList.add('hidden');
    }

    document.getElementById('cantidad').value = '1';
    document.getElementById('precio').value = '';
    cargarTodo();
}

async function guardarGasto() {
    const descripcion = document.getElementById('gasto-desc').value;
    const monto = parseFloat(document.getElementById('gasto-monto').value);

    if (!descripcion || !monto) {
        Swal.fire('Atención', 'Por favor, ingresa la descripción y el monto del gasto.', 'warning');
        return;
    }

    const { error } = await _supabase.from('gastos').insert([{ descripcion, monto }]);
    
    if (error) {
        Swal.fire('Error', 'No se pudo guardar el gasto.', 'error');
        return;
    }

    Swal.fire({ title: '¡Éxito!', text: 'Gasto registrado correctamente.', icon: 'success', timer: 1500, showConfirmButton: false });
    
    document.getElementById('gasto-desc').value = '';
    document.getElementById('gasto-monto').value = '';
    cargarTodo();
}

async function guardarInventario() {
    const nombre = document.getElementById('producto-nombre').value.trim();
    const stock = parseInt(document.getElementById('producto-stock').value, 10);
    const categoriaEl = document.getElementById('producto-categoria');
    const categoria = categoriaEl ? categoriaEl.value : 'PRODUCTO_TERMINADO';

    if (!nombre || !Number.isFinite(stock)) {
        Swal.fire('Atención', 'Por favor, ingresa el nombre y el stock válido.', 'warning');
        return;
    }

    try {
        const { data: nuevoInventario, error } = await _supabase.from('inventario').insert([{ nombre, stock, categoria }]).select();
        if (error) throw error;
        inventarioDB.unshift(nuevoInventario[0]);
        inventarioActual = [...inventarioDB];
        Swal.fire({ title: '¡Éxito!', text: 'Producto agregado al inventario.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
        console.warn('No se pudo guardar inventario en la base de datos. Usando estado local.', error);
        Swal.fire('Advertencia', 'Guardado localmente. Revisa la conexión a la base de datos.', 'warning');
        const nuevo = { id: `inv-${Date.now()}`, nombre, stock, categoria };
        inventarioDB.unshift(nuevo);
        inventarioActual = [...inventarioDB];
    }

    document.getElementById('producto-nombre').value = '';
    document.getElementById('producto-stock').value = '';
    if (categoriaEl) categoriaEl.value = 'PRODUCTO_TERMINADO';
    actualizarInventario();
}

async function guardarProveedor() {
    const nombre = document.getElementById('proveedor-nombre').value.trim();
    
    if (!nombre) {
        Swal.fire('Atención', 'Por favor, ingresa el nombre del proveedor.', 'warning');
        return;
    }
    
    try {
        const { data: nuevoProveedor, error } = await _supabase.from('proveedores').insert([{ nombre }]).select();
        if (error) throw error;
        proveedoresDB.unshift(nuevoProveedor[0]);
        proveedoresActual = [...proveedoresDB];
        Swal.fire({ title: '¡Éxito!', text: 'Proveedor registrado correctamente.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
        console.warn('No se pudo guardar proveedor en la base de datos. Usando estado local.', error);
        Swal.fire('Advertencia', 'Guardado localmente. Revisa la conexión a la base de datos.', 'warning');
        const nuevo = { id: `prov-${Date.now()}`, nombre };
        proveedoresDB.unshift(nuevo);
        proveedoresActual = [...proveedoresDB];
    }

    document.getElementById('proveedor-nombre').value = '';
    actualizarInventario();
}

async function guardarOrdenPP() {
    const selectProd = document.getElementById('pp-producto');
    const inventario_id = selectProd.value;
    const productoText = selectProd.options[selectProd.selectedIndex]?.text.split(' (')[0] || '';
    const cantidad = parseInt(document.getElementById('pp-cantidad').value, 10);
    const fechaEntrega = document.getElementById('pp-fecha').value;
    const estado = document.getElementById('pp-estado').value;

    if (!inventario_id || !Number.isFinite(cantidad) || !fechaEntrega || !estado) {
        Swal.fire('Atención', 'Por favor, completa todos los datos de la orden de producción.', 'warning');
        return;
    }

    try {
        const { data: nuevaOrden, error } = await _supabase.from('plan_produccion').insert([{ producto: productoText, cantidad, fecha_entrega: fechaEntrega, estado, inventario_id }]).select();
        if (error) throw error;
        ppDB.unshift(nuevaOrden[0]);
        ppActual = [...ppDB];
        Swal.fire({ title: '¡Éxito!', text: 'Orden de producción creada.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
        console.warn('No se pudo guardar orden PP en la base de datos. Usando estado local.', error);
        Swal.fire('Advertencia', 'Guardado localmente. Revisa la conexión a la base de datos.', 'warning');
        const nuevaOrden = {
            id: `pp-${Date.now()}`,
            producto,
            cantidad,
            fecha_entrega: fechaEntrega,
            estado
        };
        ppDB.unshift(nuevaOrden);
        ppActual = [...ppDB];
    }

    document.getElementById('pp-producto').value = '';
    document.getElementById('pp-cantidad').value = '';
    document.getElementById('pp-fecha').value = '';
    document.getElementById('pp-estado').value = 'EN_PROCESO';
    actualizarPlanProduccion();
}

async function eliminarOrdenPP(id) {
    try {
        const { error } = await _supabase.from('plan_produccion').delete().eq('id', id);
        if (error) throw error;
    } catch (error) {
        console.warn('No se pudo eliminar orden PP de la base de datos. Eliminando en estado local.', error);
    }

    ppDB = ppDB.filter((orden) => orden.id !== id);
    ppActual = ppActual.filter((orden) => orden.id !== id);
    actualizarPlanProduccion();
}

async function eliminarInventario(id) {
    try {
        const { error } = await _supabase.from('inventario').delete().eq('id', id);
        if (error) throw error;
    } catch (error) {
        console.warn('No se pudo eliminar inventario de la base de datos. Eliminando en estado local.', error);
    }

    inventarioDB = inventarioDB.filter((item) => item.id !== id);
    inventarioActual = inventarioActual.filter((item) => item.id !== id);
    actualizarInventario();
}

async function eliminarProveedor(id) {
    try {
        const { error } = await _supabase.from('proveedores').delete().eq('id', id);
        if (error) throw error;
    } catch (error) {
        console.warn('No se pudo eliminar proveedor de la base de datos. Eliminando en estado local.', error);
    }

    proveedoresDB = proveedoresDB.filter((item) => item.id !== id);
    proveedoresActual = proveedoresActual.filter((item) => item.id !== id);
    actualizarInventario();
}

async function marcarEntregado(id) {
    await _supabase.from('pedidos').update({ entregado: true }).eq('id', id);
    cargarTodo();
}

async function eliminarPedido(id) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Se eliminará este pedido.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        const { error } = await _supabase.from('pedidos').delete().eq('id', id);
        if (!error) {
            Swal.fire('Eliminado', 'El pedido ha sido eliminado.', 'success');
            cargarTodo();
        } else {
            Swal.fire('Error', 'No se pudo eliminar el pedido.', 'error');
        }
    }
}

async function eliminarGasto(id) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Se eliminará este gasto.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        const { error } = await _supabase.from('gastos').delete().eq('id', id);
        if (!error) {
            Swal.fire('Eliminado', 'El gasto ha sido eliminado.', 'success');
            cargarTodo();
        } else {
            Swal.fire('Error', 'No se pudo eliminar el gasto.', 'error');
        }
    }
}

function toggleNuevoCliente() {
    const clienteSelect = document.getElementById('cliente-select');
    const clienteNuevoInput = document.getElementById('cliente-nuevo');
    clienteSelect.value === 'NUEVO' ? clienteNuevoInput.classList.remove('hidden') : clienteNuevoInput.classList.add('hidden');
}

function filtrarPedidos() {
    actualizarInterfaz();
}

async function finalizarProduccion(id) {
    const orden = ppDB.find((o) => String(o.id) === String(id));
    if (!orden) {
        alert('Orden no encontrada');
        return;
    }

    const insumos = inventarioDB.filter((i) => (i.categoria || '').toUpperCase() === 'INSUMO');
    if (insumos.length === 0) {
        await Swal.fire('Sin insumos', 'No hay insumos registrados en el inventario para consumir.', 'warning');
        return;
    }

    const crearFila = (idx) => `
        <div class="sw-row grid grid-cols-[1.5fr_1fr_auto] gap-3 items-center mb-3" data-row="${idx}">
            <select class="swal2-input sw-insumo-select" style="padding: 14px; border-radius: 12px; min-width: 100%;">
                <option value="">Selecciona insumo</option>
                ${insumos.map((item) => `<option value="${item.id}">${item.nombre} (${item.stock})</option>`).join('')}
            </select>
            <input type="number" min="1" placeholder="Cantidad" class="swal2-input sw-insumo-cantidad" style="padding: 14px; border-radius: 12px;" />
            <button type="button" class="swal2-confirm sw-remove-row text-rose-500 " style="background:transparent;border:none;cursor:pointer;font-size:16px;" title="Eliminar">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>`;

    const { value: consumos } = await Swal.fire({
        title: 'Finalizar Producción',
        html: `
            <div class="text-left mb-4">
                <p class="text-sm text-slate-600 dark:text-slate-200">Seleccione los insumos consumidos y su cantidad. El stock disponible se muestra entre paréntesis.</p>
            </div>
            <div id="sw-insumo-rows"></div>
            <button type="button" id="sw-add-row" class="mt-3 inline-flex items-center justify-center rounded-2xl bg-slate-900 text-white px-4 py-2 text-sm">Agregar insumo</button>
        `,
        showCancelButton: true,
        focusConfirm: false,
        confirmButtonText: 'Finalizar',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
            const container = Swal.getHtmlContainer();
            const rows = container.querySelector('#sw-insumo-rows');
            const addRowBtn = container.querySelector('#sw-add-row');
            let index = 0;

            const appendRow = () => {
                rows.insertAdjacentHTML('beforeend', crearFila(index));
                const newRow = rows.querySelector(`[data-row="${index}"]`);
                const removeBtn = newRow.querySelector('.sw-remove-row');
                removeBtn.addEventListener('click', () => newRow.remove());
                index += 1;
            };

            addRowBtn.addEventListener('click', appendRow);
            appendRow();
        },
        preConfirm: () => {
            const container = Swal.getHtmlContainer();
            const selectedRows = [...container.querySelectorAll('.sw-row')];
            const datos = selectedRows.map((row) => {
                const select = row.querySelector('.sw-insumo-select');
                const qtyInput = row.querySelector('.sw-insumo-cantidad');
                return {
                    id: select?.value,
                    cantidad: Number(qtyInput?.value || 0)
                };
            }).filter((item) => item.id && Number.isFinite(item.cantidad) && item.cantidad > 0);

            if (datos.length === 0) {
                Swal.showValidationMessage('Debes ingresar al menos un insumo consumido.');
                return false;
            }

            for (const fila of datos) {
                const item = insumos.find((i) => String(i.id) === String(fila.id));
                if (!item) {
                    Swal.showValidationMessage('Selección de insumo inválida.');
                    return false;
                }
                if (fila.cantidad > Number(item.stock || 0)) {
                    Swal.showValidationMessage(`Cantidad superior al stock disponible para ${item.nombre}.`);
                    return false;
                }
            }

            return datos;
        }
    });

    if (!consumos) return;

    const consumosAgrupados = consumos.reduce((acc, item) => {
        const key = String(item.id);
        acc[key] = (acc[key] || 0) + item.cantidad;
        return acc;
    }, {});

    for (const idInsumo of Object.keys(consumosAgrupados)) {
        const cantidadConsumida = consumosAgrupados[idInsumo];
        const item = inventarioDB.find((it) => String(it.id) === String(idInsumo));
        if (!item) continue;

        const nuevoStock = Number(item.stock || 0) - cantidadConsumida;
        try {
            const { data, error } = await _supabase.from('inventario').update({ stock: nuevoStock }).eq('id', item.id).select();
            if (error) throw error;
            if (data && data[0]) {
                const idx = inventarioDB.findIndex((it) => String(it.id) === String(item.id));
                if (idx >= 0) inventarioDB[idx] = data[0];
            } else {
                item.stock = nuevoStock;
            }
        } catch (err) {
            console.warn('No se pudo decrementar insumo en la DB, aplicando en estado local', err);
            item.stock = nuevoStock;
        }
    }

    // La actualización del stock del producto terminado ahora se maneja automáticamente
    // mediante un Trigger en la base de datos (supabase-faseC-produccion.sql)
    // cuando el estado de plan_produccion cambia a 'COMPLETADO'.

    try {
        const { error } = await _supabase.from('plan_produccion').update({ estado: 'COMPLETADO' }).eq('id', id);
        if (error) throw error;
    } catch (err) {
        console.warn('No se pudo actualizar estado de orden en DB, actualizando localmente', err);
    }

    const idxOrden = ppDB.findIndex((o) => String(o.id) === String(id));
    if (idxOrden >= 0) ppDB[idxOrden].estado = 'COMPLETADO';
    ppActual = [...ppDB];

    await cargarInventario();
    actualizarPlanProduccion();
    Swal.fire('Listo', 'Producción finalizada y stock actualizado.', 'success');
}

window.finalizarProduccion = finalizarProduccion;

// --- Configuración (Marca Blanca) ---
async function cargarConfiguracion() {
    try {
        const { data: config, error } = await _supabase.from('configuracion').select('*').eq('id', 1).maybeSingle();
        if (config) {
            window.configuracionGlobal = config;
            
            // Actualizar inputs en Settings
            const nameEl = document.getElementById('config-nombre');
            if (nameEl) {
                document.getElementById('config-nombre').value = config.nombre_empresa || '';
                document.getElementById('config-ruc').value = config.ruc || '';
                document.getElementById('config-direccion').value = config.direccion || '';
                document.getElementById('config-telefono').value = config.telefono || '';
            }
            
            // Actualizar UI Header
            const headerName = document.getElementById('empresa-nombre-header');
            const headerLogo = document.getElementById('empresa-logo-inicial');
            if (headerName) headerName.textContent = config.nombre_empresa || 'Mi Empresa';
            if (headerLogo && config.nombre_empresa) {
                headerLogo.textContent = config.nombre_empresa.charAt(0).toUpperCase();
            }
        }
    } catch (error) {
        console.warn('No se pudo cargar configuración:', error);
    }
}

async function guardarConfiguracion() {
    const nombre = document.getElementById('config-nombre').value;
    const ruc = document.getElementById('config-ruc').value;
    const direccion = document.getElementById('config-direccion').value;
    const telefono = document.getElementById('config-telefono').value;

    if (!nombre) {
        alert('El nombre de la empresa es obligatorio');
        return;
    }

    const payload = {
        id: 1,
        nombre_empresa: nombre,
        ruc,
        direccion,
        telefono
    };

    try {
        const { error } = await _supabase.from('configuracion').upsert(payload);
        if (error) throw error;
        
        await cargarConfiguracion();
        if (typeof Swal !== 'undefined') {
            Swal.fire('Guardado', 'Los datos de la empresa se actualizaron correctamente.', 'success');
        } else {
            alert('Configuración guardada.');
        }
    } catch (error) {
        console.error('Error guardando config:', error);
        alert('Error guardando configuración. Verifica tus permisos (Admin).');
    }
}
window.guardarConfiguracion = guardarConfiguracion;

// --- Dashboard Home ---
function actualizarHome() {
    const hoy = new Date();
    const isHoy = (dateStr) => {
        const d = new Date(dateStr);
        return d.getDate() === hoy.getDate() && d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
    };
    const isEsteMes = (dateStr) => {
        const d = new Date(dateStr);
        return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
    };

    // 1. Ventas y Pedidos del día
    let ventasHoy = 0;
    let pedidosEntregadosHoy = 0;
    
    pedidosActuales.forEach(pedido => {
        if (isHoy(pedido.creado_en)) {
            ventasHoy += Number(pedido.precio_total || 0);
            if (pedido.entregado) pedidosEntregadosHoy++;
        }
    });

    // 2. Gastos del mes
    let gastosMes = 0;
    gastosActuales.forEach(gasto => {
        if (isEsteMes(gasto.creado_en)) {
            gastosMes += Number(gasto.monto || 0);
        }
    });

    // 3. Stock e Inventario
    let stockBajoCount = 0;
    const alertasContainer = document.getElementById('alertas-home');
    if (alertasContainer) alertasContainer.innerHTML = '';

    inventarioActual.forEach(item => {
        const stock = Number(item.stock || 0);
        if (stock <= 10) {
            stockBajoCount++;
            if (alertasContainer) {
                alertasContainer.innerHTML += `
                    <div class="flex items-center gap-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 p-4 rounded-2xl shadow-sm">
                        <div class="bg-rose-100 dark:bg-rose-900/40 p-2 rounded-xl">
                            <svg class="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <div>
                            <p class=" text-sm">Alerta de Stock Bajo: ${item.nombre}</p>
                            <p class="text-xs mt-0.5">Solo quedan ${stock} unidades disponibles.</p>
                        </div>
                    </div>
                `;
            }
        }
    });

    // 4. Actualizar DOM
    const elVentas = document.getElementById('home-metric-ventas');
    const elPedidos = document.getElementById('home-metric-pedidos');
    const elStock = document.getElementById('home-metric-stock');
    const elGastos = document.getElementById('home-metric-gastos');

    if (elVentas) elVentas.textContent = 'S/. ' + ventasHoy.toFixed(2);
    if (elPedidos) elPedidos.textContent = pedidosEntregadosHoy;
    if (elStock) elStock.textContent = stockBajoCount;
    if (elGastos) elGastos.textContent = 'S/. ' + gastosMes.toFixed(2);
}
window.actualizarHome = actualizarHome;

window.clonarVenta = async function(id) {
    const { data: pedido, error } = await window.supabaseClient.from('pedidos').select('*').eq('id', id).single();
    if (error || !pedido) {
        Swal.fire('Error', 'No se pudo cargar el pedido para clonar.', 'error');
        return;
    }

    // Autocompletar Cliente
    const clienteSelect = document.getElementById('cliente-select');
    let opcionCliente = Array.from(clienteSelect.options).find(o => o.text === pedido.cliente);
    if (opcionCliente) {
        clienteSelect.value = opcionCliente.value;
        toggleNuevoCliente();
    } else {
        clienteSelect.value = 'NUEVO';
        toggleNuevoCliente();
        document.getElementById('cliente-nuevo').value = pedido.cliente;
    }

    // Autocompletar Producto
    const productoSelect = document.getElementById('producto-select');
    let opcionProducto = Array.from(productoSelect.options).find(o => o.text === pedido.producto);
    if (opcionProducto) {
        productoSelect.value = opcionProducto.value;
        toggleNuevoProducto();
    } else {
        productoSelect.value = 'NUEVO';
        toggleNuevoProducto();
        document.getElementById('producto-nuevo').value = pedido.producto;
    }

    // Autocompletar Precio
    document.getElementById('precio').value = pedido.precio_total;
    document.getElementById('cantidad').value = 1;
    
    Swal.fire({ title: 'Listo para clonar', text: 'Los datos han sido cargados en el formulario.', icon: 'info', timer: 2000, showConfirmButton: false });
};

