import { useState, useRef } from "react";
import {
  useGetCategoriesQuery,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "../features/category/categoryApi";

import { toast } from "react-toastify";

const ViewCategoriesPage = () => {
  const { data, isLoading, isError } = useGetCategoriesQuery();
  const categories = Array.isArray(data) ? data : data?.results ?? [];

  const [deleteCategory] = useDeleteCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();

  const [search, setSearch] = useState("");
  const [editCategory, setEditCategory] = useState(null);
  const [editName, setEditName] = useState("");
  const modalRef = useRef(null);

  const filtered = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const openEditModal = (cat) => {
    setEditCategory(cat);
    setEditName(cat.name);
    if (modalRef.current) modalRef.current.showModal();
  };

  const closeEditModal = () => {
    if (modalRef.current) modalRef.current.close();
    setEditCategory(null);
    setEditName("");
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id).unwrap();
        toast.success("Delete Successfully");
      } catch (error) {
        toast.error(error);
      }
    }
  };

  const handleEdit = async () => {
    if (!editName.trim()) return;
    try {
      await updateCategory({ id: editCategory.id, name: editName }).unwrap();
      closeEditModal();
      toast.success("Update Category Successfully");
    } catch (error) {
      toast.error(error);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-[60vh]">
  <span className="loading loading-spinner text-error loading-lg"></span>
</div>;
  if (isError) return <div>Error loading categories</div>;

  return (
    <div className="py-4 max-w-8xl mx-auto ">
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
        <div className="text-gray-500 text-center mt-30">No categories found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-16">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="p-4 bg-white shadow rounded-md flex justify-between items-center"
            >
              <h3 className="text-lg font-semibold text-gray-800">{cat.name}</h3>
              {cat.access ? (
                <div className="space-x-2">
                  <button
                    className="btn btn-xs btn-outline btn-info"
                    onClick={() => openEditModal(cat)}
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
              ) : null}
            </div>
          ))}
        </div>
      )}

      <dialog id="edit_modal" className="modal" ref={modalRef}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Edit Category</h3>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="input input-bordered w-full mb-4"
          />
          <div className="modal-action">
            <form
              method="dialog"
              className="flex gap-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEdit}
                disabled={!editName.trim()}
              >
                Save
              </button>
              <button type="button" className="btn" onClick={closeEditModal}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default ViewCategoriesPage;
