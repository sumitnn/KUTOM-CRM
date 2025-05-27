import { useState } from "react";
import {
  useGetCategoriesQuery,
  useAddSubcategoryMutation,
} from "../features/category/categoryApi";

const CreateSubcategoryPage = () => {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const { data: categories = [], isLoading } = useGetCategoriesQuery();
  const [addSubcategory] = useAddSubcategoryMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addSubcategory({ name, categoryId }).unwrap();
      setName("");
      setCategoryId("");
      alert("Subcategory created");
    } catch (error) {
      console.error("Error creating subcategory:", error);
      alert("Failed to create subcategory");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-md mt-8">
      <h2 className="text-xl font-semibold mb-4">Create Subcategory</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          className="select select-bordered w-full"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          <option value="" disabled>Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Subcategory name"
          className="input input-bordered w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <button className="btn btn-primary w-full">Create Subcategory</button>
      </form>
    </div>
  );
};

export default CreateSubcategoryPage;
