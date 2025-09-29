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
 
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    navigate(`/${role}/logout`);
  };

  const navItemsByRole = {
    admin: [
      { icon: <FaTachometerAlt />, label: "Dashboard", path: "/dashboard" },
      {
        icon: <FaUsersGear />,
        label: "Vendor",
        children: [
          { label: "Registration", path: "/vendor" },
          { label: "Products", path: "/admin/products" },
          { label: "Product Request", path: "/admin/product-requests" },
          { label: "Orders", path: "/admin/orders" },

        ],
      },
      {
        icon: <FaUsersGear />,
        label: "Stockist",
        children: [
          { label: "Registration", path: "/stockist" },
          { label: "Order Requests", path: "/admin/stockist-order-request" },
          { label: "Sales & Reports", path: "/admin/stockist-sales-report" },
        ],
      },
       {
        icon: <FaUsersGear />,
        label: "Reseller",
        children: [
          { label: "Registration", path: "/reseller" },
          { label: "Sales & Reports", path: "/admin/reseller-sales-report" },
          { label: "Order Requests", path: "/reseller/order-requests"}
          
        ],
      },
 {
        icon: <MdInventory />,
        label: "Stock and Inventory",
        children: [
          
          { label: "My Stock ", path: "/my-stocks" },
          
       
        ]
      },

      
      { icon: <SiBrandfolder />, label: "Brands", path: "/brand" },
      { icon: <TbCategoryPlus />, label: "Category", path: "/categories" },
      { icon: <TbCategoryMinus />, label: "Sub-Category", path: "/subcategories" },
      {
        icon: <FaCodePullRequest />,
        label: "Requests Management",
        children: [
          { label: "Topup Request ", path: "/topup" },
          { label: "Withdrawal Request ", path: "/withdrawal-request" },
        ],
      },
        {
        icon: <TbCategoryPlus />,
        label: "Production",
        children: [
          { label: "My Products", path: "/my-products" },  
        
        ],
      },
      
      
      { icon: <MdProductionQuantityLimits />, label: "My Cart", path: "/my-cart" },
      { icon: <CiWallet />, label: "Wallet", path: "/my-wallet" },
    ],
    stockist: [
      { icon: <MdSpaceDashboard />, label: "Dashboard", path: "/dashboard" },
     
      {
        icon: <FaUsersGear />,
        label: "My Network",
        children: [
          { label: "Assigned Reseller", path: "/assigned-reseller" },
          { label: "Order Request(Reseller)", path: "/reseller-order-request" },
        ],
      },
       {
        icon: <TbCategoryPlus />,
        label: "Products",
        children: [
          { label: "Market", path: "/products" },  
        
        ],
      },
     
      {
        icon: <MdInventory />,
        label: "Stock Management",
        children: [
          { label: "My Stocks", path: "/my-stocks" },
          { label: "My Sales & Report", path: "/sales-report" },
        ],
      },{
        icon: <FaCodePullRequest />,
        label: "Order Management",
        children: [
          // { label: "My Orders", path: "/stockist/orders" },
          { label: "My Order Request", path: "/my-order-request" },
          
        ],
      },{
        icon: <FaCodePullRequest />,
        label: "Topup Management",
        children: [
          { label: "Create Topup Requests", path: "/topup-request" },
          { label: "Topup Request History", path: "/my-topup-request" },
        ],
      },{
        icon: <FaCodePullRequest />,
        label: "Withdrawl Management",
        children: [
          { label: "Withdrawal Request", path: "/withdrawl-request" },
          { label: "Withdrawal Request History", path: "/my-withdrawl-history" },
        ],
      },
      { icon: <MdProductionQuantityLimits />, label: "My Cart", path: "/my-cart" },
      { icon: <CiWallet />, label: "Wallet & Transactions", path: "/my-wallet" },
    ],
    reseller: [
      { icon: <MdSpaceDashboard />, label: "Dashboard", path: "/dashboard" },
      { icon: <RxDashboard />, label: "Product (Market)", path: "/products" },
      {
        icon: <FaCodePullRequest />,
        label: "Order Management",
        children: [
          { label: "Order Request", path: "/my-order-request" },
          { label: "My Orders", path: "/my-orders" },
        ],
      },{
        icon: <FaCodePullRequest />,
        label: "Topup Requests",
        children: [
          { label: "Create Topup Requests", path: "/topup-request" },
          { label: "Topup Request History", path: "/my-topup" },
        ],
      },{
        icon: <FaCodePullRequest />,
        label: "Withdrawl Requests",
        children: [
          { label: "Withdrawal Request", path: "/withdrawl-request" },
          { label: "Withdrawal Request History", path: "/my-withdrawl-history" },
        ],
      },
      
      {
        icon: <MdInventory />,
        label: "Stock Management",
        children: [
          { label: "My Stocks & Inventory", path: "/my-stocks" },
        ],
      },
      
      { icon: <CiWallet />, label: "My Wallet", path: "/my-wallet" },
      {
        icon: <MdProductionQuantityLimits />,
        label: "My Cart",
        children: [
          { label: "Cart", path: "/my-cart" },
        ],
      },
    ],
    vendor: [
      { icon: <MdSpaceDashboard />, label: "Dashboard", path: "/dashboard" },
      
      {
        icon: <SiBrandfolder />,
        label: "Brand",
        children: [

          { label: "Company", path: "/brand" },
          { label: "Category", path: "/categories" },
      
        ],
      },
      {
        icon: <TbCategoryPlus />,
        label: "Production",
        children: [
          { label: "Products", path: "/products" },
          { label: "Product Requests", path: "/requested-products" },
          
        
        ],
      },
      {
        icon: <RxDashboard />,
        label: "Business",
        children: [
    
          
          { label: "Orders", path: "/my-sales" },
          
          
        ],
      },
      {
        icon: <MdInventory />,
        label: "Accounts",
        children: [
          { label: "Sales & Reports", path: "/sales-report" },
          { label: "Stock", path: "/my-stocks" },
          
       
        ],
      },
      {
        icon: <CiWallet />,
        label: "Wallet",
        children: [
          { label: "Balance & Transactions", path: "/my-wallet" },
          { label: "Withdrawal Request", path: "/withdrawl-request" },
          { label: "Withdrawal Request History", path: "/my-withdrawl-history" },
        ],
      }
     
    ]
  };

  const itemsToRender = navItemsByRole[role] || [];

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-md transition-all duration-300 z-40 flex flex-col ${
        expanded ? "w-70" : "w-16"
      }`}
    >
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md cursor-pointer text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 bg-red-600 text-white cursor-pointer rounded-md hover:bg-red-700 focus:outline-none"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

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
                      <span className="font-bold"> {subItem.label}</span>
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
          onClick={handleLogoutClick}
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