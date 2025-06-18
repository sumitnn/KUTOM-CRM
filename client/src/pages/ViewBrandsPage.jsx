import { useState, useMemo } from "react";
import { FiEdit2, FiTrash2, FiSearch, FiX, FiPlus, FiImage, FiStar } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";


import {
  useGetBrandsQuery,
  useUpdateBrandMutation
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

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);



  const memoizedBrands = useMemo(() => brands, [brands]);

  const ImageLoader = ({ src, alt, className }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
      <div className={`relative ${className}`}>
        {!loaded && !error && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-full"></div>
        )}
        <img
          src={error ? "/placeholder-brand.png" : src}
          alt={alt}
          className={`${className} ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setError(true);
            setLoaded(true);
          }}
          loading="lazy"
        />
      </div>
    );
  };

 

  const handleUpdate = async () => {
    if (!selectedBrand) return;
  
    try {
      const formData = new FormData();
      formData.append("name", selectedBrand.name);
      formData.append("description", selectedBrand.description || "");
      formData.append("is_active", selectedBrand.is_active ? "true" : "false");
  
      if (selectedBrand.logoFile) {
        formData.append("logo", selectedBrand.logoFile);
      }
  
      await updateBrand({ id: selectedBrand.id, data: formData }).unwrap();
      refetch();
      toast.success("Brand Details Updated Successfully");
    } catch (err) {
      console.error("Update failed:", err);
      toast.error(err.data.message);
    } finally {
      setSelectedBrand(null);
      setLogoPreview(null);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedBrand(prev => ({ ...prev, logoFile: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
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
      <div className="max-w-8xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Brand Management</h1>
            <p className="text-gray-500 font-bold mt-1">
              {memoizedBrands.length} {memoizedBrands.length === 1 ? 'brand' : 'brands'} found
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="searchbrand"
                name="searchbrand"
                type="text"
                placeholder="Search brands..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link 
              to="/vendor/create-brand" 
              className="btn btn-primary gap-2 whitespace-nowrap"
            >
              <FiPlus /> New Brand
            </Link>
          </div>
        </div>

        {memoizedBrands.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 bg-gray-100 rounded-full mb-4">
              <FiImage className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No brands found</h3>
            <p className="mt-1 text-gray-500">
              {search ? 'Try a different search term' : 'Click "New Brand" to create one'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sr No.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Brand Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Logo</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Active</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated Date</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {memoizedBrands.map((brand, index) => (
                    <tr key={brand.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                       {brand.created_at}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <ImageLoader
                          src={brand.logo ? brand.logo : "https://onno.spagreen.net/demo/public/default-image/default-1080x1000.png"}
                          alt={brand.name}
                          className="h-10 w-10 rounded-full object-cover border border-gray-200"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
  <div className="text-sm font-medium text-gray-900">
    {brand.description?.length > 18
      ? `${brand.description.slice(0, 18)}...`
      : brand.description}
  </div>
</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {brand.is_active ? (
                          <FiStar className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                       {brand.updated_at}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
  <div className="flex justify-end gap-2">
    <button
      onClick={() =>
        setSelectedBrand({
          id: brand.id,
          name: brand.name,
          description: brand.description || "",
          is_active: brand.is_active,
          logo: brand.logo,
        })
      }
      className="flex items-center gap-1 text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition"
      title="Edit"
    >
      <FiEdit2 className="h-4 w-4" />
      <span className="hidden sm:inline">Edit</span>
    </button>
  </div>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {selectedBrand && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setSelectedBrand(null);
                setLogoPreview(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="h-6 w-6" />
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {selectedBrand.id ? "Edit Brand" : "Create Brand"}
            </h2>

            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="relative">
                <ImageLoader
                  src={
                    logoPreview || 
                    (selectedBrand.logo ?selectedBrand.logo : "https://onno.spagreen.net/demo/public/default-image/default-1080x1000.png")
                  }
                  alt="Brand Logo"
                  className="w-28 h-28 rounded-full border-2 border-white shadow-md object-cover"
                />
                <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                  <input
                    id="logo"
                    name="file"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                <input
                  id="brandname"
                  name="brandname"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={selectedBrand.name}
                  onChange={(e) => setSelectedBrand(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  value={selectedBrand.description}
                  onChange={(e) => setSelectedBrand(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="isactive"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={selectedBrand.is_active}
                  onChange={(e) => setSelectedBrand(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Featured Brand
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedBrand(null);
                  setLogoPreview(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

  
    </div>
  );
};

export default ViewBrandsPage;