import { useState, useEffect } from "react";
import {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useGetSubcategoriesQuery,
  useAddSubcategoryMutation,
  useUpdateSubcategoryMutation,
} from "../features/category/categoryApi";
import { useGetBrandsQuery } from "../features/brand/brandApi";
import { toast } from "react-toastify";
import { FiEdit2, FiPlus, FiX } from "react-icons/fi";
import { format } from "date-fns";

const CategoryManagementPage = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState("categories");
  
  // Category states
  const [categoryForm, setCategoryForm] = useState({
    name: "",
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
  const [editCategory, setEditCategory] = useState(null);
  const [editSubcategory, setEditSubcategory] = useState(null);

  // Data fetching
  const { 
    data: categories = [], 
    isLoading: isCategoriesLoading,
    refetch: refetchCategories 
  } = useGetCategoriesQuery();
  
  const {
    data: brands = [],
    isLoading: isBrandsLoading
  } = useGetBrandsQuery();

  const { 
    data: subcategories = [], 
    isLoading: isSubcategoriesLoading,
    refetch: refetchSubcategories 
  } = useGetSubcategoriesQuery(undefined, {
    skip: activeTab !== "subcategories"
  });

  // Mutations
  const [addCategory] = useAddCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [addSubcategory] = useAddSubcategoryMutation();
  const [updateSubcategory] = useUpdateSubcategoryMutation();

  // Reset forms when tab changes
  useEffect(() => {
    setIsCategoryFormOpen(false);
    setIsSubcategoryFormOpen(false);
    setEditCategory(null);
    setEditSubcategory(null);
  }, [activeTab]);

  // Handle category creation
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await addCategory(categoryForm).unwrap();
      setCategoryForm({ name: "", is_active: true });
      setIsCategoryFormOpen(false);
      toast.success("Category created successfully");
      refetchCategories();
    } catch (error) {
      toast.error(error.data?.message || "Failed to create category");
    }
  };

  // Handle category update
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      await updateCategory({
        id: editCategory.id,
        data: editCategory
      }).unwrap();
      setEditCategory(null);
      toast.success("Category updated successfully");
      refetchCategories();
    } catch (error) {
      toast.error(error.data?.message || "Failed to update category");
    }
  };

  // Handle subcategory creation
  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    try {
      await addSubcategory(subcategoryForm).unwrap();
      setSubcategoryForm({ name: "", category: "", brand: "", is_active: true });
      setIsSubcategoryFormOpen(false);
      toast.success("Subcategory created successfully");
      refetchSubcategories();
    } catch (error) {
      toast.error(error.data?.message || "Failed to create subcategory");
    }
  };

  // Handle subcategory update
  const handleUpdateSubcategory = async (e) => {
    e.preventDefault();
    try {
      await updateSubcategory({
        id: editSubcategory.id,
        data: editSubcategory
      }).unwrap();
      setEditSubcategory(null);
      toast.success("Subcategory updated successfully");
      refetchSubcategories();
    } catch (error) {
      toast.error(error.data?.message || "Failed to update subcategory");
    }
  };

  if (isCategoriesLoading || isBrandsLoading || (activeTab === "subcategories" && isSubcategoriesLoading)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("categories")}
              className={`py-4 px-6 text-center border-b-2 font-bold hover:cursor-pointer text-sm ${
                activeTab === "categories" 
                  ? "border-blue-900 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab("subcategories")}
              className={`py-4 px-6 text-center border-b-2 font-bold hover:cursor-pointer text-sm ${
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
          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold text-gray-800">Categories</h2>
                <button
                  onClick={() => setIsCategoryFormOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiPlus className="mr-2" />
                  New Category
                </button>
              </div>
              
              {/* Category Form */}
              {isCategoryFormOpen && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border-4 border-gray-500">
                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Category Name*
                      </label>
                      <input
                        id="categoryname"
                        name="categoryname"
                        type="text"
                        placeholder="Enter category name"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="category-active"
                        className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        checked={categoryForm.is_active}
                        onChange={(e) => setCategoryForm({...categoryForm, is_active: e.target.checked})}
                      />
                      <label htmlFor="category-active" className="ml-2 block text-sm font-bold text-gray-700">
                        Active
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCategoryFormOpen(false)}
                        className="inline-flex items-center cursor-pointer px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="inline-flex items-center cursor-pointer px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Create Category
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Created At
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Updated At
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                          <button
                            onClick={() => setEditCategory(category)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 hover:cursor-pointer"
                          >
                            <FiEdit2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
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
                <button
                  onClick={() => setIsSubcategoryFormOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md hover:cursor-pointer shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiPlus className="mr-2" />
                  New Subcategory
                </button>
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
                        onChange={(e) => setSubcategoryForm({...subcategoryForm, category: e.target.value})}
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
                        onChange={(e) => setSubcategoryForm({...subcategoryForm, brand: e.target.value})}
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
                    <div >
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Subcategory Name*
                      </label>
                      <input
                        id="subcategoryname"
                        name="subcategoryname"
                        type="text"
                        placeholder="Enter subcategory name"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={subcategoryForm.name}
                        onChange={(e) => setSubcategoryForm({...subcategoryForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"

                        id="subcategory-active"
                        className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={subcategoryForm.is_active}
                        onChange={(e) => setSubcategoryForm({...subcategoryForm, is_active: e.target.checked})}
                      />
                      <label htmlFor="subcategory-active" className="ml-2 block text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsSubcategoryFormOpen(false)}
                        className="inline-flex items-center px-4 py-2 cursor-pointer border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="inline-flex items-center px-4  cursor-pointer py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Create Subcategory
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Parent Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Brand
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Created At
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Updated At
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
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
                            <div className="text-sm font-medium text-gray-900">{subcategory.name}</div>
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
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                            <button
                              onClick={() => setEditSubcategory(subcategory)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 hover:cursor-pointer"
                            >
                              <FiEdit2 className="h-5 w-5" />
                            </button>
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

      {/* Edit Category Modal */}
      {editCategory && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Category</h2>
              <button 
                onClick={() => setEditCategory(null)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name*
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-category-active"
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={editCategory.is_active}
                  onChange={(e) => setEditCategory({...editCategory, is_active: e.target.checked})}
                />
                <label htmlFor="edit-category-active" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCategory(null)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Update Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subcategory Modal */}
      {editSubcategory && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Subcategory</h2>
              <button 
                onClick={() => setEditSubcategory(null)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateSubcategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category*
                </label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editSubcategory.category}
                  onChange={(e) => setEditSubcategory({...editSubcategory, category: e.target.value})}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand*
                </label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editSubcategory.brand || ""}
                  onChange={(e) => setEditSubcategory({...editSubcategory, brand: e.target.value})}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory Name*
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={editSubcategory.name}
                  onChange={(e) => setEditSubcategory({...editSubcategory, name: e.target.value})}
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-subcategory-active"
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={editSubcategory.is_active}
                  onChange={(e) => setEditSubcategory({...editSubcategory, is_active: e.target.checked})}
                />
                <label htmlFor="edit-subcategory-active" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditSubcategory(null)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Update Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagementPage;