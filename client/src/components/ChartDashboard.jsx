import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';
import SummarySection from './SummarySection';

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

const ChartDashboard = () => {
  const [selectedType, setSelectedType] = useState('Order');
  const [chartDataMap, setChartDataMap] = useState({
    Order: { labels: [], data: [] },
    Product: { labels: [], data: [] },
    Invoice: { labels: [], data: [] },
  });

  // Simulate API data fetch
  useEffect(() => {
    async function fetchData() {
      const response = {
        Order: { labels: ['Jan', 'Feb', 'Mar', 'Apr'], data: [12, 19, 3, 5] },
        Product: { labels: ['Product A', 'Product B', 'Product C'], data: [30, 50, 20] },
        Invoice: { labels: ['Paid', 'Pending', 'Overdue'], data: [60, 25, 15] },
      };
      setChartDataMap(response);
    }

    fetchData();
  }, []);

  const barData = {
    labels: chartDataMap[selectedType].labels,
    datasets: [
      {
        label: selectedType,
        data: chartDataMap[selectedType].data,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  };

  const pieData = {
    labels: chartDataMap[selectedType].labels,
    datasets: [
      {
        data: chartDataMap[selectedType].data,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
      },
    ],
  };

  return (
    <div className=" py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <motion.div
          className="bg-white rounded-xl shadow p-4 flex flex-col justify-between h-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-2">Bar Chart</h2>
          <Bar data={barData} />
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          className="bg-white rounded-xl shadow p-4 flex flex-col justify-between h-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-xl font-semibold mb-2">Pie Chart</h2>
          <Pie data={pieData} />
        </motion.div>

        {/* Filter + Extra Card */}
        <motion.div
          className="flex flex-col gap-4 h-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Filter Dropdown */}
          <div className="bg-white rounded-xl shadow p-4 flex flex-col">
            <h2 className="text-xl font-semibold mb-2">Filter</h2>
            <select
              className="select select-bordered w-full"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option>Order</option>
              <option>Product</option>
              <option>Invoice</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">
              Showing data for: <strong>{selectedType}</strong>
            </p>
          </div>

          {/* Extra Card */}
          <SummarySection/>
        </motion.div>
      </div>
    </div>
  );
};

export default ChartDashboard;
