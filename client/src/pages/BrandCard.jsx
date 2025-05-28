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

  const cardClasses = `p-4 rounded-xl flex flex-col justify-between shadow-md ${
    brand.is_featured ? "bg-white border border-gray-200" : "bg-gray-100 border border-gray-300"
        }`;
    


  return (
    <div className={cardClasses}>
      <div className="flex flex-col items-center text-center space-y-3">
        <img
          src={brand?.logo ? brand.logo: ""}
          alt={brand.name}
          className="w-24 h-24 object-cover rounded-full border"
          
        />
        <h2 className="text-lg font-semibold">{brand.name}</h2>
        {brand.description && (
          <p className="text-sm text-gray-600">
            {isExpanded || !isLong
              ? brand.description
              : `${brand.description.slice(0, 100)}... `}
            {isLong && (
              <button
                onClick={() => toggleDescription(brand.id)}
                className="text-blue-500 hover:underline ml-1"
              >
                {isExpanded ? "View Less" : "View More"}
              </button>
            )}
          </p>
        )}
      </div>

      {isOwner && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => handleEdit(brand)}
            className="btn btn-sm btn-outline btn-primary"
          >
            Edit
          </button>
          <button
            onClick={() => openDeleteConfirm(brand)}
            className="btn btn-sm btn-outline btn-error"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default BrandCard;
