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

async function cargarTodo() {
    const { data: pedidos } = await _supabase.from('pedidos').select('*, clientes(nombre)').order('creado_en', { ascending: false }).limit(500);
    const { data: gastos } = await _supabase.from('gastos').select('*').order('creado_en', { ascending: false }).limit(500);
    const { data: clientes } = await _supabase.from('clientes').select('*').order('nombre');

    pedidosDB = (pedidos || []).map((p) => ({
        ...p,
        cliente: p.clientes ? p.clientes.nombre : p.cliente
    }));
    gastosDB = gastos || [];
    clientesDB = clientes || [];

    const clienteSelect = document.getElementById('cliente-select');
    const selectedValue = clienteSelect.value;
    
    clienteSelect.innerHTML = '<option value="">Seleccionar cliente</option><option value="NUEVO">+ Cliente Nuevo</option>';
    clientesDB.forEach((c) => {
        clienteSelect.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
    });
    clienteSelect.value = selectedValue;

    await cargarInventario();
    await cargarPP();
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
        ppDB = [];
    }

    ppActual = [...ppDB];
}

function aplicarFiltros() {
    const filtro = document.getElementById('filtro-fecha').value;
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
    const producto = document.getElementById('producto').value;
    const precio = parseFloat(document.getElementById('precio').value);
    
    let nombreClienteText = '';

    if (clienteId === 'NUEVO') {
        const nuevoNombre = document.getElementById('cliente-nuevo').value.trim();
        if (!nuevoNombre || !producto || !precio) {
            Swal.fire('Atención', 'Por favor, completa todos los campos del pedido.', 'warning');
            return;
        }
        
        const { data: nuevoC, error: errC } = await _supabase.from('clientes').insert([{ nombre: nuevoNombre }]).select();
        if (errC || !nuevoC || nuevoC.length === 0) {
            Swal.fire('Error', 'No se pudo crear el cliente nuevo. Revisa si ya existe.', 'error');
            return;
        }
        clienteId = nuevoC[0].id;
        nombreClienteText = nuevoNombre;
    } else if (!clienteId || !producto || !precio) {
        Swal.fire('Atención', 'Por favor, completa todos los campos del pedido.', 'warning');
        return;
    } else {
        nombreClienteText = clienteSelect.options[clienteSelect.selectedIndex].text;
    }

    const { error } = await _supabase.from('pedidos').insert([{ cliente_id: clienteId, cliente: nombreClienteText, producto, precio_total: precio, entregado: false }]);
    
    if (error) {
        Swal.fire('Error', 'No se pudo guardar el pedido.', 'error');
        return;
    }

    Swal.fire({ title: '¡Éxito!', text: 'Pedido registrado correctamente.', icon: 'success', timer: 1500, showConfirmButton: false });
    
    clienteSelect.value = '';
    document.getElementById('cliente-nuevo').value = '';
    document.getElementById('cliente-nuevo').classList.add('hidden');
    document.getElementById('producto').value = '';
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
    const producto = document.getElementById('pp-producto').value.trim();
    const cantidad = parseInt(document.getElementById('pp-cantidad').value, 10);
    const fechaEntrega = document.getElementById('pp-fecha').value;
    const estado = document.getElementById('pp-estado').value;

    if (!producto || !Number.isFinite(cantidad) || !fechaEntrega || !estado) {
        Swal.fire('Atención', 'Por favor, completa todos los datos de la orden de producción.', 'warning');
        return;
    }

    try {
        const { data: nuevaOrden, error } = await _supabase.from('plan_produccion').insert([{ producto, cantidad, fecha_entrega: fechaEntrega, estado }]).select();
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
            <button type="button" class="swal2-confirm sw-remove-row text-rose-500 font-bold" style="background:transparent;border:none;cursor:pointer;font-size:16px;">✕</button>
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

    let productoItem = inventarioDB.find((it) => (it.nombre || '').toLowerCase() === (orden.producto || '').toLowerCase() && ((it.categoria || '').toUpperCase() === 'PRODUCTO_TERMINADO'));
    if (productoItem) {
        const nuevoStock = Number(productoItem.stock || 0) + Number(orden.cantidad || 0);
        try {
            const { data, error } = await _supabase.from('inventario').update({ stock: nuevoStock }).eq('id', productoItem.id).select();
            if (error) throw error;
            if (data && data[0]) {
                const idx = inventarioDB.findIndex((it) => String(it.id) === String(productoItem.id));
                if (idx >= 0) inventarioDB[idx] = data[0];
            }
        } catch (err) {
            productoItem.stock = nuevoStock;
            console.warn('No se pudo incrementar producto terminado en la DB, aplicando en estado local', err);
        }
    } else {
        try {
            const { data, error } = await _supabase.from('inventario').insert([{ nombre: orden.producto, stock: Number(orden.cantidad || 0), categoria: 'PRODUCTO_TERMINADO' }]).select();
            if (error) throw error;
            if (data && data[0]) {
                inventarioDB.unshift(data[0]);
            }
        } catch (err) {
            inventarioDB.unshift({ id: `inv-${Date.now()}`, nombre: orden.producto, stock: Number(orden.cantidad || 0), categoria: 'PRODUCTO_TERMINADO' });
            console.warn('No se pudo crear producto terminado en la DB, creado en estado local', err);
        }
    }

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
