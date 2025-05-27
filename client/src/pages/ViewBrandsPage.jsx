import { useState, useEffect } from "react";
import { useGetBrandsQuery } from "../features/brand/brandApi"; // adjust path as needed

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const ViewBrandsPage = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500); // debounce 500ms

  // Pass debouncedSearch to your API query to filter results server-side
  const { data: brands = [], isLoading, isError } = useGetBrandsQuery({ search: debouncedSearch });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading brands...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Failed to load brands. Please try again later.</p>
      </div>
    );
  }

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

        {brands.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">No brands found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="bg-white p-4 shadow-md rounded-lg hover:shadow-lg transition-all"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <img
                    src={brand.logo || "/placeholder.png"}
                    alt={brand.name}
                    className="w-35 h-35 object-fill rounded-full "
                    onError={(e) => {
                      if (!e.target.src.includes("/placeholder.png")) {
                        e.target.src = "/placeholder.png";
                      }
                    }}
                  />
                  <h2 className="text-lg font-semibold text-gray-800">{brand.name}</h2>
                  {brand.description && <p className="text-sm text-gray-600">{brand.description}</p>}
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
