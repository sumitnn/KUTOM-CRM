import { useState } from "react";
import {
  useGetCategoriesQuery,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "../features/category/categoryApi";

const ViewCategoriesPage = () => {
  const { data: categories = [] } = useGetCategoriesQuery();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [search, setSearch] = useState("");
  const [editCategory, setEditCategory] = useState(null);
  const [editName, setEditName] = useState("");

  const filtered = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this category?")) {
      await deleteCategory(id);
    }
  };

  const handleEdit = async () => {
    await updateCategory({ id: editCategory.id, name: editName });
    document.getElementById("edit_modal").close();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto mt-6">
      <div className="flex justify-between items-center mb-4 flex-col sm:flex-row gap-4">
        <h2 className="text-xl font-semibold">All Categories</h2>
        <input
          type="text"
          placeholder="Search category"
          className="input input-bordered w-full sm:w-80"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-gray-500 text-center mt-10">No categories found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <div key={cat.id} className="p-4 bg-white shadow rounded-md flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{cat.name}</h3>
              <div className="space-x-2">
                <button
                  className="btn btn-xs btn-outline btn-info"
                  onClick={() => {
                    setEditCategory(cat);
                    setEditName(cat.name);
                    document.getElementById("edit_modal").showModal();
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-xs btn-outline btn-error"
                  onClick={() => handleDelete(cat.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <dialog id="edit_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Edit Category</h3>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="input input-bordered w-full mb-4"
          />
          <div className="modal-action">
            <form method="dialog" className="flex gap-3">
              <button type="button" className="btn btn-primary" onClick={handleEdit}>
                Save
              </button>
              <button className="btn">Cancel</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default ViewCategoriesPage;
