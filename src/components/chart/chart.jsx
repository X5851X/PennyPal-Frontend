import React from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register all chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Bar Chart Component
export const BarChart = ({ data }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: data.income,
        backgroundColor: 'rgba(34,197,94,0.7)',
      },
      {
        label: 'Expense',
        data: data.expense,
        backgroundColor: 'rgba(239,68,68,0.7)',
      }
    ]
  };

  return <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />;
};

// Line Chart Component
export const LineChart = ({ data, labels }) => {
  const chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Income',
        data: data?.income || [],
        borderColor: 'blue',
        backgroundColor: 'blue',
        tension: 0.3,
      },
      {
        label: 'Expense',
        data: data?.expense || [],
        borderColor: 'yellow',
        backgroundColor: 'yellow',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => value.toLocaleString('id-ID'),
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

// Line Chart with Percentage Component
export const LineChartWithPercent = ({ labels, netPercent }) => {
  const data = {
    labels,
    datasets: [
      {
        label: 'Net Flow (%)',
        data: netPercent,
        borderColor: '#16e924ff',
        backgroundColor: '#16e924ff',
        fill: false,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.raw}%`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: val => `${val}`
        },
        grid: {
          drawBorder: true,
          color: ctx =>
            ctx.tick.value === 0 ? '#000' : '#e5e7eb',
          borderDash: ctx =>
            ctx.tick.value === 0 ? [6, 6] : [],
        }
      }
    }
  };

  return (
    <div className="w-full h-full">
      <Line data={data} options={options} />
    </div>
  );
};

// Pie Chart Component
export const PieChart = ({ data }) => {
  if (!data || typeof data !== 'object') return <p>No data</p>;

  const pieData = {
    labels: Object.keys(data),
    datasets: [
      {
        data: Object.values(data),
        backgroundColor: ['#f87171', '#fb923c', '#facc15', '#4ade80'],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
    },
  };

  return <Pie data={pieData} options={options} />;
};

// Default export for convenience
export default {
  BarChart,
  LineChart,
  LineChartWithPercent,
  PieChart
};