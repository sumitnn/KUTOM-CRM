import { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiSearch, FiX, FiCheck, FiStar } from "react-icons/fi";
import BrandCard from "./BrandCard";
import {
  useGetBrandsQuery,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} from "../features/brand/brandApi";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}


const ViewBrandsPage = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data: brands = [], isLoading, isError, refetch } = useGetBrandsQuery({
    search: debouncedSearch,
  });
  const [updateBrand] = useUpdateBrandMutation();
  const [deleteBrand] = useDeleteBrandMutation();

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [descExpandedMap, setDescExpandedMap] = useState({});

  const toggleDescription = (id) => {
    setDescExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openDeleteConfirm = (brand) => {
    setBrandToDelete(brand);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteBrand(brandToDelete.id).unwrap();
      setDeleteConfirmOpen(false);
      setBrandToDelete(null);
      refetch();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleUpdate = async () => {
    if (!selectedBrand) return;
  
    try {
      const formData = new FormData();
      formData.append("name", selectedBrand.name);
      formData.append("description", selectedBrand.description || "");
      formData.append("is_featured", selectedBrand.is_featured ? "true" : "false");
  
      if (selectedBrand.logoFile) {
        formData.append("logo", selectedBrand.logoFile);
      }
  
      await updateBrand({ id: selectedBrand.id, data: formData }).unwrap();
      setSelectedBrand(null);
      setLogoPreview(null);
      refetch();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedBrand((prev) => ({ ...prev, logoFile: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleEdit = (brand) => {
    setSelectedBrand({
      id: brand.id,
      name: brand.name,
      description: brand.description || "",
      is_featured: brand.is_featured,
      logo: brand.logo,
    });
    setLogoPreview(null);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (isError) return (
    <div className="text-center py-12">
      <div className="text-red-500 text-lg font-medium mb-4">Error loading brands</div>
      <button 
        onClick={refetch}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Brand Management</h1>
            <p className="text-gray-500 mt-1">
              {brands.length} {brands.length === 1 ? 'brand' : 'brands'} found
            </p>
          </div>
          
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search brands..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {brands.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
              <FiX className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No brands found</h3>
            <p className="mt-1 text-gray-500">
              {search ? 'Try a different search term' : 'No brands available at the moment'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {brands.map((brand) => (
  <BrandCard
    key={brand.id}
    brand={brand}
    isOwner={brand.access}
    isExpanded={descExpandedMap[brand.id]}
    toggleDescription={toggleDescription}
    handleEdit={handleEdit}
    openDeleteConfirm={openDeleteConfirm}
  />
))}

          </div>
        )}
      </div>

      {/* Edit Modal */}
      {selectedBrand && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBrand(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="h-6 w-6" />
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Edit Brand</h2>

            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="relative">
                <img
                  src={
                    logoPreview
                      ? logoPreview
                      : selectedBrand.logo
                      ? `${import.meta.env.VITE_IMAGE_API_URL}${selectedBrand.logo}`
                      : "/placeholder-brand.png"
                  }
                  alt="Brand Logo Preview"
                  className="w-28 h-28 object-cover rounded-full border-2 border-white shadow-md"
                />
                <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <FiEdit2 className="h-4 w-4" />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={selectedBrand.name}
                  onChange={(e) =>
                    setSelectedBrand((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  value={selectedBrand.description}
                  onChange={(e) =>
                    setSelectedBrand((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              <div className="flex items-center">
                <input
                  id="featured-checkbox"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={selectedBrand.is_featured}
                  onChange={(e) =>
                    setSelectedBrand((prev) => ({ ...prev, is_featured: e.target.checked }))
                  }
                />
                <label htmlFor="featured-checkbox" className="ml-2 block text-sm text-gray-700">
                  Featured Brand
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setSelectedBrand(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && brandToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <FiTrash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Delete {brandToDelete.name}?
            </h3>
            <p className="text-gray-500 mb-6">
              This action cannot be undone. All products under this brand will remain but will no longer be associated with it.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewBrandsPage;