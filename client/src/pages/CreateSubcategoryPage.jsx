import { useState } from "react";

const CreateSubcategoryPage = () => {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const categories = [
    { id: 1, name: "Electronics" },
    { id: 2, name: "Books" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Creating subcategory:", { name, categoryId });
    // API call here
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
