import { useState, useMemo } from "react";
import { useGetMyProductsQuery } from "../features/product/productApi";
import { Link } from "react-router-dom";

// Constants
const FALLBACK_IMAGE = "/placeholder.png";

// Utility functions
const getProductImageUrl = (product) => {
  if (!product.images || product.images.length === 0) {
    return FALLBACK_IMAGE;
  }
  const featured = product.images.find((img) => img.is_featured);
  const imagePath = featured ? featured.image : product.images[0].image;
  return imagePath.startsWith("http") ? imagePath : imagePath;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(price);
};

const ProductCard = ({ product, role }) => {
  const [showDetails, setShowDetails] = useState(false);
  const defaultVariant = product.variants?.find(v => v.is_default) || product.variants?.[0];

  return (
    <div className="border rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden bg-white">
      {/* Image Gallery */}
      <div className="relative h-64 bg-gray-100">
        <img
          src={getProductImageUrl(product)}
          alt={product.name}
          className="w-full h-full object-contain"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_IMAGE;
          }}
        />
        {product.images?.length > 1 && (
          <div className="absolute bottom-2 left-2 flex space-x-1">
            {product.images.slice(0, 3).map((img, index) => (
              <div key={img.id} className="w-8 h-8 border border-white rounded-sm overflow-hidden">
                <img 
                  src={img.image} 
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            {product.sku}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div>
            <p className="text-xl font-semibold text-gray-900">
              {formatPrice(product.price)}
            </p>
            {defaultVariant && (
              <p className="text-sm text-gray-600">
                Variant: {defaultVariant.price !== product.price && `${formatPrice(defaultVariant.price)} • `}
                Qty: {defaultVariant.quantity}
              </p>
            )}
          </div>
          {product.brand && (
            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              {product.brand}
            </span>
          )}
        </div>

        {/* Toggle Details Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
          <svg
            className={`ml-1 w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Detailed Information */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-sm text-gray-600 mb-4">
              {product.description || "No description available"}
            </p>

            {product.variants?.length > 0 && (
              <>
                <h4 className="font-medium text-gray-900 mb-2">Variants</h4>
                <div className="space-y-2 mb-4">
                  {product.variants.map((variant) => (
                    <div key={variant.id} className="p-2 bg-gray-50 rounded">
                      <div className="flex justify-between">
                        <span className="font-medium">{variant.name}</span>
                        <span className="text-sm">{variant.sku}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>{formatPrice(variant.price)}</span>
                        <span>Qty: {variant.quantity}</span>
                        <span className={`text-xs px-1 rounded ${
                          variant.in_stock 
                            ? variant.low_stock 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {variant.in_stock 
                            ? variant.low_stock ? 'Low Stock' : 'In Stock' 
                            : 'Out of Stock'}
                        </span>
                      </div>
                      {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          {Object.entries(variant.attributes).map(([key, value]) => (
                            <div key={key}>{key}: {value}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {product.tags?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-1">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {product.tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <Link
                to={`/${role}/products/${product.id}`}
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Manage Product
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


const SearchAndCreateBar = ({ searchTerm, onSearchChange, role }) => (
  <div className="mb-6 flex justify-between items-center flex-col sm:flex-row gap-4">
    <input
      type="text"
      placeholder="Search by name or SKU..."
      className="input input-bordered w-full sm:w-1/2"
      value={searchTerm}
      onChange={onSearchChange}
    />
    <Link to={`/${role}/products/create`} className="btn btn-primary">
      + Add New Product
    </Link>
  </div>
);

const LoadingState = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <span className="loading loading-spinner text-error loading-lg"></span>
  </div>
);

const ErrorState = () => (
  <p className="text-center text-red-500">Failed to load products.</p>
);

const EmptyState = () => (
  <p className="text-center text-gray-500 mt-45">No products found.</p>
);


const MyProductsPage = ({ role }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products = [], isLoading, isError } = useGetMyProductsQuery();

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term)) ||
        (product.variants && product.variants.some(v => 
          v.name.toLowerCase().includes(term) || 
          v.sku.toLowerCase().includes(term)
        ))
    );
  }, [products, searchTerm]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">My Products</h2>

      <SearchAndCreateBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        role={role}
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState />
      ) : filteredProducts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} role={role} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProductsPage;