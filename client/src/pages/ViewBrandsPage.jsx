import { useState, useEffect } from "react";
import { useGetBrandsQuery, useUpdateBrandMutation } from "../features/brand/brandApi";

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
  const debouncedSearch = useDebounce(search, 500);

  const { data: brands = [], isLoading, isError } = useGetBrandsQuery({ search: debouncedSearch });
  const [updateBrand] = useUpdateBrandMutation();

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [descExpandedMap, setDescExpandedMap] = useState({});

  const toggleDescription = (id) => {
    setDescExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openDeleteConfirm = (brand) => {
    setBrandToDelete(brand);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    // TODO: Replace with deleteBrand API call
    console.log("Deleting brand:", brandToDelete.id);
    setDeleteConfirmOpen(false);
    setBrandToDelete(null);
  };

  const handleUpdate = async () => {
    if (!selectedBrand) return;

    try {
      const formData = new FormData();
      formData.append("name", selectedBrand.name);
      formData.append("description", selectedBrand.description || "");
      if (selectedBrand.logoFile) {
        formData.append("logo", selectedBrand.logoFile); // Must match backend field
      }

      await updateBrand({ id: selectedBrand.id, data: formData }).unwrap();

      setSelectedBrand(null);
      setLogoPreview(null);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  if (isLoading)
    return <div className="min-h-screen flex justify-center items-center">Loading...</div>;
  if (isError)
    return <div className="text-red-500 text-center">Error loading brands.</div>;

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
            {brands.map((brand) => {
              const isEditing = selectedBrand?.id === brand.id;
              const description = brand.description || "";
              const isExpanded = descExpandedMap[brand.id];
              const isLong = description.length > 100;

              return (
                <div
                  key={brand.id}
                  className="bg-white p-4 shadow-md rounded-xl flex flex-col justify-between transition-all"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    {isEditing ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={logoPreview || brand.logo || "/placeholder.png"}
                          alt={brand.name}
                          className="w-24 h-24 object-cover rounded-full border border-gray-200 mb-2"
                          onError={(e) => {
                            if (!e.target.src.includes("/placeholder.png")) {
                              e.target.src = "/placeholder.png";
                            }
                          }}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setSelectedBrand((prev) => ({ ...prev, logoFile: file }));
                              setLogoPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <img
                        src={brand.logo || "/placeholder.png"}
                        alt={brand.name}
                        className="w-24 h-24 object-cover rounded-full border border-gray-200"
                        onError={(e) => {
                          if (!e.target.src.includes("/placeholder.png")) {
                            e.target.src = "/placeholder.png";
                          }
                        }}
                      />
                    )}

                    {isEditing ? (
                      <>
                        <input
                          className="input input-bordered w-full text-center"
                          defaultValue={brand.name}
                          onChange={(e) =>
                            setSelectedBrand((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                        <textarea
                          className="textarea textarea-bordered w-full"
                          rows={3}
                          defaultValue={brand.description}
                          onChange={(e) =>
                            setSelectedBrand((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                        />
                      </>
                    ) : (
                      <>
                        <h2 className="text-lg font-semibold text-gray-800">{brand.name}</h2>
                        {description && (
                          <p className="text-sm text-gray-600">
                            {isExpanded || !isLong
                              ? description
                              : `${description.slice(0, 100)}... `}
                            {isLong && (
                              <button
                                onClick={() => toggleDescription(brand.id)}
                                className="text-blue-600 hover:underline ml-1"
                              >
                                {isExpanded ? "View Less" : "View More"}
                              </button>
                            )}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex justify-center gap-4 mt-4">
                    {isEditing ? (
                      <>
                        <button onClick={handleUpdate} className="btn btn-sm btn-success">
                          Update
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBrand(null);
                            setLogoPreview(null);
                          }}
                          className="btn btn-sm btn-outline"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setSelectedBrand(brand);
                            setLogoPreview(null);
                          }}
                          className="btn btn-sm btn-outline btn-primary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(brand)}
                          className="btn btn-sm btn-outline btn-error"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && brandToDelete && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4 text-center">
              Are you sure you want to delete{" "}
              <span className="font-bold">{brandToDelete.name}</span>?
            </h2>
            <div className="flex justify-center gap-4">
              <button className="btn btn-outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewBrandsPage;
