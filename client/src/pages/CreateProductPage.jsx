import { useState } from "react";

const CreateProductPage = () => {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    sku: "",
    discount: "",
    tags: "",
    status: "active",
    category: "",
    subcategory: "",
    brand: "",
    image: null,
  });

  const [preview, setPreview] = useState(null);

  const categories = ["Electronics", "Clothing", "Home"];
  const subcategories = {
    Electronics: ["Mobiles", "Laptops", "Cameras"],
    Clothing: ["Men", "Women", "Kids"],
    Home: ["Furniture", "Decor", "Appliances"],
  };
  const brands = ["Apple", "Samsung", "Nike", "Sony"];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProduct({ ...product, image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Product to create:", product);
    // Add API call logic
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 bg-white rounded-xl shadow mt-6">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">Create New Product</h2>
      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Product Name"
            className="input input-bordered w-full"
            value={product.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="sku"
            placeholder="SKU (Stock Keeping Unit)"
            className="input input-bordered w-full"
            value={product.sku}
            onChange={handleChange}
            required
          />
        </div>

        <textarea
          name="description"
          placeholder="Product Description"
          className="textarea textarea-bordered w-full"
          rows="4"
          value={product.description}
          onChange={handleChange}
          required
        ></textarea>

        <div className="grid sm:grid-cols-3 gap-4">
          <input
            type="number"
            name="price"
            placeholder="Price (₹)"
            className="input input-bordered w-full"
            value={product.price}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="discount"
            placeholder="Discount (%)"
            className="input input-bordered w-full"
            value={product.discount}
            onChange={handleChange}
          />
          <input
            type="number"
            name="stock"
            placeholder="Stock Quantity"
            className="input input-bordered w-full"
            value={product.stock}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <select
            name="category"
            className="select select-bordered w-full"
            value={product.category}
            onChange={(e) => {
              setProduct({
                ...product,
                category: e.target.value,
                subcategory: "",
              });
            }}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            name="subcategory"
            className="select select-bordered w-full"
            value={product.subcategory}
            onChange={handleChange}
            required
            disabled={!product.category}
          >
            <option value="">Select Subcategory</option>
            {(subcategories[product.category] || []).map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          <select
            name="brand"
            className="select select-bordered w-full"
            value={product.brand}
            onChange={handleChange}
            required
          >
            <option value="">Select Brand</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <input
            type="text"
            name="tags"
            placeholder="Tags (comma separated)"
            className="input input-bordered w-full"
            value={product.tags}
            onChange={handleChange}
          />
          <select
            name="status"
            className="select select-bordered w-full"
            value={product.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept="image/*"
            className="file-input file-input-bordered w-full sm:w-1/2"
            onChange={handleImageChange}
            required
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="w-24 h-24 rounded-md border object-cover"
            />
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full sm:w-1/2 mx-auto mt-4">
          Create Product
        </button>
      </form>
    </div>
  );
};

export default CreateProductPage;
