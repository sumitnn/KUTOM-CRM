import { useState, useEffect, useRef } from "react";
import logo from "../assets/icons/fev.png";
import { MdOutlineNotificationAdd } from "react-icons/md";
import { Link } from "react-router-dom";
import { useGetTodayNotificationsQuery } from "../features/notification/notificationApi";
import { useGetAnnouncementsQuery } from "../features/announcement/announcementApi";
import Marquee from "react-fast-marquee";
import ModalPortal from "./ModalPortal";


const Navbar = ({ role }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const { data: notifications, refetch } = useGetTodayNotificationsQuery();
  const { data: announcements, isLoading } = useGetAnnouncementsQuery();

  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedData = localStorage.getItem('userInfo');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setUserData(parsedData);
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
      }
    };

    loadUserData();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications?.filter(notif => !notif.is_read).length || 0;

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    window.location.href = `/${role}/logout`;
  };

  // Avatar component with fallback
  const UserAvatar = () => {
    const [imgError, setImgError] = useState(false);
    const avatarUrl = userData?.profile_pic;
    const userName = userData?.username || "User";

    if (imgError || !avatarUrl) {
      const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
      return (
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
          {initials}
        </div>
      );
    }

    return (
      <img
        src={avatarUrl}
        alt={userName}
        className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-lg"
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    );
  };

  return (
    <>
      {/* Main Navbar */}
      <nav className="bg-white/80 backdrop-blur-lg fixed top-0 left-0 right-0 z-50 border-b border-gray-200/60 shadow-sm">
        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <ModalPortal>
          <div className="fixed top-30 inset-0 bg-black/50 flex items-center justify-center z-500 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-3 border cursor-pointer border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 px-4 py-3 bg-gradient-to-r cursor-pointer from-red-600 to-red-500 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-600 transition-all duration-200 shadow-lg shadow-red-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div></ModalPortal>
        )}

        <div className="max-w-8xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Name */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <img 
                src={logo} 
                alt="Logo" 
                className="h-10 w-10 rounded-xl object-cover border border-gray-200 shadow-lg" 
              />
              <div className="hidden sm:block">
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  StockTN
                </span>
              </div>
            </div>

            {/* Center - Welcome Message */}
            <div className="hidden lg:block flex-1 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100/60">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-700">
                  Welcome back, <span className="text-blue-600">{userData?.username || 'User'}</span>
                </span>
              </div>
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => {
                    setNotificationOpen(!notificationOpen);
                    refetch();
                  }}
                  className="relative p-2.5 cursor-pointer rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300 group"
                  aria-label="Notifications"
                >
                  <MdOutlineNotificationAdd className="text-xl text-gray-600 group-hover:text-gray-800 transition-colors" />
                  {unreadCount > 0 && (
                    <>
                      <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm">
                        {unreadCount}
                      </span>
                    </>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200/60 backdrop-blur-sm z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 text-lg">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold rounded-full shadow-sm">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {notifications?.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 last:border-b-0 transition-all duration-200 group hover:bg-gray-50/80 ${
                              notification.is_read 
                                ? 'bg-white' 
                                : 'bg-blue-50/50 border-l-4 border-l-blue-500'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                                notification.is_read ? 'bg-gray-300' : 'bg-blue-500 animate-pulse'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className={`font-semibold text-sm sm:text-base truncate ${
                                    notification.is_read ? 'text-gray-700' : 'text-gray-900'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap ml-2 flex-shrink-0">
                                    {new Date(notification.created_at).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-400 font-medium">
                                    {new Date(notification.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                  {!notification.is_read && (
                                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </div>
                          <p className="text-gray-500 font-medium text-lg mb-2">No notifications</p>
                          <p className="text-sm text-gray-400">You're all caught up!</p>
                        </div>
                      )}
                    </div>

                    {notifications?.length > 0 && (
                      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                        <button 
                          onClick={() => setNotificationOpen(false)}
                          className="w-full py-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="focus:outline-none rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-transparent hover:border-blue-200"
                  aria-label="User menu"
                >
                  <UserAvatar />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-200/60 backdrop-blur-sm z-50 overflow-hidden">
                    {/* User Info Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <UserAvatar />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-800 truncate text-sm">{userData?.username || 'User'}</div>
                          <div className="text-xs text-gray-600 truncate">{userData?.email || ''}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="p-2">
                      <Link
                        to={`/${role}/settings/profile`}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 font-medium hover:bg-amber-50 hover:text-amber-700 transition-all duration-200 group"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-sm">Profile Settings</span>
                      </Link>
                      
                      <Link
                        to={`/${role}/settings/change-password`}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 font-medium hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <span className="text-sm">Change Password</span>
                      </Link>
                    </div>
                    
                    {/* Logout */}
                    <div className="border-t border-gray-100 p-2">
                      <a
                        href={`/${role}/logout`}
                        onClick={handleLogoutClick}
                        className="flex items-center cursor-pointer gap-3 px-3 py-3 rounded-xl text-gray-700 font-medium hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                      >
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <span className="text-sm">Logout</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Announcements Bar - Below Navbar with h-5 */}
      {!isLoading && announcements && announcements.length > 0 && (
        <div className="fixed top-16  left-0 right-0 z-40 h-9 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-md">
          <Marquee
            speed={70}
            pauseOnHover
            gradient={false}
            className="h-9"
          >
            {announcements.map((announcement, index) => (
              <div
                key={announcement.id}
                className="flex items-center h-5 mx-6 gap-2"
              >
                <span className="text-white font-bold text-xs px-1.5 py-0.5 bg-white/30 rounded-full flex-shrink-0 min-w-[1.5rem] text-center border border-white/40">
                  #{index + 1}
                </span>
                <span className="text-white font-medium text-xs tracking-wide whitespace-nowrap">
                  {announcement.content}
                </span>
                <div className="w-1 h-1 bg-white/60 rounded-full flex-shrink-0"></div>
              </div>
            ))}
          </Marquee>
        </div>
      )}
    </>
  );
};

export default Navbar;