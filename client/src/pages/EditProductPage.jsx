import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from "../features/product/productApi";

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useGetProductByIdQuery(id);
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        description: product.description || "",
        price: product.price || "",
      });
    }
  }, [product]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProduct({ id, data: formData }).unwrap();
      navigate("/admin/products");
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update product.");
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-[60vh]">
  <span className="loading loading-spinner text-error loading-lg"></span>
</div>;
  if (isError) return <p className="text-center mt-10 text-red-500">Failed to load product.</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Product</h2>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <input
            type="text"
            name="name"
            className="input input-bordered w-full"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">SKU</label>
          <input
            type="text"
            name="sku"
            className="input input-bordered w-full"
            value={formData.sku}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            rows={4}
            className="textarea textarea-bordered w-full"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price (₹)</label>
          <input
            type="number"
            step="0.01"
            name="price"
            className="input input-bordered w-full"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProductPage;
