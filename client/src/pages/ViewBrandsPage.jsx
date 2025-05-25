import { useEffect, useState } from "react";

const ViewBrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");

  // Dummy brand data
  const dummyBrands = [
    {
      id: 1,
      name: "Nike",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
      description: "Just Do It.",
    },
    {
      id: 2,
      name: "Adidas",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg",
      description: "Impossible is Nothing.",
    },
    {
      id: 3,
      name: "Puma",
      logoUrl: "https://upload.wikimedia.org/wikipedia/en/6/65/Puma_AG.svg",
      description: "Forever Faster.",
    },
    {
      id: 4,
      name: "Reebok",
      logoUrl: "https://upload.wikimedia.org/wikipedia/en/8/88/Reebok_2019_logo.svg",
      description: "Be More Human.",
    },
    {
      id: 5,
      name: "FakeBrand",
      logoUrl: "https://example.com/invalid.jpg", // This will fail
      description: "This logo will fallback.",
    },
  ];

  useEffect(() => {
    // Simulate fetch
    setBrands(dummyBrands);
    setFiltered(dummyBrands);
  }, []);

  useEffect(() => {
    const result = brands.filter((brand) =>
      brand.name.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, brands]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-extrabold text-gray-800">All Brands</h1>
          <input
            type="text"
            placeholder="Search by brand name..."
            className="input input-bordered w-full sm:w-80"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">No brands found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((brand) => (
              <div
                key={brand.id}
                className="bg-white p-4 shadow-md rounded-lg hover:shadow-lg transition-all"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <img
                    src={brand.logoUrl || "/placeholder.png"}
                    alt={brand.name}
                    className="w-20 h-20 object-cover rounded-full border"
                    onError={(e) => {
                      if (
                        !e.target.src.includes("/placeholder.png")
                      ) {
                        e.target.src = "/placeholder.png";
                      }
                    }}
                  />
                  <h2 className="text-lg font-semibold text-gray-800">
                    {brand.name}
                  </h2>
                  {brand.description && (
                    <p className="text-sm text-gray-600">{brand.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewBrandsPage;
