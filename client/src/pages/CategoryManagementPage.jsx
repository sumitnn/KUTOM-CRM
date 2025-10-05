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
import { FiEdit2, FiPlus, FiX, FiTrash2, FiSearch } from "react-icons/fi";
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
  }, [activeTab]);

  // Handle main category creation/update
  const handleCreateMainCategory = async (e) => {
    e.preventDefault();
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
        if (!mainCategoryForm.image) {
          toast.error("Image is required for new categories");
          setIsMainCategoryLoading(false);
          return;
        }
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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainCategoryForm({
          ...mainCategoryForm,
          image: file,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-extrabold text-gray-800">Category Management</h1>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("main-categories")}
              className={`py-4 px-6 text-center border-b-4 font-bold hover:cursor-pointer text-sm ${
                activeTab === "main-categories" 
                  ? "border-blue-900 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Main Categories
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`py-4 px-6 text-center border-b-4 font-bold hover:cursor-pointer text-sm ${
                activeTab === "categories" 
                  ? "border-blue-900 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab("subcategories")}
              className={`py-4 px-6 text-center border-b-4 font-bold hover:cursor-pointer text-sm ${
                activeTab === "subcategories" 
                  ? "border-blue-900 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Subcategories
            </button>
          </nav>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Main Categories Tab */}
          {activeTab === "main-categories" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold text-gray-800">Main Categories</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Search main categories..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={mainCategorySearchTerm}
                      onChange={(e) => setMainCategorySearchTerm(e.target.value)}
                    />
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    {mainCategorySearchTerm && (
                      <button
                        onClick={() => handleClearSearch('main')}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        <FiX />
                      </button>
                    )}
                    <button
                      onClick={() => handleSearch('main')}
                      className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Search
                    </button>
                  </div>
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
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiPlus className="mr-2" />
                    New Main Category
                  </button>
                </div>
              </div>
              
              {/* Main Category Form */}
              {isMainCategoryFormOpen && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border-4 border-gray-500">
                  <form onSubmit={handleCreateMainCategory} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Main Category Name*
                      </label>
                      <input
                        type="text"
                        placeholder="Enter main category name"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={mainCategoryForm.name}
                        onChange={(e) => setMainCategoryForm({
                          ...mainCategoryForm,
                          name: e.target.value
                        })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Image {!editMainCategory && '*'}
                      </label>
                      {mainCategoryForm.imagePreview && (
                        <div className="mb-2">
                          <img 
                            src={mainCategoryForm.imagePreview} 
                            alt="Preview" 
                            className="h-20 w-20 object-cover rounded"
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-1 block w-full text-sm text-gray-500 cursor-pointer
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                        onChange={handleImageChange}
                        required={!editMainCategory}
                      />
                      {editMainCategory && (
                        <p className="mt-1 text-sm text-gray-500">
                          Leave empty to keep current image
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="main-category-active"
                        className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        checked={mainCategoryForm.is_active}
                        onChange={(e) => setMainCategoryForm({
                          ...mainCategoryForm,
                          is_active: e.target.checked
                        })}
                      />
                      <label htmlFor="main-category-active" className="ml-2 block text-sm font-bold text-gray-700">
                        Active
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMainCategoryFormOpen(false);
                          setEditMainCategory(null);
                        }}
                        className="inline-flex items-center cursor-pointer px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isMainCategoryLoading}
                        className={`inline-flex items-center cursor-pointer px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          isMainCategoryLoading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {isMainCategoryLoading ? (
                          editMainCategory ? "Updating..." : "Creating..."
                        ) : (
                          editMainCategory ? "Update" : "Create"
                        )} Main Category
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Main Categories Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Image
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Created At
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Updated At
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mainCategories.map((mainCategory) => (
                      <tr key={mainCategory.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img 
                            src={mainCategory.image} 
                            alt={mainCategory.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-extrabold text-gray-900">{mainCategory.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full ${
                            mainCategory.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {mainCategory.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(mainCategory.created_at), 'dd MMM yyyy, HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(mainCategory.updated_at), 'dd MMM yyyy, HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {canEditMainCategory(mainCategory) && (
                            <button
                              onClick={() => handleEditMainCategory(mainCategory)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 hover:cursor-pointer"
                            >
                              <FiEdit2 className="h-5 w-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold text-gray-800">Categories</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Search categories..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                    />
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    {categorySearchTerm && (
                      <button
                        onClick={() => handleClearSearch('category')}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        <FiX />
                      </button>
                    )}
                    <button
                      onClick={() => handleSearch('category')}
                      className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Search
                    </button>
                  </div>
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
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiPlus className="mr-2" />
                    New Category
                  </button>
                </div>
              </div>
              
              {/* Category Form */}
              {isCategoryFormOpen && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border-4 border-gray-500">
                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Main Category*
                      </label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Category Name*
                      </label>
                      <input
                        type="text"
                        placeholder="Enter category name"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({
                          ...categoryForm,
                          name: e.target.value
                        })}
                        required
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="category-active"
                        className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        checked={categoryForm.is_active}
                        onChange={(e) => setCategoryForm({
                          ...categoryForm,
                          is_active: e.target.checked
                        })}
                      />
                      <label htmlFor="category-active" className="ml-2 block text-sm font-bold text-gray-700">
                        Active
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCategoryFormOpen(false);
                          setEditCategory(null);
                        }}
                        className="inline-flex items-center cursor-pointer px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isCategoryLoading}
                        className={`inline-flex items-center cursor-pointer px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          isCategoryLoading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {isCategoryLoading ? (
                          editCategory ? "Updating..." : "Creating..."
                        ) : (
                          editCategory ? "Update" : "Create"
                        )} Category
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Categories Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Main Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Created At
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Updated At
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => {
                      const mainCategory = mainCategories.find(mc => mc.id === category.main_category);
                      return (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">{category.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {mainCategory?.name || 'Uncategorized'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full ${
                              category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(category.created_at), 'dd MMM yyyy, HH:mm')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(category.updated_at), 'dd MMM yyyy, HH:mm')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {canEditCategory(category) && (
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 hover:cursor-pointer"
                              >
                                <FiEdit2 className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Subcategories Tab */}
          {activeTab === "subcategories" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold text-gray-800">Subcategories</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Search subcategories..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={subcategorySearchTerm}
                      onChange={(e) => setSubcategorySearchTerm(e.target.value)}
                    />
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    {subcategorySearchTerm && (
                      <button
                        onClick={() => handleClearSearch('subcategory')}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        <FiX />
                      </button>
                    )}
                    <button
                      onClick={() => handleSearch('subcategory')}
                      className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Search
                    </button>
                  </div>
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
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md hover:cursor-pointer shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiPlus className="mr-2" />
                    New Subcategory
                  </button>
                </div>
              </div>
              
              {/* Subcategory Form */}
              {isSubcategoryFormOpen && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border-4 border-gray-500">
                  <form onSubmit={handleCreateSubcategory} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Parent Category*
                      </label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Brand*
                      </label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Subcategory Name*
                      </label>
                      <input
                        type="text"
                        placeholder="Enter subcategory name"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={subcategoryForm.name}
                        onChange={(e) => setSubcategoryForm({
                          ...subcategoryForm,
                          name: e.target.value
                        })}
                        required
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="subcategory-active"
                        className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        checked={subcategoryForm.is_active}
                        onChange={(e) => setSubcategoryForm({
                          ...subcategoryForm,
                          is_active: e.target.checked
                        })}
                      />
                      <label htmlFor="subcategory-active" className="ml-2 block text-sm font-bold text-gray-700">
                        Active
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSubcategoryFormOpen(false);
                          setEditSubcategory(null);
                        }}
                        className="inline-flex items-center px-4 py-2 cursor-pointer border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSubcategoryLoading}
                        className={`inline-flex items-center px-4 py-2 cursor-pointer border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          isSubcategoryLoading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSubcategoryLoading ? (
                          editSubcategory ? "Updating..." : "Creating..."
                        ) : (
                          editSubcategory ? "Update" : "Create"
                        )} Subcategory
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Subcategories Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Parent Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Brand
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Created At
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Updated At
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subcategories.map((subcategory) => {
                      const parentCategory = categories.find(cat => cat.id === subcategory.category);
                      const brand = brands.find(b => b.id === subcategory.brand);
                      return (
                        <tr key={subcategory.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">{subcategory.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {parentCategory?.name || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {brand?.name || 'No Brand'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full ${
                              subcategory.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {subcategory.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(subcategory.created_at), 'dd MMM yyyy, HH:mm')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(subcategory.updated_at), 'dd MMM yyyy, HH:mm')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {canEditSubcategory(subcategory) && (
                              <button
                                onClick={() => handleEditSubcategory(subcategory)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 hover:cursor-pointer"
                              >
                                <FiEdit2 className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementPage;