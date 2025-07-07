import { FiCheckCircle, FiClock, FiEyeOff, FiX } from "react-icons/fi";

const ProductStatusModal = ({ product, onClose, onStatusUpdate }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">
            Update Status for {product?.name}
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3 mb-6">
          <button
            className="btn btn-outline justify-start gap-2"
            onClick={() => onStatusUpdate("published")}
          >
            <FiCheckCircle className="text-green-600" />
            Publish Product
          </button>
          <button
            className="btn btn-outline justify-start gap-2"
            onClick={() => onStatusUpdate("draft")}
          >
            <FiClock className="text-yellow-600" />
            Mark as Draft
          </button>
          <button
            className="btn btn-outline justify-start gap-2"
            onClick={() => onStatusUpdate("inactive")}
          >
            <FiEyeOff className="text-gray-600" />
            Mark as Inactive
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductStatusModal;