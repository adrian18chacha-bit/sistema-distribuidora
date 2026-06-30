let chartObj = null;

function renderChart(pendientes, listos) {
    const canvas = document.getElementById('graficoEntregas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (chartObj) chartObj.destroy();

    const isDark = document.documentElement.classList.contains('dark');
    chartObj = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pendientes', 'Listos'],
            datasets: [{ data: [pendientes, listos], backgroundColor: ['#f97316', '#10b981'], borderWidth: 0 }]
        },
        options: {
            maintainAspectRatio: false,
            cutout: '83%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        font: { size: 10, weight: 'bold' },
                        color: isDark ? '#cbd5e1' : '#64748b',
                        padding: 12
                    }
                }
            }
        }
    });
}

let barChartObj = null;

function renderVentasMesChart(pedidos) {
    const canvas = document.getElementById('graficoVentasMes');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (barChartObj) barChartObj.destroy();

    // Agrupar ventas por mes
    const ventasPorMes = {};
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Inicializar todos los meses en 0
    meses.forEach(m => ventasPorMes[m] = 0);

    pedidos.forEach(p => {
        if (!p.creado_en) return;
        const fecha = new Date(p.creado_en);
        const mesStr = meses[fecha.getMonth()];
        ventasPorMes[mesStr] += Number(p.precio_total) || 0;
    });

    // Solo mostrar meses que tengan ventas > 0 o el mes actual
    const mesActual = new Date().getMonth();
    const mesesFiltrados = meses.filter((m, i) => ventasPorMes[m] > 0 || i === mesActual);
    const datosFiltrados = mesesFiltrados.map(m => ventasPorMes[m]);

    const isDark = document.documentElement.classList.contains('dark');
    
    try {
        const hasData = datosFiltrados.some(d => d > 0);
        barChartObj = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: mesesFiltrados,
                datasets: [{
                    label: 'Ventas (S/.)',
                    data: hasData ? datosFiltrados : mesesFiltrados.map(() => 0),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: isDark ? '#334155' : '#e2e8f0' },
                        ticks: { color: isDark ? '#cbd5e1' : '#64748b' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: isDark ? '#cbd5e1' : '#64748b' }
                    }
                }
            }
        });
    } catch (e) {
        console.error("Error drawing bar chart: ", e);
        if (canvas && canvas.parentElement) {
            canvas.parentElement.innerHTML = `<div class="text-xs text-red-500 p-4">Error: ${e.message}</div>`;
        }
    }
}

window.renderVentasMesChart = renderVentasMesChart;
