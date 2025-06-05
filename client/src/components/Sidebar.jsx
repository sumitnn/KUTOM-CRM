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
        label: "User Mangement",
        children: [
          { label: "Vendor", path: "/admin/vendor" },
          { label: "Stockist", path: "/admin/stockist" },
          { label: "Reseller", path: "/admin/my-products" },
          
        ],
      },
      {
        icon: <RxDashboard />,
        label: "Products",
        children: [
          { label: "All Products", path: "/admin/products" },
          { label: "Create New Product", path: "/admin/create-product" },
          { label: "My Products", path: "/admin/my-products" },
          
        ],
      },
      {
        icon: <SiBrandfolder />,
        label: "Brands Management",
        children: [
          { label: "All Brands", path: "/admin/brand" },
          { label: "Add New Brand", path: "/admin/create-brand" }
          
        ],
      },{
        icon: <TbCategoryPlus />,
        label: "Categories",
        children: [
          { label: "View All Category", path: "/admin/categories" },
          { label: "Create New Category", path: "/admin/create-category" },
          
        ],
      },{
        icon: <TbCategoryMinus />,
        label: "Sub-Categories",
        children: [
      
          { label: "Create New Sub-Category", path: "/admin/create-subcategory" },
          { label: "View All Sub-Category", path: "/admin/subcategories" },
    
        ],
      },
      {
        icon: <FaCodePullRequest />,
        label: "Orders",
        children: [
          { label: "All Orders", path: "/admin/orders" },
          { label: "Pending Orders", path: "/admin/orders/pending" },
          { label: "Approved Orders", path: "/admin/orders/approved" },
        ],
      },
      {
        icon: <RxDashboard />,
        label: "Products",
        children: [
          { label: "All Products", path: "/admin/products" },
          { label: "Categories", path: "/admin/products/categories" },
          { label: "Subcategories", path: "/admin/products/subcategories" },
        ],
      },
      { icon: <CiWallet />, label: "Wallet", path: "/admin/wallet" },
    ],
    stockist: [
      { icon: <MdSpaceDashboard />, label: "Dashboard", path: "/stockist/dashboard" },
      { icon: <RxDashboard />, label: "Marketing Products", path: "/stockist/products" },
      {
        icon: <MdInventory />,
        label: "My Stock Inventory",
        children: [
          { label: "Available Stocks", path: "/reseller/create-brand" },
          { label: "Stocks Report", path: "/reseller/brand" },
  
        ],
      },{
        icon: <FaCodePullRequest />,
        label: "Order Management",
        children: [
          { label: "Order Requests", path: "/reseller/create-brand" },
          { label: "My Orders", path: "/reseller/create-brand" },
          { label: "Orders Request History", path: "/reseller/brand" },
  
        ],
      },    
      {
        icon: <MdProductionQuantityLimits />,
        label: "My Cart",
        children: [
          { label: "Wishlist", path: "/reseller/orders" },
          { label: "Cart", path: "/reseller/my-cart" },

       
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
          { label: "My Orders", path: "/reseller/orders" },
          { label: "Orders History", path: "/reseller/orders" },

       
        ],
      },
      {
        icon: <MdInventory />,
        label: "Stocks Management",
        children: [
          { label: "My Stocks", path: "/reseller/brand" },
          { label: "New Stocks Request", path: "/reseller/create-brand" },
          { label: "Stock Request History", path: "/reseller/create-brand" },
          
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
          { label: "My Products", path: "/vendor/my-products" },
          
        ],
      },
      {
        icon: <SiBrandfolder />,
        label: "Brands Management",
        children: [
          { label: "All Brands", path: "/vendor/brand" },
          { label: "Add New Brand", path: "/vendor/create-brand" }
          
    
        ],
      },{
        icon: <TbCategoryPlus />,
        label: "Categories",
        children: [
          { label: "View All Category", path: "/vendor/categories" },
          { label: "Create New Category", path: "/vendor/create-category" },
          
        ],
      },{
        icon: <TbCategoryMinus />,
        label: "Sub-Categories",
        children: [
      
          { label: "Create New Sub-Category", path: "/vendor/create-subcategory" },
          { label: "View All Sub-Category", path: "/vendor/subcategories" },
    
        ],
      },
      {
        icon: <FaCodePullRequest />,
        label: "Request Mangement",
        children: [
      
          { label: "Admin Product Request", path: "/vendor/create-subcategory" },
          { label: "Product Request History", path: "/vendor/subcategories" },
    
        ],
      },
      { icon: <CiWallet />, label: "My Wallet", path: "/reseller/wallet" },
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

        {/* Settings Section */}
        {["admin", "stockist","reseller","vendor"].includes(role) && (
          <div className="text-gray-700">
            <div
              className="flex items-center justify-between gap-2 p-2 rounded-md cursor-pointer hover:bg-indigo-100"
              onClick={() => setSettingsOpen(!settingsOpen)}
            >
              <div className="flex items-center gap-3">
                <FaCog className="text-lg" />
                {expanded && <span className="font-medium flex-1">Settings</span>}
              </div>
              {expanded && <span className="text-sm">{settingsOpen ? "▲" : "▼"}</span>}
            </div>

            {settingsOpen && expanded && (
              <div className="ml-6 mt-1 space-y-1">
                <NavLink
                  to="/settings/profile"
                  className={({ isActive }) =>
                    `block p-2 rounded-md font-bold text-sm hover:bg-indigo-100 ${
                      isActive ? "bg-indigo-200 font-extrabold" : ""
                    }`
                  }
                >
                  My Profile
                </NavLink>
                <NavLink
                  to="/settings/change-password"
                  className={({ isActive }) =>
                    `block p-2 rounded-md text-sm font-bold hover:bg-indigo-100 ${
                      isActive ? "bg-indigo-200 font-extrabold" : ""
                    }`
                  }
                >
                  Change Password
                </NavLink>
              </div>
            )}
          </div>
        )}
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
