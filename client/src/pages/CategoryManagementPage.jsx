import { useState } from "react";
import {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useAddSubcategoryMutation,
  useUpdateSubcategoryMutation,
  useDeleteSubcategoryMutation,
} from "../features/category/categoryApi";
import { toast } from "react-toastify";
import { FiEdit2, FiTrash2, FiPlus, FiX } from "react-icons/fi";

const CategoryManagementPage = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState("categories");
  
  // Category states
  const [categoryName, setCategoryName] = useState("");
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  
  // Subcategory states
  const [subcategoryName, setSubcategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isSubcategoryFormOpen, setIsSubcategoryFormOpen] = useState(false);
  
  // Edit modals
  const [editCategory, setEditCategory] = useState(null);
  const [editSubcategory, setEditSubcategory] = useState(null);
  
  // Data fetching
  const { data: categories = [], isLoading, refetch } = useGetCategoriesQuery({
    withSubcategories: true,
  });
  
  // Mutations
  const [addCategory] = useAddCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [addSubcategory] = useAddSubcategoryMutation();
  const [updateSubcategory] = useUpdateSubcategoryMutation();
  const [deleteSubcategory] = useDeleteSubcategoryMutation();

  // Handle category creation
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await addCategory({ name: categoryName }).unwrap();
      setCategoryName("");
      setIsCategoryFormOpen(false);
      toast.success("Category created successfully");
      refetch();
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
        data: { name: editCategory.name, isActive: editCategory.isActive }
      }).unwrap();
      setEditCategory(null);
      toast.success("Category updated successfully");
      refetch();
    } catch (error) {
      toast.error(error.data?.message || "Failed to update category");
    }
  };

  // Handle subcategory creation
  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    try {
      await addSubcategory({ 
        name: subcategoryName, 
        parent: selectedCategoryId 
      }).unwrap();
      setSubcategoryName("");
      setSelectedCategoryId("");
      setIsSubcategoryFormOpen(false);
      toast.success("Subcategory created successfully");
      refetch();
    } catch (error) {
      toast.error(error.data?.details || "Failed to create subcategory");
    }
  };

  // Handle subcategory update
  const handleUpdateSubcategory = async (e) => {
    e.preventDefault();
    try {
      await updateSubcategory({
        id: editSubcategory.id,
        data: { 
          name: editSubcategory.name, 
          parent: editSubcategory.parent,
          isActive: editSubcategory.isActive 
        }
      }).unwrap();
      setEditSubcategory(null);
      toast.success("Subcategory updated successfully");
      refetch();
    } catch (error) {
      toast.error(error.data?.message || "Failed to update subcategory");
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this category and all its subcategories?")) {
      try {
        await deleteCategory(id).unwrap();
        toast.success("Category deleted successfully");
        refetch();
      } catch (error) {
        toast.error(error.data?.message || "Failed to delete category");
      }
    }
  };

  // Handle subcategory deletion
  const handleDeleteSubcategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this subcategory?")) {
      try {
        await deleteSubcategory(id).unwrap();
        toast.success("Subcategory deleted successfully");
        refetch();
      } catch (error) {
        toast.error(error.data?.message || "Failed to delete subcategory");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("categories")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === "categories" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab("subcategories")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === "subcategories" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
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
                <h2 className="text-xl font-semibold text-gray-800">Categories</h2>
                <button
                  onClick={() => setIsCategoryFormOpen(true)}
                  className="btn btn-primary gap-2"
                >
                  <FiPlus /> New Category
                </button>
              </div>
              
              {/* Category Form */}
              {isCategoryFormOpen && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                      <input
                        type="text"
                        placeholder="Enter category name"
                        className="input input-bordered w-full"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCategoryFormOpen(false)}
                        className="btn btn-ghost"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sr No.
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category, index) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditCategory(category)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            >
                              <FiEdit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            >
                              <FiTrash2 className="h-5 w-5" />
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
          
          {/* Subcategories Tab */}
          {activeTab === "subcategories" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Subcategories</h2>
                <button
                  onClick={() => setIsSubcategoryFormOpen(true)}
                  className="btn btn-primary gap-2"
                >
                  <FiPlus /> New Subcategory
                </button>
              </div>
              
              {/* Subcategory Form */}
              {isSubcategoryFormOpen && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <form onSubmit={handleCreateSubcategory} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                      <select
                        className="select select-bordered w-full"
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory Name</label>
                      <input
                        type="text"
                        placeholder="Enter subcategory name"
                        className="input input-bordered w-full"
                        value={subcategoryName}
                        onChange={(e) => setSubcategoryName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsSubcategoryFormOpen(false)}
                        className="btn btn-ghost"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sr No.
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subcategory Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Main Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.flatMap((category, catIndex) => 
                      category.subcategories?.map((subcategory, subIndex) => (
                        <tr key={subcategory.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {catIndex + 1}.{subIndex + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(subcategory.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{subcategory.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{category.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${subcategory.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {subcategory.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditSubcategory({
                                  ...subcategory,
                                  parent: category.id
                                })}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              >
                                <FiEdit2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubcategory(subcategory.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              >
                                <FiTrash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
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
              <button onClick={() => setEditCategory(null)} className="text-gray-500 hover:text-gray-700">
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="select select-bordered w-full"
                  value={editCategory.isActive ? "active" : "inactive"}
                  onChange={(e) => setEditCategory({
                    ...editCategory, 
                    isActive: e.target.value === "active"
                  })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCategory(null)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
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
              <button onClick={() => setEditSubcategory(null)} className="text-gray-500 hover:text-gray-700">
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateSubcategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={editSubcategory.name}
                  onChange={(e) => setEditSubcategory({...editSubcategory, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select
                  className="select select-bordered w-full"
                  value={editSubcategory.parent}
                  onChange={(e) => setEditSubcategory({
                    ...editSubcategory, 
                    parent: e.target.value
                  })}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="select select-bordered w-full"
                  value={editSubcategory.isActive ? "active" : "inactive"}
                  onChange={(e) => setEditSubcategory({
                    ...editSubcategory, 
                    isActive: e.target.value === "active"
                  })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditSubcategory(null)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
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