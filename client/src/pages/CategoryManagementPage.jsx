import { useState, useEffect } from "react";
import {
  useGetMainCategoriesQuery,
  useAddMainCategoryMutation,
  useUpdateMainCategoryMutation,
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useGetSubcategoriesQuery,
  useAddSubcategoryMutation,
  useUpdateSubcategoryMutation,
} from "../features/category/categoryApi";
import { useGetBrandsQuery } from "../features/brand/brandApi";
import { useGetCurrentUserQuery } from '../features/auth/authApi';
import { toast } from "react-toastify";
import { FiEdit2, FiPlus, FiX, FiTrash2, FiSearch, FiUpload, FiAlertCircle, FiImage } from "react-icons/fi";
import { format } from "date-fns";

const CategoryManagementPage = () => {
  const [activeTab, setActiveTab] = useState("main-categories");
  
  // Search states
  const [mainCategorySearchTerm, setMainCategorySearchTerm] = useState("");
  const [mainCategorySearch, setMainCategorySearch] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [subcategorySearchTerm, setSubcategorySearchTerm] = useState("");
  const [subcategorySearch, setSubcategorySearch] = useState("");
  
  // Main Category states
  const [mainCategoryForm, setMainCategoryForm] = useState({
    name: "",
    image: null,
    is_active: true,
    imagePreview: null
  });
  const [isMainCategoryFormOpen, setIsMainCategoryFormOpen] = useState(false);
  const [imageError, setImageError] = useState("");
  
  // Category states
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    main_category: "",
    is_active: true
  });
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  
  // Subcategory states
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: "",
    category: "",
    brand: "",
    is_active: true
  });
  const [isSubcategoryFormOpen, setIsSubcategoryFormOpen] = useState(false);
  
  // Edit states
  const [editMainCategory, setEditMainCategory] = useState(null);
  const [editCategory, setEditCategory] = useState(null);
  const [editSubcategory, setEditSubcategory] = useState(null);

  // Loading states for mutations
  const [isMainCategoryLoading, setIsMainCategoryLoading] = useState(false);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [isSubcategoryLoading, setIsSubcategoryLoading] = useState(false);

  // Current user
  const { data: currentUser } = useGetCurrentUserQuery();

  // Data fetching with search queries
  const { 
    data: mainCategories = [], 
    isLoading: isMainCategoriesLoading,
    refetch: refetchMainCategories 
  } = useGetMainCategoriesQuery(mainCategorySearch);
  
  const { 
    data: categories = [], 
    isLoading: isCategoriesLoading,
    refetch: refetchCategories 
  } = useGetCategoriesQuery(categorySearch);
  
  const {
    data: brands = [],
    isLoading: isBrandsLoading
  } = useGetBrandsQuery();

  const { 
    data: subcategories = [], 
    isLoading: isSubcategoriesLoading,
    refetch: refetchSubcategories 
  } = useGetSubcategoriesQuery(subcategorySearch, {
    skip: activeTab !== "subcategories"
  });

  // Mutations
  const [addMainCategory] = useAddMainCategoryMutation();
  const [updateMainCategory] = useUpdateMainCategoryMutation();
  const [addCategory] = useAddCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [addSubcategory] = useAddSubcategoryMutation();
  const [updateSubcategory] = useUpdateSubcategoryMutation();

  // Validate image file
  const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 600 * 1024; // 600KB in bytes

    if (!validTypes.includes(file.type)) {
      return 'Please select a valid image format (PNG or JPG only)';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 600KB';
    }

    return '';
  };

  // Reset forms when tab changes
  useEffect(() => {
    setIsMainCategoryFormOpen(false);
    setIsCategoryFormOpen(false);
    setIsSubcategoryFormOpen(false);
    setEditMainCategory(null);
    setEditCategory(null);
    setEditSubcategory(null);
    setMainCategorySearchTerm("");
    setMainCategorySearch("");
    setCategorySearchTerm("");
    setCategorySearch("");
    setSubcategorySearchTerm("");
    setSubcategorySearch("");
    setImageError("");
  }, [activeTab]);

  // Handle main category creation/update
  const handleCreateMainCategory = async (e) => {
    e.preventDefault();
    
    // Validate image for new categories
    if (!editMainCategory && !mainCategoryForm.image) {
      toast.error("Image is required for new categories");
      return;
    }

    setIsMainCategoryLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', mainCategoryForm.name);
      formData.append('is_active', mainCategoryForm.is_active);
      
      if (mainCategoryForm.image) {
        formData.append('image', mainCategoryForm.image);
      }

      if (editMainCategory) {
        await updateMainCategory({
          id: editMainCategory.id,
          data: formData
        }).unwrap();
        toast.success("Main Category updated successfully");
      } else {
        await addMainCategory(formData).unwrap();
        toast.success("Main Category created successfully");
      }
      
      setMainCategoryForm({ 
        name: "", 
        image: null, 
        is_active: true,
        imagePreview: null
      });
      setIsMainCategoryFormOpen(false);
      setEditMainCategory(null);
      setImageError("");
      refetchMainCategories();
    } catch (error) {
      toast.error(error.data?.message || "Failed to process main category");
    } finally {
      setIsMainCategoryLoading(false);
    }
  };

  // Handle category creation/update
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setIsCategoryLoading(true);
    try {
      const data = {
        name: categoryForm.name,
        main_category: categoryForm.main_category,
        is_active: categoryForm.is_active
      };
   
      if (editCategory) {
        await updateCategory({
          id: editCategory.id,
          data: data
        }).unwrap();
        toast.success("Category updated successfully");
      } else {
        await addCategory(data).unwrap();
        toast.success("Category created successfully");
      }
      
      setCategoryForm({ 
        name: "", 
        main_category: "", 
        is_active: true 
      });
      setIsCategoryFormOpen(false);
      setEditCategory(null);
      refetchCategories();
    } catch (error) {
      toast.error(error.data?.message || "Failed to process category");
    } finally {
      setIsCategoryLoading(false);
    }
  };

  // Handle subcategory creation/update
  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    setIsSubcategoryLoading(true);
    try {
      const data = {
        name: subcategoryForm.name,
        category: subcategoryForm.category,
        brand: subcategoryForm.brand,
        is_active: subcategoryForm.is_active
      };

      if (editSubcategory) {
        await updateSubcategory({
          id: editSubcategory.id,
          data: data
        }).unwrap();
        toast.success("Subcategory updated successfully");
      } else {
        await addSubcategory(data).unwrap();
        toast.success("Subcategory created successfully");
      }
      
      setSubcategoryForm({ 
        name: "", 
        category: "", 
        brand: "", 
        is_active: true 
      });
      setIsSubcategoryFormOpen(false);
      setEditSubcategory(null);
      refetchSubcategories();
    } catch (error) {
      toast.error(error.data?.message || "Failed to process subcategory");
    } finally {
      setIsSubcategoryLoading(false);
    }
  };

  // Handle image upload for main category
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const error = validateImage(file);
    if (error) {
      setImageError(error);
      toast.error(error);
      return;
    }

    setImageError("");
    const reader = new FileReader();
    reader.onloadend = () => {
      setMainCategoryForm({
        ...mainCategoryForm,
        image: file,
        imagePreview: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  // Set edit data for main category
  const handleEditMainCategory = (mainCategory) => {
    setEditMainCategory(mainCategory);
    setMainCategoryForm({
      name: mainCategory.name,
      image: null,
      is_active: mainCategory.is_active,
      imagePreview: mainCategory.image
    });
    setIsMainCategoryFormOpen(true);
    setImageError("");
  };

  // Set edit data for category
  const handleEditCategory = (category) => {
    setEditCategory(category);
    setCategoryForm({
      name: category.name,
      main_category: category.main_category,
      is_active: category.is_active
    });
    setIsCategoryFormOpen(true);
  };

  // Set edit data for subcategory
  const handleEditSubcategory = (subcategory) => {
    setEditSubcategory(subcategory);
    setSubcategoryForm({
      name: subcategory.name,
      category: subcategory.category,
      brand: subcategory.brand,
      is_active: subcategory.is_active
    });
    setIsSubcategoryFormOpen(true);
  };

  // Handle search
  const handleSearch = (type) => {
    if (type === 'main') {
      setMainCategorySearch(mainCategorySearchTerm);
    } else if (type === 'category') {
      setCategorySearch(categorySearchTerm);
    } else if (type === 'subcategory') {
      setSubcategorySearch(subcategorySearchTerm);
    }
  };

  // Handle search clear
  const handleClearSearch = (type) => {
    if (type === 'main') {
      setMainCategorySearchTerm("");
      setMainCategorySearch("");
    } else if (type === 'category') {
      setCategorySearchTerm("");
      setCategorySearch("");
    } else if (type === 'subcategory') {
      setSubcategorySearchTerm("");
      setSubcategorySearch("");
    }
  };

  // Check edit permissions
  const canEditMainCategory = (mainCategory) => {
    return currentUser?.role === 'admin' || mainCategory?.owner === currentUser?.id;
  };

  const canEditCategory = (category) => {
    return currentUser?.role === 'admin' || category?.owner === currentUser?.id;
  };

  const canEditSubcategory = (subcategory) => {
    return currentUser?.role === 'admin' || subcategory?.owner === currentUser?.id;
  };

  if (isMainCategoriesLoading || isCategoriesLoading || isBrandsLoading || (activeTab === "subcategories" && isSubcategoriesLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-3 sm:py-4 px-3 sm:px-4 lg:px-4">
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header - Fully Responsive */}
          <div className="px-4 sm:px-6 py-6 sm:py-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Category Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium mt-2 max-w-2xl">
                Manage your product categories and organization
              </p>
            </div>
          </div>
          
          {/* Tabs - Responsive with horizontal scroll on mobile */}
          <div className="border-b border-gray-200 bg-white overflow-x-auto">
            <nav className="flex min-w-max sm:min-w-0">
              <button
                onClick={() => setActiveTab("main-categories")}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-center border-b-4 font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === "main-categories" 
                    ? "border-blue-500 text-blue-600 bg-blue-50" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                Main Categories
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-center border-b-4 font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === "categories" 
                    ? "border-blue-500 text-blue-600 bg-blue-50" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setActiveTab("subcategories")}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-center border-b-4 font-bold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === "subcategories" 
                    ? "border-blue-500 text-blue-600 bg-blue-50" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                Subcategories
              </button>
            </nav>
          </div>
          
          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Main Categories Tab */}
            {activeTab === "main-categories" && (
              <div>
                {/* Header with search and button - Responsive stack */}
                <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Main Categories</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search - Full width on mobile */}
                    <div className="relative flex-1">
                      <div className="relative flex rounded-xl sm:rounded-2xl shadow-sm bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200">
                        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                          <FiSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search main categories..."
                          className="block w-full pl-9 sm:pl-12 pr-8 sm:pr-10 py-2 sm:py-3 text-sm sm:text-base border-0 bg-transparent focus:ring-0 text-gray-900 placeholder-gray-500 font-medium"
                          value={mainCategorySearchTerm}
                          onChange={(e) => setMainCategorySearchTerm(e.target.value)}
                          onKeyUp={(e) => e.key === 'Enter' && handleSearch('main')}
                        />
                        {mainCategorySearchTerm && (
                          <button
                            onClick={() => handleClearSearch('main')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <FiX className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Buttons - Side by side on mobile */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSearch('main')}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <FiSearch className="h-4 w-4" />
                        <span className="hidden xs:inline">Search</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsMainCategoryFormOpen(true);
                          setEditMainCategory(null);
                          setMainCategoryForm({
                            name: "",
                            image: null,
                            is_active: true,
                            imagePreview: null
                          });
                          setImageError("");
                        }}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <FiPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden xs:inline">New</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Main Category Form - Responsive */}
                {isMainCategoryFormOpen && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-blue-200 mb-6 sm:mb-8 shadow-lg">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg sm:rounded-xl">
                        <FiImage className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        {editMainCategory ? 'Edit Main Category' : 'Create New Main Category'}
                      </h3>
                    </div>
                    
                    <form onSubmit={handleCreateMainCategory} className="space-y-4 sm:space-y-6">
                      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                        {/* Form Fields */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                              Main Category Name *
                            </label>
                            <input
                              type="text"
                              placeholder="Enter main category name"
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                              value={mainCategoryForm.name}
                              onChange={(e) => setMainCategoryForm({
                                ...mainCategoryForm,
                                name: e.target.value
                              })}
                              required
                            />
                          </div>
                          
                          <div className="flex items-center p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-gray-200">
                            <input
                              type="checkbox"
                              id="main-category-active"
                              className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                              checked={mainCategoryForm.is_active}
                              onChange={(e) => setMainCategoryForm({
                                ...mainCategoryForm,
                                is_active: e.target.checked
                              })}
                            />
                            <label htmlFor="main-category-active" className="ml-2 sm:ml-3 block text-xs sm:text-sm font-bold text-gray-700">
                              Active Category
                            </label>
                          </div>
                        </div>
                        
                        {/* Image Upload - Centered on mobile */}
                        <div className="flex-1">
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2 text-center lg:text-left">
                            Category Image {!editMainCategory && '*'}
                          </label>
                          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                            <div className="relative group">
                              <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-xl sm:rounded-2xl border-4 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden">
                                {mainCategoryForm.imagePreview ? (
                                  <img 
                                    src={mainCategoryForm.imagePreview} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FiImage className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400" />
                                )}
                              </div>
                              <label className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 sm:p-2.5 lg:p-3 rounded-full cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md">
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={handleImageChange}
                                  required={!editMainCategory}
                                />
                                <FiUpload className="h-4 w-4 sm:h-5 sm:w-5" />
                              </label>
                            </div>
                            
                            {imageError && (
                              <div className="flex items-center gap-1 sm:gap-2 text-red-600 text-xs sm:text-sm bg-red-50 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl w-full">
                                <FiAlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span>{imageError}</span>
                              </div>
                            )}
                            
                            <p className="text-xs text-gray-500 text-center">
                              Supported: PNG, JPG • Max: 600KB
                              {editMainCategory && " • Leave empty to keep current"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Form Buttons */}
                      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-blue-200">
                        <button
                          type="button"
                          onClick={() => {
                            setIsMainCategoryFormOpen(false);
                            setEditMainCategory(null);
                            setImageError("");
                          }}
                          className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-semibold text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={isMainCategoryLoading}
                          className={`px-4 sm:px-6 py-2 sm:py-3 text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                            isMainCategoryLoading
                              ? 'bg-blue-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                          }`}
                        >
                          {isMainCategoryLoading ? (
                            <>
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>{editMainCategory ? "Updating..." : "Creating..."}</span>
                            </>
                          ) : (
                            <span>{editMainCategory ? "Update Category" : "Create Category"}</span>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                {/* Main Categories Table - Responsive with card view on mobile */}
                <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Desktop Table View - Hidden on mobile */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">Image</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">Name</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Created</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider hidden xl:table-cell">Updated</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {mainCategories.map((mainCategory) => (
                          <tr key={mainCategory.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl border-2 border-white shadow-md overflow-hidden">
                                <img 
                                  src={mainCategory.image} 
                                  alt={mainCategory.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                              <div className="text-sm lg:text-base font-bold text-gray-900">{mainCategory.name}</div>
                            </td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs lg:text-sm font-semibold ${
                                mainCategory.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {mainCategory.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500 hidden lg:table-cell">
                              {format(new Date(mainCategory.created_at), 'dd MMM yyyy')}
                            </td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500 hidden xl:table-cell">
                              {format(new Date(mainCategory.updated_at), 'dd MMM yyyy')}
                            </td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-right text-xs lg:text-sm font-medium">
                              {canEditMainCategory(mainCategory) && (
                                <button
                                  onClick={() => handleEditMainCategory(mainCategory)}
                                  className="inline-flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-1 lg:py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg lg:rounded-xl font-semibold transition-all duration-200 hover:shadow-md text-xs lg:text-sm"
                                >
                                  <FiEdit2 className="h-3 w-3 lg:h-4 lg:w-4" />
                                  <span className="hidden sm:inline">Edit</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View - Visible only on mobile */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {mainCategories.map((mainCategory) => (
                      <div key={mainCategory.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-xl border-2 border-white shadow-md overflow-hidden">
                              <img 
                                src={mainCategory.image} 
                                alt={mainCategory.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-base font-bold text-gray-900 truncate">{mainCategory.name}</h3>
                                <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-semibold ${
                                  mainCategory.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {mainCategory.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              {canEditMainCategory(mainCategory) && (
                                <button
                                  onClick={() => handleEditMainCategory(mainCategory)}
                                  className="flex-shrink-0 p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200"
                                >
                                  <FiEdit2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              <div>Created: {format(new Date(mainCategory.created_at), 'dd MMM yyyy')}</div>
                              <div className="mt-1">Updated: {format(new Date(mainCategory.updated_at), 'dd MMM yyyy')}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {mainCategories.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                      <FiImage className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No main categories found</h3>
                      <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
                        {mainCategorySearch ? 'Try a different search term' : 'Get started by creating your first main category'}
                      </p>
                      {!mainCategorySearch && (
                        <button
                          onClick={() => setIsMainCategoryFormOpen(true)}
                          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          Create First Category
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Categories Tab - Similar responsive pattern */}
            {activeTab === "categories" && (
              <div>
                {/* Header with search and button */}
                <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Categories</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <div className="relative flex rounded-xl sm:rounded-2xl shadow-sm bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200">
                        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                          <FiSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search categories..."
                          className="block w-full pl-9 sm:pl-12 pr-8 sm:pr-10 py-2 sm:py-3 text-sm sm:text-base border-0 bg-transparent focus:ring-0 text-gray-900 placeholder-gray-500 font-medium"
                          value={categorySearchTerm}
                          onChange={(e) => setCategorySearchTerm(e.target.value)}
                          onKeyUp={(e) => e.key === 'Enter' && handleSearch('category')}
                        />
                        {categorySearchTerm && (
                          <button
                            onClick={() => handleClearSearch('category')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <FiX className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSearch('category')}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <FiSearch className="h-4 w-4" />
                        <span className="hidden xs:inline">Search</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsCategoryFormOpen(true);
                          setEditCategory(null);
                          setCategoryForm({ 
                            name: "", 
                            main_category: "", 
                            is_active: true 
                          });
                        }}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <FiPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden xs:inline">New</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Category Form */}
                {isCategoryFormOpen && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-green-200 mb-6 sm:mb-8 shadow-lg">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                      <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg sm:rounded-xl">
                        <FiPlus className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        {editCategory ? 'Edit Category' : 'Create New Category'}
                      </h3>
                    </div>
                    
                    <form onSubmit={handleCreateCategory} className="space-y-4 sm:space-y-6">
                      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                        <div className="flex-1">
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                            Main Category *
                          </label>
                          <select
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                            value={categoryForm.main_category}
                            onChange={(e) => setCategoryForm({
                              ...categoryForm,
                              main_category: e.target.value
                            })}
                            required
                          >
                            <option value="" disabled>Select Main Category</option>
                            {mainCategories.map((mainCat) => (
                              <option key={mainCat.id} value={mainCat.id}>
                                {mainCat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex-1">
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                            Category Name *
                          </label>
                          <input
                            type="text"
                            placeholder="Enter category name"
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({
                              ...categoryForm,
                              name: e.target.value
                            })}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-gray-200">
                        <input
                          type="checkbox"
                          id="category-active"
                          className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          checked={categoryForm.is_active}
                          onChange={(e) => setCategoryForm({
                            ...categoryForm,
                            is_active: e.target.checked
                          })}
                        />
                        <label htmlFor="category-active" className="ml-2 sm:ml-3 block text-xs sm:text-sm font-bold text-gray-700">
                          Active Category
                        </label>
                      </div>
                      
                      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-green-200">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoryFormOpen(false);
                            setEditCategory(null);
                          }}
                          className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-semibold text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={isCategoryLoading}
                          className={`px-4 sm:px-6 py-2 sm:py-3 text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                            isCategoryLoading
                              ? 'bg-green-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                          }`}
                        >
                          {isCategoryLoading ? (
                            <>
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>{editCategory ? "Updating..." : "Creating..."}</span>
                            </>
                          ) : (
                            <span>{editCategory ? "Update Category" : "Create Category"}</span>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                {/* Categories Table - Desktop */}
                <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">Name</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">Main Category</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Created</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider hidden xl:table-cell">Updated</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {categories.map((category) => {
                          const mainCategory = mainCategories.find(mc => mc.id === category.main_category);
                          return (
                            <tr key={category.id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                <div className="text-sm lg:text-base font-bold text-gray-900">{category.name}</div>
                              </td>
                              <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                <div className="text-sm lg:text-base text-gray-600 font-medium">
                                  {mainCategory?.name || 'Uncategorized'}
                                </div>
                              </td>
                              <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs lg:text-sm font-semibold ${
                                  category.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {category.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500 hidden lg:table-cell">
                                {format(new Date(category.created_at), 'dd MMM yyyy')}
                              </td>
                              <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500 hidden xl:table-cell">
                                {format(new Date(category.updated_at), 'dd MMM yyyy')}
                              </td>
                              <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-right text-xs lg:text-sm font-medium">
                                {canEditCategory(category) && (
                                  <button
                                    onClick={() => handleEditCategory(category)}
                                    className="inline-flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-1 lg:py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg lg:rounded-xl font-semibold transition-all duration-200 hover:shadow-md text-xs lg:text-sm"
                                  >
                                    <FiEdit2 className="h-3 w-3 lg:h-4 lg:w-4" />
                                    <span className="hidden sm:inline">Edit</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View for Categories */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {categories.map((category) => {
                      const mainCategory = mainCategories.find(mc => mc.id === category.main_category);
                      return (
                        <div key={category.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-gray-900 truncate">{category.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {mainCategory?.name || 'Uncategorized'}
                              </p>
                              <span className={`inline-flex items-center px-2 py-0.5 mt-2 rounded-full text-xs font-semibold ${
                                category.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {category.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            {canEditCategory(category) && (
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="flex-shrink-0 p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200 ml-2"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <div>Created: {format(new Date(category.created_at), 'dd MMM yyyy')}</div>
                            <div className="mt-1">Updated: {format(new Date(category.updated_at), 'dd MMM yyyy')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {categories.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                      <FiPlus className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No categories found</h3>
                      <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
                        {categorySearch ? 'Try a different search term' : 'Get started by creating your first category'}
                      </p>
                      {!categorySearch && (
                        <button
                          onClick={() => setIsCategoryFormOpen(true)}
                          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          Create First Category
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Subcategories Tab - Similar responsive pattern */}
            {activeTab === "subcategories" && (
              <div>
                {/* Header with search and button */}
                <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Subcategories</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <div className="relative flex rounded-xl sm:rounded-2xl shadow-sm bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200">
                        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                          <FiSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search subcategories..."
                          className="block w-full pl-9 sm:pl-12 pr-8 sm:pr-10 py-2 sm:py-3 text-sm sm:text-base border-0 bg-transparent focus:ring-0 text-gray-900 placeholder-gray-500 font-medium"
                          value={subcategorySearchTerm}
                          onChange={(e) => setSubcategorySearchTerm(e.target.value)}
                          onKeyUp={(e) => e.key === 'Enter' && handleSearch('subcategory')}
                        />
                        {subcategorySearchTerm && (
                          <button
                            onClick={() => handleClearSearch('subcategory')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <FiX className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSearch('subcategory')}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <FiSearch className="h-4 w-4" />
                        <span className="hidden xs:inline">Search</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsSubcategoryFormOpen(true);
                          setEditSubcategory(null);
                          setSubcategoryForm({ 
                            name: "", 
                            category: "", 
                            brand: "", 
                            is_active: true 
                          });
                        }}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <FiPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden xs:inline">New</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Subcategory Form */}
                {isSubcategoryFormOpen && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-purple-200 mb-6 sm:mb-8 shadow-lg">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                      <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg sm:rounded-xl">
                        <FiPlus className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                        {editSubcategory ? 'Edit Subcategory' : 'Create New Subcategory'}
                      </h3>
                    </div>
                    
                    <form onSubmit={handleCreateSubcategory} className="space-y-4 sm:space-y-6">
                      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                        <div className="flex-1">
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                            Parent Category *
                          </label>
                          <select
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                            value={subcategoryForm.category}
                            onChange={(e) => setSubcategoryForm({
                              ...subcategoryForm,
                              category: e.target.value
                            })}
                            required
                          >
                            <option value="" disabled>Select Category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex-1">
                          <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                            Brand *
                          </label>
                          <select
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                            value={subcategoryForm.brand}
                            onChange={(e) => setSubcategoryForm({
                              ...subcategoryForm,
                              brand: e.target.value
                            })}
                            required
                          >
                            <option value="" disabled>Select Brand</option>
                            {brands.map((brand) => (
                              <option key={brand.id} value={brand.id}>
                                {brand.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">
                          Subcategory Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Enter subcategory name"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          value={subcategoryForm.name}
                          onChange={(e) => setSubcategoryForm({
                            ...subcategoryForm,
                            name: e.target.value
                          })}
                          required
                        />
                      </div>
                      
                      <div className="flex items-center p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-gray-200">
                        <input
                          type="checkbox"
                          id="subcategory-active"
                          className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          checked={subcategoryForm.is_active}
                          onChange={(e) => setSubcategoryForm({
                            ...subcategoryForm,
                            is_active: e.target.checked
                          })}
                        />
                        <label htmlFor="subcategory-active" className="ml-2 sm:ml-3 block text-xs sm:text-sm font-bold text-gray-700">
                          Active Subcategory
                        </label>
                      </div>
                      
                      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-purple-200">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSubcategoryFormOpen(false);
                            setEditSubcategory(null);
                          }}
                          className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-semibold text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          disabled={isSubcategoryLoading}
                          className={`px-4 sm:px-6 py-2 sm:py-3 text-white font-semibold rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                            isSubcategoryLoading
                              ? 'bg-purple-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                          }`}
                        >
                          {isSubcategoryLoading ? (
                            <>
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>{editSubcategory ? "Updating..." : "Creating..."}</span>
                            </>
                          ) : (
                            <span>{editSubcategory ? "Update Subcategory" : "Create Subcategory"}</span>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                {/* Subcategories Table - Desktop */}
                <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">Name</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">Parent Category</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">Brand</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Created</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider hidden xl:table-cell">Updated</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {subcategories.map((subcategory) => {
                          const parentCategory = categories.find(cat => cat.id === subcategory.category);
                          const brand = brands.find(b => b.id === subcategory.brand);
                          return (
                            <tr key={subcategory.id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                <div className="text-sm lg:text-base font-bold text-gray-900">{subcategory.name}</div>
                              </td>
                              <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                <div className="text-sm lg:text-base text-gray-600 font-medium">
                                  {parentCategory?.name || 'Unknown'}
                                </div>
                              </td>
                              <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                <div className="text-sm lg:text-base text-gray-600 font-medium">
                                  {brand?.name || 'No Brand'}
                                </div>
                              </td>
                              <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs lg:text-sm font-semibold ${
                                  subcategory.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {subcategory.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500 hidden lg:table-cell">
                                {format(new Date(subcategory.created_at), 'dd MMM yyyy')}
                              </td>
                              <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500 hidden xl:table-cell">
                                {format(new Date(subcategory.updated_at), 'dd MMM yyyy')}
                              </td>
                              <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-right text-xs lg:text-sm font-medium">
                                {canEditSubcategory(subcategory) && (
                                  <button
                                    onClick={() => handleEditSubcategory(subcategory)}
                                    className="inline-flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-1 lg:py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg lg:rounded-xl font-semibold transition-all duration-200 hover:shadow-md text-xs lg:text-sm"
                                  >
                                    <FiEdit2 className="h-3 w-3 lg:h-4 lg:w-4" />
                                    <span className="hidden sm:inline">Edit</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View for Subcategories */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {subcategories.map((subcategory) => {
                      const parentCategory = categories.find(cat => cat.id === subcategory.category);
                      const brand = brands.find(b => b.id === subcategory.brand);
                      return (
                        <div key={subcategory.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-gray-900 truncate">{subcategory.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {parentCategory?.name || 'Unknown'}
                              </p>
                              <p className="text-sm text-gray-500 mt-0.5">
                                Brand: {brand?.name || 'No Brand'}
                              </p>
                              <span className={`inline-flex items-center px-2 py-0.5 mt-2 rounded-full text-xs font-semibold ${
                                subcategory.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {subcategory.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            {canEditSubcategory(subcategory) && (
                              <button
                                onClick={() => handleEditSubcategory(subcategory)}
                                className="flex-shrink-0 p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200 ml-2"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <div>Created: {format(new Date(subcategory.created_at), 'dd MMM yyyy')}</div>
                            <div className="mt-1">Updated: {format(new Date(subcategory.updated_at), 'dd MMM yyyy')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {subcategories.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                      <FiPlus className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No subcategories found</h3>
                      <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
                        {subcategorySearch ? 'Try a different search term' : 'Get started by creating your first subcategory'}
                      </p>
                      {!subcategorySearch && (
                        <button
                          onClick={() => setIsSubcategoryFormOpen(true)}
                          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          Create First Subcategory
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementPage;