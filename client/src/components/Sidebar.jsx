import {
  FaTachometerAlt,
  FaLayerGroup,
  FaCalendarAlt,
  FaCog,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { CiWallet, CiLogout } from "react-icons/ci";
import { RxDashboard } from "react-icons/rx";
import { FaUsersGear } from "react-icons/fa6";
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ expanded, setExpanded }) => {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(
    location.pathname.startsWith("/dashboard/settings")
  );

  const mainItems = [
    { icon: <FaTachometerAlt />, label: "Dashboard", path: "/admin/dashboard" },
    { icon: <FaUsersGear />, label: "Stockist", path: "/admin/stockist" },
    { icon: <FaCalendarAlt />, label: "Vendor", path: "/admin/vendor" },
    { icon: <FaLayerGroup />, label: "Orders", path: "/admin/orders" },
    { icon: <RxDashboard />, label: "Products", path: "/admin/products" },
    { icon: <CiWallet />, label: "Wallet", path: "/admin/wallet" },
  ];
  const { logout } = useAuth();
  

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-md transition-all duration-300 z-40 flex flex-col ${
        expanded ? "w-64" : "w-16"
      }`}
    >
      <div className="flex justify-between items-center p-4">
        {expanded && <span className="text-xl font-bold">Admin Panel</span>}
        <button
          className="text-indigo-600 hover:text-red-600 text-xl"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <FaChevronLeft /> : <FaChevronRight />}
        </button>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
        {mainItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 p-2 rounded-md hover:bg-indigo-100 text-gray-700 transition ${
                isActive ? "bg-indigo-200 font-semibold" : ""
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {expanded && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}

        {/* Settings with Nested Items */}
        <div className="text-gray-700">
          <div
            className="flex items-center gap-4 p-2 rounded-md cursor-pointer hover:bg-indigo-100"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <FaCog className="text-lg" />
            {expanded && (
              <span className="font-medium flex-1">Settings</span>
            )}
            {expanded && (
              <span className="text-sm">
                {settingsOpen ? "▲" : "▼"}
              </span>
            )}
          </div>

          {settingsOpen && expanded && (
            <div className="ml-6 mt-1 space-y-1">
              <NavLink
                to="/settings/profile"
                className={({ isActive }) =>
                  `block p-2 rounded-md text-sm hover:bg-indigo-100 ${
                    isActive ? "bg-indigo-200 font-semibold" : ""
                  }`
                }
              >
                Profile
              </NavLink>
              <NavLink
                to="/settings/change-password"
                className={({ isActive }) =>
                  `block p-2 rounded-md text-sm hover:bg-indigo-100 ${
                    isActive ? "bg-indigo-200 font-semibold" : ""
                  }`
                }
              >
                Change Password
              </NavLink>

              <NavLink
                to="/settings/forget-password"
                className={({ isActive }) =>
                  `block p-2 rounded-md text-sm hover:bg-indigo-100 ${
                    isActive ? "bg-indigo-200 font-semibold" : ""
                  }`
                }
              >
                Forget Password
              </NavLink>
            </div>
          )}
        </div>
      </nav>
      <div className="px-2 pb-40">
      <button
      onClick={logout}
      className={`flex items-center gap-4 p-2 rounded-md hover:bg-red-100 text-red-600 transition w-full text-left ${
        location.pathname === "/logout" ? "bg-red-200 font-semibold" : ""
      }`}
    >
      <CiLogout className="text-lg" />
      {expanded && <span className="font-medium">Logout</span>}
    </button>
      </div>
     
     
    </div>
  );
};

export default Sidebar;
