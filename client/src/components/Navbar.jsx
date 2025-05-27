import { useState, useEffect, useRef } from "react";
import logo from "../assets/icons/fev.png";
import { MdOutlineNotificationAdd } from "react-icons/md";



const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-full mx-auto px-6">
        <div className="flex justify-between h-16 items-center">

          {/* Logo + Name */}
          <div className="flex items-center space-x-4">
            <img src={logo} alt="Logo" className="h-10 w-12 rounded-full" />
            <span className="text-xl font-extrabold text-gray-800">StockTN</span>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-5">
            <button className="relative text-gray-600 hover:text-gray-800">
              <MdOutlineNotificationAdd className="text-xl" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="focus:outline-none"
              >
               
  <img
    src="https://img.daisyui.com/images/profile/demo/anakeen@192.webp"
    alt="User"
    className="h-10 w-10 rounded-full border-7 border-transparent hover:border-amber-400 transition"
  />

              </button>

            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
