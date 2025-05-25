import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    image: "",
  });

  useEffect(() => {
    // Fetch product by ID here
    setFormData({
      name: "Sample Product",
      price: 100,
      stock: 5,
      category: "Example",
      image: "",
    });
  }, [id]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Update logic (PUT/PATCH)
    console.log("Updated:", formData);
    navigate("/admin/products");
  };

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Product Name"
          className="input input-bordered w-full"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          name="price"
          placeholder="Price"
          type="number"
          className="input input-bordered w-full"
          value={formData.price}
          onChange={handleChange}
          required
        />
        <input
          name="stock"
          placeholder="Stock"
          type="number"
          className="input input-bordered w-full"
          value={formData.stock}
          onChange={handleChange}
          required
        />
        <input
          name="category"
          placeholder="Category"
          className="input input-bordered w-full"
          value={formData.category}
          onChange={handleChange}
        />
        <input
          name="image"
          placeholder="Image URL"
          className="input input-bordered w-full"
          value={formData.image}
          onChange={handleChange}
        />
        <button type="submit" className="btn btn-success w-full">
          Update Product
        </button>
      </form>
    </div>
  );
};

export default EditProductPage;
