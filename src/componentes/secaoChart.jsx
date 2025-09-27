//Em uso em dashboard.jsx
// Componente de seção de gráfico reutilizável

import React from 'react';
import { Line } from 'react-chartjs-2';

const secaoChart = React.memo(({ chartData, chartOptions }) => (
  <section className="grafico">
    <h3>Obras</h3>
    <Line data={chartData} options={chartOptions} />
  </section>
));

export default secaoChart;