let chartObj = null;

function renderChart(pendientes, listos) {
    const ctx = document.getElementById('graficoEntregas').getContext('2d');

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
