import { useState } from "react";
import logo from "../assets/icons/fev.png";
import { MdEmail, MdPhone, MdClose } from "react-icons/md";

const CommonLayout = ({ children }) => {
  const [showModal, setShowModal] = useState(false);

  const adminEmail = "stocktn.com@gmail.com";
  const adminPhone = "+91 9270301020";

  return (
    <>
      {/* Header */}
      <header className="w-full fixed top-0 h-16 bg-white flex items-center justify-between px-6 lg:px-20 border-b border-gray-200 shadow-sm z-50">
        {/* Logo and Slogan */}
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="w-10 h-10" />
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-xl text-gray-800">StockTN</span>
            <span className="text-xs text-gray-500 font-bold hidden sm:block">
              Simplifying Stock Management, Empowering Businesses
            </span>
          </div>
        </div>

        {/* Contact Button */}
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-sm lg:btn-md bg-indigo-600 hover:bg-indigo-700 text-white px-4"
        >
          Contact Admin
        </button>
      </header>

      {/* Page Content */}
      <div className="pt-16">{children}</div>

      {/* Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md relative animate-fade-in">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-2xl"
            >
              <MdClose />
            </button>

            {/* Modal Title */}
            <h2 className="text-2xl font-bold text-center text-black mb-6">
              Contact Admin Details
            </h2>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MdEmail className="text-xl text-indigo-500" />
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${adminEmail}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-700 hover:underline break-all"
                >
                  {adminEmail}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <MdPhone className="text-xl text-indigo-600" />
                <a
                  href={`tel:${adminPhone}`}
                  className="text-indigo-700 hover:underline"
                >
                  {adminPhone}
                </a>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-6"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommonLayout;
