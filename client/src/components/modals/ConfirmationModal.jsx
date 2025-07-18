import { useEffect } from "react";

const ConfirmationModal = ({
  title = "Confirm Action",
  message = "Are you sure you want to perform this action?",
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonStyle = "bg-green-600 hover:bg-green-700",
  cancelButtonStyle = "bg-gray-600 hover:bg-gray-700"
}) => {
  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Modal header */}
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        {/* Modal body */}
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
        </div>
        
        {/* Modal footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-md cursor-pointer text-white ${cancelButtonStyle} transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md cursor-pointer text-white ${confirmButtonStyle} transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;