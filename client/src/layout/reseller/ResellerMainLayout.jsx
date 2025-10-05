import { useState, lazy, Suspense, useEffect } from "react";
import { useSelector } from "react-redux"; 
import { useLocation } from "react-router-dom";

// Lazy load components for better performance
const Navbar = lazy(() => import("../../components/Navbar"));
const Sidebar = lazy(() => import("../../components/Sidebar"));

const ResellerMainLayout = ({ children }) => {
  const [expanded, setExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth); 
  const location = useLocation();

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Close mobile sidebar
  const handleMobileClose = () => {
    setIsMobileSidebarOpen(false);
  };

  // Close mobile sidebar when resizing to desktop or when route changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    handleMobileClose();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-emerald-50/10">
      <Suspense fallback={
        <div className="w-full h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 fixed top-0 z-50 animate-pulse"></div>
      }>
        <Navbar 
          role="reseller" 
          onMenuToggle={toggleMobileSidebar}
        />
      </Suspense>
      
      {/* Adjusted top padding to account for navbar + announcements bar */}
      <div className="flex pt-21"> {/* Changed from pt-16 to pt-21 (84px) */}
        {/* Desktop Sidebar - Always visible on desktop with expand/collapse */}
        <div className="hidden lg:block">
          <Suspense fallback={
            <div className="w-20 h-[calc(100vh-5.25rem)] bg-gradient-to-b from-slate-900 to-slate-800 animate-pulse"></div>
          }>
            <Sidebar 
              expanded={expanded} 
              setExpanded={setExpanded} 
              role="reseller"
            /> 
          </Suspense>
        </div>

        {/* Mobile Sidebar - Conditionally rendered */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <Suspense fallback={
              <div className="w-80 h-full bg-gradient-to-b from-slate-900 to-slate-800 animate-pulse"></div>
            }>
              <Sidebar 
                expanded={true} 
                setExpanded={setExpanded} 
                role="reseller"
                onMobileClose={handleMobileClose}
                isMobile={true}
              /> 
            </Suspense>
          </div>
        )}
        
        {/* Main Content - Fluid and responsive */}
        <main className="flex-1 min-h-[calc(100vh-5.25rem)] w-full">
          <div className="p-4 md:p-6 h-full">
            <div className="w-full mx-auto h-full">
              
              {/* Mobile Menu Toggle Button - Only show when sidebar is closed on mobile */}
              {!isMobileSidebarOpen && (
                <div className="lg:hidden mb-4 mt-4">
                  <button
                    onClick={toggleMobileSidebar}
                    className="w-full bg-gradient-to-r cursor-pointer from-green-500 to-emerald-500 hover:from-emerald-600 hover:to-green-600 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-600/25"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Show Menu
                  </button>
                </div>
              )}

              {/* Main Content Area - Modern Glass Morphism Design */}
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden w-full">
                {/* Content Header */}
                <div className="bg-gradient-to-r from-white to-slate-50/80 border-b border-slate-200/60 px-4 md:px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">
                          Reseller Dashboard
                        </h2>
                        <p className="text-sm text-slate-600">
                          Welcome back, {user?.username || 'Reseller'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Desktop Sidebar Status Indicator */}
                    <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500 bg-white/50 rounded-full px-3 py-1 border border-slate-200/60">
                      <div className={`w-2 h-2 rounded-full ${expanded ? 'bg-green-500' : 'bg-emerald-500'}`}></div>
                      {expanded ? "Expanded View" : "Compact View"}
                    </div>
                  </div>
                </div>

                {/* Content Area - Fully Fluid */}
                <div className="w-full">
                  <div className="p-4 md:p-6 lg:p-8">
                    {children}
                  </div>
                </div>
              </div>

              {/* Modern Footer */}
              <footer className="mt-6 md:mt-8">
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-slate-200/40">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-center md:text-left">
                      <p className="text-slate-600 text-sm">
                        © {new Date().getFullYear()} Reseller Portal • 
                        <span className="text-green-600 font-medium ml-1">
                          All rights reserved to Stocktn
                        </span>
                      </p>
                    </div>
                    <div className="flex justify-center md:justify-end gap-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        System Online
                      </div>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResellerMainLayout;