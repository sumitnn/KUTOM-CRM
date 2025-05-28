import { useState } from "react";
import { useAddCategoryMutation } from "../features/category/categoryApi";
import { toast } from "react-toastify";
const CreateCategoryPage = () => {
  const [name, setName] = useState("");
  const [addCategory] = useAddCategoryMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addCategory({ name }).unwrap();
      setName("");
      toast.success("New Category Created Successfully");
    } catch (error) {
      console.log(error)
      toast.error(error.data.message);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-md mt-8">
      <h2 className="text-xl font-semibold mb-4">Create New Category</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Category name"
          className="input input-bordered w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button className="btn btn-primary w-full">Create Category</button>
      </form>
    </div>
  );
};

export default CreateCategoryPage;
