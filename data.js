// Estado global de datos
let pedidosDB = [];
let gastosDB = [];
let pedidosActuales = [];
let gastosActuales = [];

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

    aplicarFiltros();
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
    actualizarInterfaz();
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
