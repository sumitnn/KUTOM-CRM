// src/components/Sidebar.jsx
import React from 'react';

const Sidebar = ({ isOpen }) => {
  return (
    <div className={`bg-base-200 w-64 h-screen fixed top-0 left-0 pt-16 z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <ul className="menu p-4 text-base font-medium">
        <li><a href="#">Dashboard</a></li>
        <li><a href="#">Users</a></li>
        <li><a href="#">Settings</a></li>
        <li><a href="#">Reports</a></li>
      </ul>
    </div>
  );
};

export default Sidebar;
