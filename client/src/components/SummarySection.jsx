import { useState } from "react";
import { motion } from "framer-motion";

const activityTypes = ["Order", "Product", "Invoice"];
const chartDataMap = {
  Order: { labels: ["Jan", "Feb"], data: [12, 19] },
  Product: { labels: ["Item A", "Item B"], data: [5, 8] },
  Invoice: { labels: ["Paid", "Unpaid"], data: [10, 2] },
};

const recentActivities = [
  {
    img: "https://img.daisyui.com/images/profile/demo/1@94.webp",
    name: "Dio Lupa",
    desc: "Remaining Reason",
  },
  {
    img: "https://img.daisyui.com/images/profile/demo/4@94.webp",
    name: "Ellie Beilish",
    desc: "Bears of a fever",
  },
  {
    img: "https://img.daisyui.com/images/profile/demo/3@94.webp",
    name: "Sabrino Gardener",
    desc: "Cappuccino",
  },
];

export default function SummarySection() {
  const [selectedType, setSelectedType] = useState("Order");

  return (
    <motion.div
      className="flex flex-col xl:flex-row gap-4 w-full max-w-[1440px] mx-auto px-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Summary + Filter */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-4 w-full xl:max-w-[48%]">
        <div>
          <h2 className="text-xl font-semibold mb-2">Filter Type</h2>
          <select
            value={selectedType}
            className="select select-info w-full"
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {activityTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Summary</h2>
          <ul className="text-sm text-gray-600 list-disc ml-4">
            {chartDataMap[selectedType].labels.map((label, i) => (
              <li key={label}>
                {label}: {chartDataMap[selectedType].data[i]}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow p-4 w-full xl:max-w-[52%] max-h-[340px] overflow-y-auto">
        <ul className="list bg-base-100 rounded-box shadow-md">
          <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
            Recent Activities
          </li>

          {recentActivities.map((item, i) => (
            <li
              className="list-row flex items-center justify-between p-2 border-b gap-2"
              key={i}
            >
              <div className="flex items-center gap-3 flex-1">
  <img
    className="min-w-[2.5rem] size-10 rounded-box object-cover"
    src={item.img}
    alt={item.name}
  />
  <div className="flex flex-col whitespace-nowrap">
    <div className="font-semibold">{item.name}</div>
    <div className="text-xs uppercase font-semibold opacity-60">
      {item.desc}
    </div>
  </div>
</div>
              <div className="flex gap-1">
                <button className="btn btn-square btn-ghost">
                  <svg
                    className="size-[1.2em]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <g
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M6 3L20 12 6 21 6 3z" />
                    </g>
                  </svg>
                </button>
                <button className="btn btn-square btn-ghost">
                  <svg
                    className="size-[1.2em]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <g
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeWidth="2"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </g>
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
