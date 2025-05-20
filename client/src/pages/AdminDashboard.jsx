import React from 'react'
import StatCard from "../components/StatCard";
import ChartDashboard from '../components/ChartDashboard';
import { ToastContainer } from 'react-toastify';
const stats = [
    {
      title: "Total Products",
      value: "25.6K",
      description: "21% more than last month",
      color: "primary",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="inline-block h-8 w-8 stroke-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          ></path>
        </svg>
      ),
    },
    {
      title: "Total Orders",
      value: "2.6M",
      description: "21% more than last month",
      color: "secondary",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="inline-block h-8 w-8 stroke-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          ></path>
        </svg>
      ),
    },{
        title: "Orders Request",
        value: "1.2K",
        description: "15% more than last week",
        color: "accent",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block h-8 w-8 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        ),
      },
    {
      title: "Wallet",
      value: "86000",
      description: "21 Transactions are Pendings",
      color: "secondary",
      avatar: "https://img.daisyui.com/images/profile/demo/anakeen@192.webp",
    }
  ];
const AdminDashboard = () => {
    return (
      <>
        
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[10px]">
    {stats.map((stat, index) => (
      <div key={index} className="w-full">
        <div className="stats shadow w-full">
          <StatCard {...stat} />
        </div>
      </div>
    ))}
            </div>
            <ChartDashboard/>
      
      </>
   
  )
}

export default AdminDashboard