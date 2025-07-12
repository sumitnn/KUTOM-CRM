import { useState, lazy, Suspense } from 'react';
import {
  FiEdit2,
  FiSearch,
  FiX,
  FiPlus,
  FiImage,
  FiStar,
  FiCheckCircle,
  FiUpload
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
  useGetBrandsQuery,
  useUpdateBrandMutation,
  useCreateBrandMutation
} from '../features/brand/brandApi';
import { useGetCurrentUserQuery } from '../features/auth/authApi';

// Lazy-loaded components
const Spinner = lazy(() => import('../components/common/Spinner'));
const ErrorMessage = lazy(() => import('../components/common/ErrorMessage'));

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

const ViewBrandsPage = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Get current user data
  const { data: currentUser } = useGetCurrentUserQuery();
  
  const {
    data: brands = [],
    isLoading,
    isError,
    refetch,
    isFetching
  } = useGetBrandsQuery(searchQuery, {
    skip: isSearching,
  });

  const [updateBrand] = useUpdateBrandMutation();
  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
  const [brandupdating, Setbrandupdating] = useState(false);

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({
    name: '',
    description: '',
    is_active: false,
    logoFile: null
  });

  // Check if user can edit a brand
  const canEditBrand = (brand) => {
    
    return currentUser?.role === 'admin' || brand?.owner=== currentUser?.id;
  };

  const handleSearch = () => {
    const trimmedSearch = searchInput.trim();
    if (trimmedSearch === searchQuery) {
      refetch();
      return;
    }
    setIsSearching(true);
    setSearchQuery(trimmedSearch);
    refetch().finally(() => setIsSearching(false));
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    refetch();
  };

  const handleUpdate = async () => {
    if (!selectedBrand) return;
    Setbrandupdating(true);

    try {
      const formData = new FormData();
      formData.append('name', selectedBrand.name);
      formData.append('description', selectedBrand.description || '');
      formData.append('is_active', selectedBrand.is_active ? 'true' : 'false');

      if (selectedBrand.logoFile) {
        formData.append('logo', selectedBrand.logoFile);
      }

      await updateBrand({ id: selectedBrand.id, data: formData }).unwrap();
      Setbrandupdating(false)
      refetch();
      toast.success('Brand updated successfully');
      setSelectedBrand(null);
      setLogoPreview(null);
    } catch (err) {
      console.error('Update failed:', err);
      toast.error(err.data?.message || 'Failed to update brand');
    }
  };

  const handleCreate = async () => {
    try {
      const formData = new FormData();
      formData.append('name', newBrand.name);
      formData.append('description', newBrand.description || '');
      formData.append('is_active', newBrand.is_active ? 'true' : 'false');

      if (newBrand.logoFile) {
        formData.append('logo', newBrand.logoFile);
      }

      await createBrand(formData).unwrap();
      refetch();
      toast.success('Brand created successfully');
      setIsCreateModalOpen(false);
      setNewBrand({
        name: '',
        description: '',
        is_active: false,
        logoFile: null
      });
    } catch (err) {
      console.error('Create failed:', err);
      toast.error(err.data?.message || 'Failed to create brand');
    }
  };

  const handleLogoChange = (e, isCreate = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isCreate) {
        setNewBrand(prev => ({ ...prev, logoFile: file }));
      } else {
        setSelectedBrand(prev => ({ ...prev, logoFile: file }));
      }
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  if (isLoading) return (
    <Suspense fallback={<div>Loading...</div>}>
      <Spinner />
    </Suspense>
  );

  if (isError) return (
    <Suspense fallback={<div>Loading error message...</div>}>
      <ErrorMessage onRetry={refetch} />
    </Suspense>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Brand Management</h1>
            <p className="text-gray-500 font-bold mt-1">
              {brands.length} {brands.length === 1 ? 'brand' : 'brands'} found
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex items-center">
              <div className="relative w-full sm:w-64 flex">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
  id="searchbrand"
  name="searchbrand"
  type="text"
  placeholder="Search brands..."
  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
  value={searchInput}
  onChange={(e) => setSearchInput(e.target.value)}
  onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
/>

                <button
                  onClick={handleSearch}
                  disabled={isFetching || isSearching || !searchInput.trim()}
                  className={`px-4 py-2 border-t border-b cursor-pointer border-gray-300 ${
                    isFetching || isSearching
                      ? 'bg-gray-300 cursor-not-allowed'
                      : searchInput.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200 cursor-not-allowed text-gray-500'
                  }`}
                >
                  {isFetching || isSearching ? 'Searching...' : 'Search'}
                </button>
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-r-lg transition"
                    title="Clear search"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary gap-2 whitespace-nowrap animate-bounce hover:animate-none"
            >
              <FiPlus /> Create New Brand
            </button>
          </div>
        </div>

        {brands.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 bg-gray-100 rounded-full mb-4">
              <FiImage className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No brands found</h3>
            <p className="mt-1 text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Click "New Brand" to create one'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-black uppercase tracking-wider">Sr No.</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-black uppercase tracking-wider">Created Date</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-black uppercase tracking-wider">Brand Name</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-black uppercase tracking-wider">Logo</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-black uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-black uppercase tracking-wider">Active</th>
                    <th className="px-4 py-3 text-left text-xs font-extrabold text-black uppercase tracking-wider">Last Updated Date</th>
                    <th className="px-4 py-3 text-right text-xs font-extrabold text-black uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {brands.map((brand, index) => (
                    <tr key={brand.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-extrabold text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-500">
                       {brand.created_at}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{brand.name}</div>
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
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-500">
                       {brand.updated_at}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {canEditBrand(brand) && (
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
                              <span className="hidden sm:inline font-bold hover:cursor-pointer">Edit</span>
                            </button>
                          )}
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
              <FiX className="h-6 w-6 font-bold hover:cursor-pointer" />
            </button>
            
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900">Edit Brand</h2>

            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="relative">
                <ImageLoader
                  src={
                    logoPreview || 
                    (selectedBrand.logo ? selectedBrand.logo : "https://onno.spagreen.net/demo/public/default-image/default-1080x1000.png")
                  }
                  alt="Brand Logo"
                  className="w-28 h-28 rounded-full border-2 border-white shadow-md object-cover"
                />
                <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                  <input
                    id="logo"
                    name="file"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <FiUpload className="h-4 w-4" />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Brand Name *</label>
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
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  id="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  value={selectedBrand.description}
                  onChange={(e) => setSelectedBrand(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex items-center">
                <label htmlFor="isactive" className="flex items-center cursor-pointer select-none">
                  <div className="relative">
                    <input
                      id="isactive"
                      type="checkbox"
                      className="sr-only"
                      checked={selectedBrand.is_active}
                      onChange={(e) =>
                        setSelectedBrand((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                    />
                    <div
                      className={`w-10 h-6 sm:w-12 sm:h-7 rounded-full transition-colors duration-300 ${
                        selectedBrand.is_active ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                        selectedBrand.is_active ? "translate-x-4 sm:translate-x-5" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="ml-3 text-sm sm:text-base text-gray-700 font-bold">Is Active</span>
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
  <button
    onClick={() => {
      setSelectedBrand(null);
      setLogoPreview(null);
      
                }}
                disabled = { brandupdating }
    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition cursor-pointer"
  >
    Cancel
  </button>
  <button
    onClick={handleUpdate}
    className={`px-4 py-2 text-white font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition flex items-center justify-center gap-2 h-10 ${
      brandupdating
        ? 'bg-green-400 cursor-not-allowed'
        : 'bg-green-600 hover:bg-green-700 cursor-pointer'
    }`}
    disabled={brandupdating}
  >
    {brandupdating ? "Updating..." : <><FiCheckCircle /> Update</>}
  </button>
</div>
          </div>
        </div>
      )}

      {/* Create Brand Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setLogoPreview(null);
                setNewBrand({
                  name: "",
                  description: "",
                  is_active: false,
                  logoFile: null
                });
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="h-6 w-6 font-bold hover:cursor-pointer" />
            </button>
            
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900">Create New Brand</h2>

            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="relative">
                <ImageLoader
                  src={
                    logoPreview || 
                    "https://onno.spagreen.net/demo/public/default-image/default-1080x1000.png"
                  }
                  alt="Brand Logo"
                  className="w-28 h-28 rounded-full border-2 border-white shadow-md object-cover"
                />
                <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
                  <input
                    id="logo"
                    name="file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoChange(e, true)}
                    className="hidden"
                  />
                  <FiUpload className="h-4 w-4" />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Brand Name *</label>
                <input
                  id="brandname"
                  name="brandname"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={newBrand.name}
                  onChange={(e) => setNewBrand(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  id="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  value={newBrand.description}
                  onChange={(e) => setNewBrand(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex items-center">
                <label htmlFor="isactive" className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      id="isactive"
                      type="checkbox"
                      className="sr-only"
                      checked={newBrand.is_active}
                      onChange={(e) =>
                        setNewBrand((prev) => ({ ...prev, is_active: e.target.checked }))
                      }
                    />
                    <div
                      className={`block w-14 h-8 rounded-full ${
                        newBrand.is_active ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <div
                      className={`dot absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition ${
                        newBrand.is_active ? "translate-x-6" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="ml-3 text-sm text-gray-700 font-bold">Is Active</span>
                </label>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setLogoPreview(null);
                  setNewBrand({
                    name: "",
                    description: "",
                    is_active: false,
                    logoFile: null
                  });
                }}
                className="px-4 py-2 border border-gray-300 font-bold hover:cursor-pointer rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
  onClick={handleCreate}
  className={`px-4 py-2 text-white font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition flex items-center justify-center gap-2 h-10 ${
    isCreating || !newBrand.name
      ? 'bg-green-400 cursor-not-allowed'
      : 'bg-green-600 hover:bg-green-700 cursor-pointer'
  }`}
  disabled={isCreating || !newBrand.name}
>
  {isCreating ? (
    "Creating..."
  ) : (
    <>
      <FiCheckCircle /> Create Brand
    </>
  )}
</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewBrandsPage;