import { FiEdit2, FiTrash2, FiStar, FiX } from "react-icons/fi";
import { useState } from "react";

const BrandCard = ({
  brand,
  isOwner,
  isExpanded,
  toggleDescription,
  handleEdit,
  openDeleteConfirm,
}) => {
  const isLong = brand.description?.length > 100;
  const baseUrl = import.meta.env.VITE_IMAGE_API_URL;
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`relative p-6 rounded-xl border transition-all duration-200 ${
      brand.is_featured 
        ? "bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-md" 
        : "bg-white border-gray-200 hover:border-gray-300"
    }`}>
      {brand.is_featured && (
        <div className="absolute top-3 right-3 bg-blue-100 text-blue-800 p-1 rounded-full">
          <FiStar className="h-4 w-4" />
        </div>
      )}
      
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <img
            src={
              imageError 
                ? "/placeholder-brand.png" 
                : brand?.logo 
                  ? `${baseUrl}${brand.logo}` 
                  : "/placeholder-brand.png"
            }
            alt={brand.name}
            className="w-20 h-20 object-cover rounded-full border-2 border-white shadow-md"
            onError={handleImageError}
            loading="lazy"
          />
        </div>
        
        <h2 className="text-lg font-bold text-gray-800">{brand.name}</h2>
        
        {brand.description && (
          <div className="text-sm text-gray-600">
            <p className={`${!isExpanded && isLong ? 'line-clamp-3' : ''}`}>
              {brand.description}
            </p>
            {isLong && (
              <button
                onClick={() => toggleDescription(brand.id)}
                className="mt-1 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center w-full"
              >
                {isExpanded ? (
                  <>
                    <FiX className="mr-1" /> Show less
                  </>
                ) : (
                  "Read more"
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {isOwner && (
        <div className="flex justify-center gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => handleEdit(brand)}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
          >
            <FiEdit2 className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => openDeleteConfirm(brand)}
            className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
          >
            <FiTrash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default BrandCard;