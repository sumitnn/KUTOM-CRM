import { useState, lazy, Suspense } from 'react';
import {
  FiEdit2,
  FiSearch,
  FiX,
  FiPlus,
  FiImage,
  FiStar,
  FiCheckCircle,
  FiUpload,
  FiAlertCircle
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
  useGetBrandsQuery,
  useUpdateBrandMutation,
  useCreateBrandMutation
} from '../features/brand/brandApi';
import { useGetCurrentUserQuery } from '../features/auth/authApi';
import ModalPortal from '../components/ModalPortal';

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
        className={`${className} ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200 object-cover`}
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
  const [logoError, setLogoError] = useState('');

  // Check if user can edit a brand
  const canEditBrand = (brand) => {
    return currentUser?.role === 'admin' || brand?.owner === currentUser?.id;
  };

  // Validate image file
  const validateImage = (file) => {
    console.log(file.size)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 600 * 1024; // 5MB in bytes

    if (!validTypes.includes(file.type)) {
      return 'Please select a valid image format (PNG or JPG only)';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 600kb';
    }

    return '';
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
      Setbrandupdating(false);
      refetch();
      toast.success('Brand updated successfully');
      setSelectedBrand(null);
      setLogoPreview(null);
      setLogoError('');
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
      setLogoPreview(null);
      setLogoError('');
    } catch (err) {
      console.error('Create failed:', err);
      toast.error(err.data?.message || 'Failed to create brand');
    }
  };

  const handleLogoChange = (e, isCreate = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const error = validateImage(file);
    if (error) {
      setLogoError(error);
      toast.error(error);
      return;
    }

    setLogoError('');
    if (isCreate) {
      setNewBrand(prev => ({ ...prev, logoFile: file }));
    } else {
      setSelectedBrand(prev => ({ ...prev, logoFile: file }));
    }
    setLogoPreview(URL.createObjectURL(file));
  };

  if (isLoading) return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Spinner />
    </Suspense>
  );

  if (isError) return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading error message...</div>}>
      <ErrorMessage onRetry={refetch} />
    </Suspense>
  );

  return (
    <div className="min-h-screen  py-4 ">
      <div className="max-w-8xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold  bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Brand Management
              </h1>
              <p className="text-gray-600 font-medium mt-2 text-lg">
                {brands.length} {brands.length === 1 ? 'brand' : 'brands'} found
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 lg:flex-initial">
                <div className="relative flex rounded-2xl shadow-sm bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="searchbrand"
                    name="searchbrand"
                    type="text"
                    placeholder="Search brands..."
                    className="block w-full pl-12 pr-4 py-3 border-0 bg-transparent focus:ring-0 text-gray-900 placeholder-gray-500 font-medium"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  {searchInput && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSearch}
                  disabled={isFetching || isSearching || !searchInput.trim()}
                  className={`px-6 py-3 cursor-pointer rounded-2xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                    isFetching || isSearching
                      ? 'bg-gray-300 cursor-not-allowed'
                      : searchInput.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                        : 'bg-gray-200 cursor-not-allowed text-gray-500'
                  }`}
                >
                  <FiSearch className="h-4 w-4" />
                  {isFetching || isSearching ? 'Searching...' : 'Search'}
                </button>
                
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r cursor-pointer from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                >
                  <FiPlus className="h-5 w-5" />
                  <span className="hidden sm:inline">New Brand</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Brands Table */}
        {brands.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mb-6 shadow-inner">
              <FiImage className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No brands found</h3>
            <p className="text-gray-600 text-lg mb-6">
              {searchQuery ? 'Try a different search term' : 'Get started by creating your first brand'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 mx-auto"
              >
                <FiPlus className="h-5 w-5" />
                Create First Brand
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Brand</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Logo</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider hidden xl:table-cell">Updated</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {brands.map((brand, index) => (
                    <tr key={brand.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 bg-gray-50 rounded-lg w-8 h-8 flex items-center justify-center">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{brand.created_at}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{brand.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ImageLoader
                          src={brand.logo || "https://onno.spagreen.net/demo/public/default-image/default-1080x1000.png"}
                          alt={brand.name}
                          className="h-12 w-12 rounded-xl object-cover border-2 border-white shadow-md"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm font-medium text-gray-700 max-w-xs truncate">
                          {brand.description || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          brand.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {brand.is_active ? (
                            <>
                              <FiStar className="w-4 h-4 mr-1 fill-current" />
                              Active
                            </>
                          ) : (
                            'Inactive'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                        <div className="text-sm font-semibold text-gray-600">{brand.updated_at}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
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
                              className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold transition-all duration-200 hover:shadow-md"
                              title="Edit"
                            >
                              <FiEdit2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Edit</span>
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
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedBrand(null);
                  setLogoPreview(null);
                  setLogoError('');
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <FiX className="h-6 w-6 font-bold" />
              </button>
              
              <div className="text-center mb-2">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Edit Brand
                </h2>
                <p className="text-gray-600 mt-2">Update your brand information</p>
              </div>

              {/* Logo Upload Section */}
              <div className="flex flex-col items-center space-y-4 mb-6">
                <div className="relative group">
                  <ImageLoader
                    src={
                      logoPreview || 
                      (selectedBrand.logo || "https://onno.spagreen.net/demo/public/default-image/default-1080x1000.png")
                    }
                    alt="Brand Logo"
                    className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl object-cover group-hover:shadow-2xl transition-all duration-300"
                  />
                  <label className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md">
                    <input
                      id="logo"
                      name="file"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <FiUpload className="h-5 w-5" />
                  </label>
                </div>
                {logoError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl">
                    <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{logoError}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 text-center">
                  Supported formats: PNG, JPG • Max size: 600kb
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Brand Name *</label>
                  <input
                    id="brandname"
                    name="brandname"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={selectedBrand.name}
                    onChange={(e) => setSelectedBrand(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    id="description"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                    rows={4}
                    value={selectedBrand.description}
                    onChange={(e) => setSelectedBrand(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter brand description..."
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <label htmlFor="isactive" className="flex items-center cursor-pointer select-none">
                    <span className="text-sm font-bold text-gray-700 mr-3">Active Status</span>
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
                        className={`w-14 h-7 rounded-full transition-colors duration-300 ${
                          selectedBrand.is_active ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <div
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
                          selectedBrand.is_active ? "translate-x-7" : ""
                        }`}
                      ></div>
                    </div>
                  </label>
                  {selectedBrand.is_active ? (
                    <FiStar className="h-6 w-6 text-green-500 fill-current" />
                  ) : (
                    <FiX className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedBrand(null);
                    setLogoPreview(null);
                    setLogoError('');
                  }}
                  disabled={brandupdating}
                  className="px-6 py-3 border cursor-pointer border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-semibold hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={brandupdating}
                  className={`px-6 py-3 cursor-pointer text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 flex items-center justify-center gap-2 ${
                    brandupdating
                      ? 'bg-green-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  {brandupdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="h-5 w-5" />
                      Update Brand
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Create Brand Modal */}
      {isCreateModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setLogoPreview(null);
                  setLogoError('');
                  setNewBrand({
                    name: "",
                    description: "",
                    is_active: false,
                    logoFile: null
                  });
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <FiX className="h-6 w-6 font-bold" />
              </button>
              
              <div className="text-center mb-2">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                  Create Brand
                </h2>
                <p className="text-gray-600 mt-2">Add a new brand to your collection</p>
              </div>

              {/* Logo Upload Section */}
              <div className="flex flex-col items-center space-y-4 mb-6">
                <div className="relative group">
                  <ImageLoader
                    src={logoPreview || "https://onno.spagreen.net/demo/public/default-image/default-1080x1000.png"}
                    alt="Brand Logo"
                    className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl object-cover group-hover:shadow-2xl transition-all duration-300"
                  />
                  <label className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md">
                    <input
                      id="logo"
                      name="file"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => handleLogoChange(e, true)}
                      className="hidden"
                    />
                    <FiUpload className="h-5 w-5" />
                  </label>
                </div>
                {logoError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl">
                    <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{logoError}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 text-center">
                  Supported formats: PNG, JPG • Max size: 600kb
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Brand Name *</label>
                  <input
                    id="brandname"
                    name="brandname"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newBrand.name}
                    onChange={(e) => setNewBrand(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter brand name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    id="description"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                    rows={4}
                    value={newBrand.description}
                    onChange={(e) => setNewBrand(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter brand description..."
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <label htmlFor="create-isactive" className="flex items-center cursor-pointer">
                    <span className="text-sm font-bold text-gray-700 mr-3">Active Status</span>
                    <div className="relative">
                      <input
                        id="create-isactive"
                        type="checkbox"
                        className="sr-only"
                        checked={newBrand.is_active}
                        onChange={(e) =>
                          setNewBrand((prev) => ({ ...prev, is_active: e.target.checked }))
                        }
                      />
                      <div
                        className={`block w-14 h-7 rounded-full transition-colors duration-300 ${
                          newBrand.is_active ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <div
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
                          newBrand.is_active ? "translate-x-7" : ""
                        }`}
                      ></div>
                    </div>
                  </label>
                  {newBrand.is_active ? (
                    <FiStar className="h-6 w-6 text-green-500 fill-current" />
                  ) : (
                    <FiX className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setLogoPreview(null);
                    setLogoError('');
                    setNewBrand({
                      name: "",
                      description: "",
                      is_active: false,
                      logoFile: null
                    });
                  }}
                  className="px-6 py-3 cursor-pointer border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-semibold hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !newBrand.name}
                  className={`px-6 py-3 cursor-pointer text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                    isCreating || !newBrand.name
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="h-5 w-5" />
                      Create Brand
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default ViewBrandsPage;