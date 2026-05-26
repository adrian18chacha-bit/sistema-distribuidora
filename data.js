// Estado global de datos
let pedidosDB = [];
let gastosDB = [];
let inventarioDB = [];
let proveedoresDB = [];
let ppDB = [];
let pedidosActuales = [];
let gastosActuales = [];
let inventarioActual = [];
let proveedoresActual = [];
let ppActual = [];

async function cargarTodo() {
    const { data: pedidos } = await _supabase.from('pedidos').select('*').order('creado_en', { ascending: false });
    const { data: gastos } = await _supabase.from('gastos').select('*').order('creado_en', { ascending: false });

    pedidosDB = pedidos || [];
    gastosDB = gastos || [];

    const clienteSelect = document.getElementById('cliente-select');
    const selectedValue = clienteSelect.value;
    const clientesUnicos = [...new Set(pedidosDB.map((pedido) => pedido.cliente))].sort();

    clienteSelect.innerHTML = '<option value="">Seleccionar cliente</option><option value="NUEVO">+ Cliente Nuevo</option>';
    clientesUnicos.forEach((cliente) => {
        clienteSelect.innerHTML += `<option value="${cliente}">${cliente}</option>`;
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
        const { data: inventario } = await _supabase.from('inventario').select('*').order('creado_en', { ascending: false });
        inventarioDB = inventario || [];
    } catch (error) {
        console.warn('Tabla inventario no disponible:', error);
        inventarioDB = [];
    }

    try {
        const { data: proveedores } = await _supabase.from('proveedores').select('*').order('creado_en', { ascending: false });
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
        const { data: ordenes } = await _supabase.from('plan_produccion').select('*').order('creado_en', { ascending: false });
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
    const cliente = clienteSelect.value === 'NUEVO' ? document.getElementById('cliente-nuevo').value : clienteSelect.value;
    const producto = document.getElementById('producto').value;
    const precio = parseFloat(document.getElementById('precio').value);

    if (cliente && producto && precio) {
        await _supabase.from('pedidos').insert([{ cliente, producto, precio_total: precio, entregado: false }]);
        clienteSelect.value = '';
        document.getElementById('cliente-nuevo').value = '';
        document.getElementById('cliente-nuevo').classList.add('hidden');
        document.getElementById('producto').value = '';
        document.getElementById('precio').value = '';
        cargarTodo();
    }
}

async function guardarGasto() {
    const descripcion = document.getElementById('gasto-desc').value;
    const monto = parseFloat(document.getElementById('gasto-monto').value);

    if (descripcion && monto) {
        await _supabase.from('gastos').insert([{ descripcion, monto }]);
        document.getElementById('gasto-desc').value = '';
        document.getElementById('gasto-monto').value = '';
        cargarTodo();
    }
}

function guardarInventario() {
    const nombre = document.getElementById('producto-nombre').value.trim();
    const stock = parseInt(document.getElementById('producto-stock').value, 10);

    if (nombre && Number.isFinite(stock)) {
        const nuevo = { id: `inv-${Date.now()}`, nombre, stock };
        inventarioDB.unshift(nuevo);
        inventarioActual = [...inventarioDB];
        document.getElementById('producto-nombre').value = '';
        document.getElementById('producto-stock').value = '';
        actualizarInventario();
    }
}

function guardarProveedor() {
    const nombre = document.getElementById('proveedor-nombre').value.trim();
    if (nombre) {
        const nuevo = { id: `prov-${Date.now()}`, nombre };
        proveedoresDB.unshift(nuevo);
        proveedoresActual = [...proveedoresDB];
        document.getElementById('proveedor-nombre').value = '';
        actualizarInventario();
    }
}

function guardarOrdenPP() {
    const producto = document.getElementById('pp-producto').value.trim();
    const cantidad = parseInt(document.getElementById('pp-cantidad').value, 10);
    const fechaEntrega = document.getElementById('pp-fecha').value;
    const estado = document.getElementById('pp-estado').value;

    if (producto && Number.isFinite(cantidad) && fechaEntrega && estado) {
        const nuevaOrden = {
            id: `pp-${Date.now()}`,
            producto,
            cantidad,
            fecha_entrega: fechaEntrega,
            estado
        };
        ppDB.unshift(nuevaOrden);
        ppActual = [...ppDB];
        document.getElementById('pp-producto').value = '';
        document.getElementById('pp-cantidad').value = '';
        document.getElementById('pp-fecha').value = '';
        document.getElementById('pp-estado').value = 'EN_PROCESO';
        actualizarPlanProduccion();
    }
}

function eliminarOrdenPP(id) {
    ppDB = ppDB.filter((orden) => orden.id !== id);
    ppActual = ppActual.filter((orden) => orden.id !== id);
    actualizarPlanProduccion();
}

function eliminarInventario(id) {
    inventarioDB = inventarioDB.filter((item) => item.id !== id);
    inventarioActual = inventarioActual.filter((item) => item.id !== id);
    actualizarInventario();
}

function eliminarProveedor(id) {
    proveedoresDB = proveedoresDB.filter((item) => item.id !== id);
    proveedoresActual = proveedoresActual.filter((item) => item.id !== id);
    actualizarInventario();
}

async function marcarEntregado(id) {
    await _supabase.from('pedidos').update({ entregado: true }).eq('id', id);
    cargarTodo();
}

async function eliminarPedido(id) {
    if (confirm('¿Eliminar este pedido?')) {
        await _supabase.from('pedidos').delete().eq('id', id);
        cargarTodo();
    }
}

async function eliminarGasto(id) {
    if (confirm('¿Eliminar este gasto?')) {
        await _supabase.from('gastos').delete().eq('id', id);
        cargarTodo();
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
