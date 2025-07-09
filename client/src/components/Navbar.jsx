import { useState, useEffect, useRef } from "react";
import logo from "../assets/icons/fev.png";
import { MdOutlineNotificationAdd } from "react-icons/md";
import { Link } from "react-router-dom";
import { useGetAnnouncementsQuery } from "../features/announcement/announcementApi";
import { useGetTodayNotificationsQuery } from "../features/notification/notificationApi";

const Navbar = ({ role }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const { data: announcements, isLoading } = useGetAnnouncementsQuery();
  const { data: notifications, refetch } = useGetTodayNotificationsQuery();

  useEffect(() => {
    // Load user data from localStorage
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

  const marqueeMessages = announcements?.map((msg) => msg.title).join(" 🔔 ") || "";

  // Count unread notifications
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
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
          {initials}
        </div>
      );
    }

    return (
      <img
        src={avatarUrl}
        alt={userName}
        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border-2 border-white shadow-sm"
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    );
  };

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50 border-b border-gray-100">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-extrabold text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-gray-600 font-bold mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md font-bold cursor-pointer text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 bg-red-600 text-white cursor-pointer font-bold rounded-md hover:bg-red-700 focus:outline-none"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-full mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Logo + Name - Always visible */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <img 
              src={logo} 
              alt="Logo" 
              className="h-9 w-9 rounded-full object-cover border border-gray-200" 
            />
            <span className="text-xl font-bold text-gray-800 hidden sm:block">
              StockTN
            </span>
          </div>
          
          {/* Centered Marquee with fixed width */}
          <div className="flex justify-center mx-4 flex-1">
            {!isLoading && marqueeMessages && (
              <div className="w-full max-w-xl rounded-full px-4 py-1 border border-amber-100 bg-amber-50">
                <marquee 
                  className="text-amber-800 text-sm sm:text-base font-bold" 
                  scrollamount="3"
                  behavior="scroll"
                  direction="left"
                >
                  {marqueeMessages}
                </marquee>
              </div>
            )}
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-3 ml-2">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => {
                  setNotificationOpen(!notificationOpen);
                  refetch();
                }}
                className="relative p-1.5 cursor-pointer rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <MdOutlineNotificationAdd className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100 divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 text-sm font-extrabold text-gray-700 bg-gray-50">
                    Notifications
                  </div>
                  {notifications?.length > 0 ? (
                    notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        to={notification.related_url || `/${role}/dashboard`}
                        className={`block px-4 py-3 cursor-pointer text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-900 bg-amber-50'}`}
                        onClick={() => setNotificationOpen(false)}
                      >
                        <div className="font-extrabold">{notification.title}</div>
                        <div className="text-xs text-gray-500 mt-1 font-bold">
                          {notification.message}
                        </div>
                        <div className="text-xs text-gray-400 font-bold mt-1">
                          {new Date(notification.created_at).toLocaleTimeString()}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No notifications today
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="focus:outline-none rounded-full cursor-pointer ring-2 ring-transparent hover:ring-amber-200 transition-all"
                aria-label="User menu"
              >
                <UserAvatar />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100">
                  <div className="px-4 py-2 text-sm font-extrabold text-gray-700">
                    {userData?.username || 'User'}
                  </div>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link
                    to={`/${role}/settings/profile`}
                    className="block px-4 py-2.5 text-sm text-gray-700 font-bold hover:bg-amber-50 hover:text-amber-700 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to={`/${role}/settings/change-password`}
                    className="block px-4 py-2.5 text-sm text-gray-700 font-bold hover:bg-amber-50 hover:text-amber-700 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Change Password
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <a
                    href={`/${role}/logout`}
                    onClick={handleLogoutClick}
                    className="block px-4 py-2.5 text-sm text-gray-700 font-bold hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    Logout
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;