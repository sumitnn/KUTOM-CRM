import {
  FaTachometerAlt,
  FaCalendarAlt,
  FaCog,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

import { CiWallet, CiLogout } from "react-icons/ci";
import { RxDashboard } from "react-icons/rx";
import { FaUsersGear } from "react-icons/fa6";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MdSpaceDashboard } from "react-icons/md";
import { MdProductionQuantityLimits } from "react-icons/md";
import { MdInventory } from "react-icons/md";
import { SiBrandfolder } from "react-icons/si";
import { TbCategoryPlus } from "react-icons/tb";
import { TbCategoryMinus } from "react-icons/tb";
import { FaCodePullRequest } from "react-icons/fa6";



const Sidebar = ({ expanded, setExpanded, role = "admin" }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [openMenus, setOpenMenus] = useState({}); // Track open/close state for each item
  const [settingsOpen, setSettingsOpen] = useState(
    location.pathname.startsWith("/settings")
  );

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };



  const navItemsByRole = {
    admin: [
      { icon: <FaTachometerAlt />, label: "Dashboard", path: "/admin/dashboard" },
      {
        icon: <FaUsersGear />,
        label: "Network Mangement",
        children: [
          { label: "Vendor", path: "/admin/vendor" },
          { label: "Stockist", path: "/admin/stockist" },
          { label: "Reseller", path: "/admin/reseller" },

          
        ],
      },
      {
        icon: <RxDashboard />,
        label: "Products Management",
        children: [
          { label: "All Products", path: "/admin/products" },
          { label: "Product Request", path: "/admin/product-requests" },
          
        ],
      },
      { icon: <SiBrandfolder />, label: "Brands", path: "/admin/brand" },
      { icon: <TbCategoryPlus />, label: "Category", path: "/admin/categories" },
      { icon: <TbCategoryMinus />, label: "Sub-Category", path: "/admin/subcategories" },
      {
        icon: <FaCodePullRequest />,
        label: "TopUp Management",
        children: [
          { label: "Topup Request & History", path: "/admin/topup" },

        ],
      },
      { icon: <CiWallet />, label: "Wallet", path: "/admin/wallet" },
    ],
    stockist: [
      { icon: <MdSpaceDashboard />, label: "Dashboard", path: "/stockist/dashboard" },
      {
        icon: <FaUsersGear />,
        label: "My Network",
        children: [
          { label: "My Reseller", path: "/stockist/reseller" },

          
        ],
      },

      {
        icon: <MdInventory />,
        label: "Stock Management",
        children: [
          { label: "My Stocks", path: "" },
          { label: "Stocks Report", path: "" },
  
        ],
      },{
        icon: <FaCodePullRequest />,
        label: "Order Management",
        children: [
          { label: "Order Requests", path: "/stockist/orders" },

  
        ],
      },{
        icon: <FaCodePullRequest />,
        label: "Request Management",
        children: [
          { label: "Create Topup Requests", path: "/stockist/topup-request" },
          { label: "Topup Request History", path: "/stockist/my-topup" },
  
        ],
      },
      { icon: <CiWallet />, label: "Wallet & Transactions", path: "/stockist/wallet" },
    ],
    reseller: [
      { icon: <MdSpaceDashboard />, label: "Dashboard", path: "/reseller/dashboard" },
      { icon: <RxDashboard />, label: "Product Market", path: "/reseller/products" },
     {
        icon: <FaCodePullRequest />,
        label: "Order Management",
        children: [
          { label: "Order History", path: "/reseller/orders" },

       
        ],
      },{
        icon: <FaCodePullRequest />,
        label: "Request Mangement",
        children: [
          { label: "Create Topup Request", path: "/reseller/topup-request" },
          { label: "Topup Request History", path: "/reseller/my-topup" },
          
    
        ],
      },
      { icon: <CiWallet />, label: "My Wallet", path: "/reseller/wallet" },
      {
        icon: <MdProductionQuantityLimits />,
        label: "My Cart",
        children: [
          { label: "Cart", path: "/reseller/my-cart" },

       
        ],
      },

    ],
    vendor: [
      { icon: <MdSpaceDashboard />, label: "Dashboard", path: "/vendor/dashboard" },
      {
        icon: <RxDashboard />,
        label: "Products",
        children: [
          { label: "All Products", path: "/vendor/products" },
          { label: "Create New Product", path: "/vendor/create-product" },
          { label: "Requests", path: "/vendor/requested-products" },
          { label: "Stock", path: "/vendor/my-stocks" },
          { label: "Sales", path: "/vendor/my-sales" },
          
        ],
      },
      { icon: <SiBrandfolder />, label: "Brand Management", path: "/vendor/brand" },
      { icon: <TbCategoryPlus />, label: "Category & Subcategory", path: "/vendor/categories" },
      {
        icon: <FaCodePullRequest />,
        label: "Accounts Mangement",
        children: [
          { label: "My Wallet & Transaction", path: "/vendor/wallet" },
          { label: "Withdrawl Request", path: "/vendor/withdrawl-request" },
          { label: "Withdrawl Request History", path: "/vendor/my-withdrawl" },

          
    
        ],
      },
      { icon: <CiWallet />, label: "My Wallet", path: "/vendor/wallet" },
    ]
  };

  const itemsToRender = navItemsByRole[role] || [];

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-md transition-all duration-300 z-40 flex flex-col ${
        expanded ? "w-70" : "w-16"
      }`}
    >
      <div className="flex justify-between items-center p-4">
        {expanded && <span className="text-xl font-bold capitalize">{role} Portal</span>}
        <button
          className="text-indigo-600 hover:text-red-600 text-xl"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <FaChevronLeft /> : <FaChevronRight />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-3 overflow-y-auto">
        {itemsToRender.map((item, idx) => {
          const isActiveParent = item.path
            ? location.pathname.startsWith(item.path)
            : item.children?.some((child) => location.pathname.startsWith(child.path));
          const hasChildren = Array.isArray(item.children);
          const isOpen = openMenus[item.label];

          return (
            <div key={idx}>
              <div
                className={`flex items-center justify-between gap-2 p-2 rounded-md hover:bg-indigo-100 text-gray-700 transition cursor-pointer ${
                  isActiveParent ? "bg-indigo-200 font-semibold" : ""
                }`}
                onClick={() => {
                  if (hasChildren) {
                    toggleMenu(item.label);
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  {expanded && <span className="font-bold">{item.label}</span>}
                </div>
                {hasChildren && expanded && (
                  <span>{isOpen ? <FaChevronUp /> : <FaChevronDown />}</span>
                )}
              </div>

              {hasChildren && expanded && isOpen && (
                <div className="ml-6 mt-2 space-y-1">
                  {item.children.map((subItem, subIdx) => (
                    <NavLink
                      key={subIdx}
                      to={subItem.path}
                      className={({ isActive }) =>
                        `block p-2 rounded-md text-sm hover:bg-indigo-100 ${
                          isActive ? "bg-indigo-200 font-semibold" : ""
                        }`
                      }
                    >
                      <span className="font-bold "> {subItem.label}</span>
                     
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        
      </nav>

      {/* Logout Button */}
      <div className="px-2 pb-40">
        <button
          onClick={() => navigate(`/${role}/logout`)}
          className="flex items-center gap-4 p-2 rounded-md hover:bg-red-100 text-red-600 transition w-full text-left"
        >
          <CiLogout className="text-lg" />
          {expanded && <span className="font-bold">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
