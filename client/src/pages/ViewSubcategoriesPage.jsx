import { useState } from "react";
import {
  useGetSubcategoriesQuery,
  useUpdateSubcategoryMutation,
  useDeleteSubcategoryMutation,
} from "../features/category/categoryApi";

const ViewSubcategoriesPage = () => {
  const { data: subcategories = [], isLoading } = useGetSubcategoriesQuery();
  const [updateSubcategory] = useUpdateSubcategoryMutation();
  const [deleteSubcategory] = useDeleteSubcategoryMutation();

  const [search, setSearch] = useState("");
  const [editSub, setEditSub] = useState(null);
  const [editName, setEditName] = useState("");

  const filtered = subcategories.filter((sub) =>
    sub.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this subcategory?")) {
      try {
        await deleteSubcategory(id).unwrap();
      } catch (err) {
        console.error(err);
        alert("Delete failed");
      }
    }
  };

  const openEditModal = (sub) => {
    setEditSub(sub);
    setEditName(sub.name);
    document.getElementById("sub_edit_modal").showModal();
  };

  const handleEdit = async () => {
    try {
      await updateSubcategory({ id: editSub.id, name: editName }).unwrap();
      document.getElementById("sub_edit_modal").close();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto mt-6">
      <div className="flex justify-between items-center mb-4 flex-col sm:flex-row gap-4">
        <h2 className="text-xl font-semibold">All Subcategories</h2>
        <input
          type="text"
          placeholder="Search subcategory"
          className="input input-bordered w-full sm:w-80"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500 text-center mt-10">No subcategories found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((sub) => (
            <div
              key={sub.id}
              className="p-4 bg-white shadow rounded-md flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{sub.name}</h3>
                <p className="text-sm text-gray-500">Category: {sub.category}</p>
              </div>
              <div className="space-x-2">
                <button
                  className="btn btn-xs btn-outline btn-info"
                  onClick={() => openEditModal(sub)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-xs btn-outline btn-error"
                  onClick={() => handleDelete(sub.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <dialog id="sub_edit_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Edit Subcategory</h3>
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

export default ViewSubcategoriesPage;
