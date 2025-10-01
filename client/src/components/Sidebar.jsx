import {
  FaTachometerAlt,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
} from "react-icons/fa";
import { CiWallet, CiLogout } from "react-icons/ci";
import { RxDashboard } from "react-icons/rx";
import { FaUsersGear } from "react-icons/fa6";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MdSpaceDashboard, MdProductionQuantityLimits, MdInventory } from "react-icons/md";
import { SiBrandfolder } from "react-icons/si";
import { TbCategoryPlus, TbCategoryMinus } from "react-icons/tb";
import { FaCodePullRequest } from "react-icons/fa6";
import { TfiAnnouncement } from "react-icons/tfi";

const Sidebar = ({ expanded, setExpanded, role = "admin" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState({});
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

  // Role-based navigation items
  const navItemsByRole = {
    admin: [
      { icon: <FaTachometerAlt />, label: "Dashboard", path: "/admin/dashboard" },
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
          { label: "Order Requests", path: "/reseller/order-requests" },
        ],
      },
      {
        icon: <MdInventory />,
        label: "Stock and Inventory",
        children: [
          { label: "My Stock", path: "/my-stocks" },
        ],
      },
      { icon: <SiBrandfolder />, label: "Brands", path: "/brand" },
      { icon: <TbCategoryPlus />, label: "Category", path: "/categories" },
      { icon: <TbCategoryMinus />, label: "Sub-Category", path: "/subcategories" },
      {
        icon: <FaCodePullRequest />,
        label: "Requests Management",
        children: [
          { label: "Topup Request", path: "/topup" },
          { label: "Withdrawal Request", path: "/withdrawal-request" },
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
      { icon: <TfiAnnouncement />, label: "Announcements", path: "/announcements" },
    ],
    stockist: [
      { icon: <MdSpaceDashboard />, label: "Dashboard", path: "/stockist/dashboard" },
      {
        icon: <FaUsersGear />,
        label: "My Network",
        children: [
          { label: "Assigned Reseller", path: "/stockist/assigned-reseller" },
          { label: "Order Request(Reseller)", path: "/stockist/reseller-order-request" },
        ],
      },
      {
        icon: <TbCategoryPlus />,
        label: "Products",
        children: [
          { label: "Market", path: "/stockist/products" },
        ],
      },
      {
        icon: <MdInventory />,
        label: "Stock Management",
        children: [
          { label: "My Stocks", path: "/stockist/my-stocks" },
          { label: "My Sales & Report", path: "/stockist/sales-report" },
        ],
      },
      {
        icon: <FaCodePullRequest />,
        label: "Order Management",
        children: [
          { label: "My Order Request", path: "/stockist/my-order-request" },
        ],
      },
      {
        icon: <FaCodePullRequest />,
        label: "Topup Management",
        children: [
          { label: "Create Topup Requests", path: "/stockist/topup-request" },
          { label: "Topup Request History", path: "/stockist/my-topup-request" },
        ],
      },
      {
        icon: <FaCodePullRequest />,
        label: "Withdrawl Management",
        children: [
          { label: "Withdrawal Request", path: "/stockist/withdrawl-request" },
          { label: "Withdrawal Request History", path: "/stockist/my-withdrawl-history" },
        ],
      },
      { icon: <MdProductionQuantityLimits />, label: "My Cart", path: "/stockist/my-cart" },
      { icon: <CiWallet />, label: "Wallet & Transactions", path: "/stockist/my-wallet" },
    ],
    reseller: [
      { icon: <MdSpaceDashboard />, label: "Dashboard", path: "/reseller/dashboard" },
      { icon: <RxDashboard />, label: "Product (Market)", path: "/reseller/products" },
      {
        icon: <FaCodePullRequest />,
        label: "Order Management",
        children: [
          { label: "Order Request", path: "/reseller/my-order-request" },
          { label: "My Orders", path: "/reseller/my-orders" },
        ],
      },
      {
        icon: <FaCodePullRequest />,
        label: "Topup Requests",
        children: [
          { label: "Create Topup Requests", path: "/reseller/topup-request" },
          { label: "Topup Request History", path: "/reseller/my-topup" },
        ],
      },
      {
        icon: <FaCodePullRequest />,
        label: "Withdrawl Requests",
        children: [
          { label: "Withdrawal Request", path: "/reseller/withdrawl-request" },
          { label: "Withdrawal Request History", path: "/reseller/my-withdrawl-history" },
        ],
      },
      {
        icon: <MdInventory />,
        label: "Stock Management",
        children: [
          { label: "My Stocks & Inventory", path: "/reseller/my-stocks" },
        ],
      },
      { icon: <CiWallet />, label: "My Wallet", path: "/reseller/my-wallet" },
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
        icon: <SiBrandfolder />,
        label: "Brand",
        children: [
          { label: "Company", path: "/vendor/brand" },
          { label: "Category", path: "/vendor/categories" },
        ],
      },
      {
        icon: <TbCategoryPlus />,
        label: "Production",
        children: [
          { label: "Products", path: "/vendor/products" },
          { label: "Product Requests", path: "/vendor/requested-products" },
        ],
      },
      {
        icon: <RxDashboard />,
        label: "Business",
        children: [
          { label: "Orders", path: "/vendor/my-sales" },
        ],
      },
      {
        icon: <MdInventory />,
        label: "Accounts",
        children: [
          { label: "Sales & Reports", path: "/vendor/sales-report" },
          { label: "Stock", path: "/vendor/my-stocks" },
        ],
      },
      {
        icon: <CiWallet />,
        label: "Wallet",
        children: [
          { label: "Balance & Transactions", path: "/vendor/my-wallet" },
          { label: "Withdrawal Request", path: "/vendor/withdrawl-request" },
          { label: "Withdrawal Request History", path: "/vendor/my-withdrawl-history" },
        ],
      }
    ]
  };

  const itemsToRender = navItemsByRole[role] || [];

  return (
    <>
      {/* Backdrop for mobile */}
      {expanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl transition-all duration-300 z-40 flex flex-col ${
          expanded ? "w-80" : "w-20"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          {expanded && (
            <div>
              <span className="text-xl font-bold text-white capitalize">{role} Portal</span>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2"></div>
            </div>
          )}
          <button
            className="p-2 rounded-lg bg-slate-700 cursor-pointer hover:bg-slate-600 text-slate-300 hover:text-white transition-all duration-200"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {itemsToRender.map((item, idx) => {
            const isActiveParent = item.path
              ? location.pathname === item.path
              : item.children?.some((child) => location.pathname === child.path);
            const hasChildren = Array.isArray(item.children);
            const isOpen = openMenus[item.label];

            return (
              <div key={idx} className="group">
                {/* Parent Item */}
                <div
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActiveParent
                      ? "bg-blue-600 shadow-lg shadow-blue-500/25 text-white"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                  onClick={() => {
                    if (hasChildren) {
                      toggleMenu(item.label);
                    } else if (item.path) {
                      navigate(item.path);
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-lg transition-transform duration-200 ${
                      isActiveParent ? "scale-110" : "group-hover:scale-105"
                    }`}>
                      {item.icon}
                    </span>
                    {expanded && (
                      <span className="font-medium tracking-wide">{item.label}</span>
                    )}
                  </div>
                  {hasChildren && expanded && (
                    <span className={`transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}>
                      <FaChevronDown className="text-sm" />
                    </span>
                  )}
                </div>

                {/* Children Items */}
                {hasChildren && expanded && isOpen && (
                  <div className="ml-8 mt-1 space-y-1 border-l-2 border-slate-600 pl-3 py-2">
                    {item.children.map((subItem, subIdx) => {
                      const isActiveChild = location.pathname === subItem.path;
                      return (
                        <NavLink
                          key={subIdx}
                          to={subItem.path}
                          className={({ isActive }) =>
                            `block p-2 pl-4 rounded-lg text-sm transition-all duration-200 ${
                              isActive
                                ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-400 font-medium"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                            }`
                          }
                        >
                          <span className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              location.pathname === subItem.path ? 'bg-blue-400' : 'bg-slate-500'
                            }`} />
                            {subItem.label}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogoutClick}
            className="flex items-center cursor-pointer gap-4 p-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 w-full group"
          >
            <CiLogout className="text-xl group-hover:scale-110 transition-transform duration-200" />
            {expanded && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Modern Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl">
            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CiLogout className="text-2xl text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Confirm Logout</h3>
              <p className="text-slate-400">Are you sure you want to logout?</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 cursor-pointer py-3 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-700 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 px-4 py-3  cursor-pointer bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg shadow-red-500/25"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;