import { useState } from "react";
import { useSelector } from "react-redux"; 
import { useGetAnnouncementsQuery } from "../../features/announcement/announcementApi";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

const ResellerMainLayout = ({ children }) => {
  const [expanded, setExpanded] = useState(true);
  const { user } = useSelector((state) => state.auth); 
  const { data: announcements, isLoading } = useGetAnnouncementsQuery();

  // Priority-based color schemes
  const getPriorityStyles = (priority) => {
    const styles = {
      high: {
        bg: "from-red-50 to-orange-50",
        border: "border-red-200/60",
        accent: "bg-red-500",
        text: "text-red-700",
        badge: "bg-red-100 text-red-800 border-red-200",
        gradient: "from-red-500 to-orange-500",
        icon: "🔴"
      },
      medium: {
        bg: "from-amber-50 to-yellow-50",
        border: "border-amber-200/60",
        accent: "bg-amber-500",
        text: "text-amber-700",
        badge: "bg-amber-100 text-amber-800 border-amber-200",
        gradient: "from-amber-500 to-yellow-500",
        icon: "🟡"
      },
      low: {
        bg: "from-blue-50 to-cyan-50",
        border: "border-blue-200/60",
        accent: "bg-blue-500",
        text: "text-blue-700",
        badge: "bg-blue-100 text-blue-800 border-blue-200",
        gradient: "from-blue-500 to-cyan-500",
        icon: "🔵"
      }
    };
    return styles[priority] || styles.medium;
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "No expiry";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-emerald-50/10">
      <Navbar role="reseller" />
      
      <div className="flex pt-16">
        <Sidebar expanded={expanded} setExpanded={setExpanded} role="reseller" /> 
        
        {/* Main Content with Increased Width */}
        <main
          className={`flex-1 transition-all duration-300 min-h-[calc(100vh-4rem)] ${
            expanded ? "md:ml-80" : "md:ml-24"
          }`}
        >
          <div className="p-6 h-full">
            {/* Full Width Container */}
            <div className="w-full max-w-[95rem] mx-auto h-full">
              
              {/* Modern Announcements Section */}
              {!isLoading && announcements && announcements.length > 0 && (
                <div className="mb-6">
                  <div className={`bg-gradient-to-r rounded-2xl p-4 border shadow-sm transition-all duration-300 hover:shadow-md ${
                    getPriorityStyles(announcements[0]?.priority).bg
                  } ${getPriorityStyles(announcements[0]?.priority).border}`}>
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${
                          getPriorityStyles(announcements[0]?.priority).accent
                        }`}></div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold uppercase tracking-wide ${
                            getPriorityStyles(announcements[0]?.priority).text
                          }`}>
                            Important Announcements
                          </span>
                          <span className="px-2 py-1 text-xs font-bold bg-white/80 backdrop-blur-sm rounded-full border border-white/40">
                            {announcements.length} {announcements.length === 1 ? 'Update' : 'Updates'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Navigation Controls */}
                      <div className="flex items-center gap-1">
                        <button className="announcement-prev w-7 cursor-pointer h-7 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md">
                          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button className="announcement-next cursor-pointer w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md">
                          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Announcements Carousel */}
                    <Swiper
                      modules={[Autoplay, Navigation]}
                      spaceBetween={20}
                      slidesPerView={1}
                      autoplay={{
                        delay: 6000,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                      }}
                      speed={600}
                      loop={true}
                      navigation={{
                        nextEl: '.announcement-next',
                        prevEl: '.announcement-prev',
                      }}
                      className="h-18" // Reduced height
                    >
                      {announcements.map((announcement) => {
                        const styles = getPriorityStyles(announcement.priority);
                        return (
                          <SwiperSlide key={announcement.id}>
                            <div className="flex items-start gap-4 h-full">
                              {/* Priority Icon */}
                              <div className="flex-shrink-0 mt-1">
                                <div className={`w-8 h-8 rounded-full ${styles.bg} border ${styles.border} flex items-center justify-center text-sm`}>
                                  {styles.icon}
                                </div>
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className="font-extrabold text-gray-900 text-base leading-tight truncate">
                                    {announcement.title}
                                  </h3>
                                </div>
                                
                                <p className="text-gray-700 font-bold text-sm leading-relaxed line-clamp-2 mb-2">
                                  {announcement.content}
                                </p>
                                
                                {/* Meta Information */}
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="font-medium">
                                    Announced at : {formatDate(announcement.created_at)}
                                  </span>
                                  {announcement.end_time && (
                                    <>
                                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                      <span className="font-medium">
                                        This Annoucement Expired at: {formatDate(announcement.end_time)}
                                      </span>
                                    </>
                                  )}
                                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                </div>
                              </div>
                            </div>
                          </SwiperSlide>
                        );
                      })}
                    </Swiper>
                    
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        {announcements.map((_, index) => (
                          <div 
                            key={index}
                            className="swiper-pagination-bullet w-1.5 h-1.5 rounded-full bg-gray-300 cursor-pointer transition-all duration-300 hover:bg-gray-400"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Header with Glass Effect */}
              <div className="mb-8">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-white/60">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
                        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                          Welcome back, {user?.username || 'Reseller'}!
                        </h1>
                      </div>
                      <p className="text-slate-600 text-lg">
                        Reseller Dashboard - Grow your business and manage sales
                      </p>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex gap-3 mt-4 lg:mt-0">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-semibold text-slate-700">Active</span>
                      </div>
                      <div className="hidden xl:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold text-green-700">Online</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="flex items-center gap-3 mt-4">
                    <div className="h-1.5 w-32 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg shadow-green-500/25"></div>
                    <div className="h-1.5 w-12 bg-slate-300 rounded-full"></div>
                    <div className="h-1.5 w-12 bg-slate-300 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Main Content Area - Full Width */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/60 overflow-hidden w-full">
                {/* Content Header */}
                <div className="bg-gradient-to-r from-white to-slate-50/80 border-b border-slate-200/60 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <h2 className="text-lg font-semibold text-slate-800">
                        Reseller Dashboard
                      </h2>
                    </div>
                    <div className="text-sm text-slate-500">
                      {expanded ? "Full Navigation" : "Maximized Workspace"}
                    </div>
                  </div>
                </div>

                {/* Full Width Content Area */}
                <div className="w-full">
                  <div className="p-6 lg:p-8">
                    {children}
                  </div>
                </div>
              </div>

              {/* Modern Footer */}
              <footer className="mt-8 w-full">
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/40 text-center w-full">
                  <p className="text-slate-600 text-sm">
                    © {new Date().getFullYear()} Reseller Portal • 
                    <span className="text-green-600 font-medium ml-1">All rights reserved to Stocktn</span>
                  </p>
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