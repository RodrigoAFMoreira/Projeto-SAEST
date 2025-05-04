document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  const ctx = document.getElementById('graficoObras').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
      datasets: [{
        label: 'Obras',
        data: [12000, 8000, 10000, 15000, 13000, 16000, 19000],
        borderColor: '#1e3a8a',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(30, 58, 138, 0.1)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (val) => val / 1000 + 'K'
          }
        }
      }
    }
  });
});