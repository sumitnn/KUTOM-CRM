import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";

const MyProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  const dummyProducts = [
    {
      id: 1,
      name: "Product A",
      price: 120,
      stock: 10,
      category: "Electronics",
      subCategory: "Mobiles",
      image: "/placeholder.png",
    },
    {
      id: 2,
      name: "Product B",
      price: 90,
      stock: 5,
      category: "Apparel",
      subCategory: "Shirts",
      image: "/placeholder.png",
    },
  ];

  const categories = ["Electronics", "Apparel"];
  const subCategories = {
    Electronics: ["Mobiles", "Laptops"],
    Apparel: ["Shirts", "Pants"],
  };

  useEffect(() => {
    setProducts(dummyProducts);
  }, []);

  const filteredProducts = products.filter((p) => {
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedCategory ? p.category === selectedCategory : true) &&
      (selectedSubCategory ? p.subCategory === selectedSubCategory : true)
    );
  });

  const deleteProduct = (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      {/* Header & Filter Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Products</h1>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <input
            type="text"
            placeholder="Search by name..."
            className="input input-bordered w-full sm:w-48"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select select-bordered w-full sm:w-40"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubCategory("");
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            className="select select-bordered w-full sm:w-40"
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
            disabled={!selectedCategory}
          >
            <option value="">All Subcategories</option>
            {selectedCategory &&
              subCategories[selectedCategory].map((sub) => (
                <option key={sub}>{sub}</option>
              ))}
          </select>
          <button
            className="btn btn-primary whitespace-nowrap"
            onClick={() => navigate("/admin/products/create")}
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="table w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="py-3">Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Stock</th>
              <th>Price</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-12 h-12 object-cover rounded border"
                      onError={(e) => {
                        if (e.target.src !== "/placeholder.png") {
                          e.target.src = "/placeholder.png";
                        }
                      }}
                    />
                  </td>
                  <td className="font-medium">{prod.name}</td>
                  <td>{prod.category}</td>
                  <td>{prod.subCategory}</td>
                  <td>{prod.stock}</td>
                  <td>₹{prod.price}</td>
                  <td>
                    <div className="flex justify-center gap-2">
                      <button
                        className="btn btn-xs btn-info"
                        onClick={() => navigate(`/admin/products/${prod.id}`)}
                      >
                        <FiEye />
                      </button>
                      <button
                        className="btn btn-xs btn-warning"
                        onClick={() =>
                          navigate(`/admin/products/edit/${prod.id}`)
                        }
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn btn-xs btn-error"
                        onClick={() => deleteProduct(prod.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyProductsPage;
