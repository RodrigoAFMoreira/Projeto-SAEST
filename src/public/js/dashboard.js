import Chart from 'chart.js/auto';

document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('graficoObras').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
      datasets: [{
        label: 'Obras',
        data: [10000, 7000, 11000, 20000, 15000, 17000, 20000],
        fill: true,
        borderColor: '#2c7ef8',
        tension: 0.4,
        backgroundColor: 'rgba(44, 126, 248, 0.1)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
});
