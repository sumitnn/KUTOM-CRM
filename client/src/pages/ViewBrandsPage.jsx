import { useState, useEffect } from "react";

import {
  useGetBrandsQuery,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} from "../features/brand/brandApi";
import BrandCard from "./BrandCard";



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


  const { data: brands = [], isLoading, isError, refetch } = useGetBrandsQuery({
    search: debouncedSearch,
  });
  const [updateBrand] = useUpdateBrandMutation();
  const [deleteBrand] = useDeleteBrandMutation();

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

  const handleDelete = async () => {
    try {
      await deleteBrand(brandToDelete.id).unwrap();
      setDeleteConfirmOpen(false);
      setBrandToDelete(null);
      refetch();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleUpdate = async () => {
    if (!selectedBrand) return;
  
    try {
      const formData = new FormData();
      formData.append("name", selectedBrand.name);
      formData.append("description", selectedBrand.description || "");
      formData.append("is_featured", selectedBrand.is_featured ? "true" : "false");
  
      if (selectedBrand.logoFile) {
        formData.append("logo", selectedBrand.logoFile);
      }
  
      // Debug: Log form data contents
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
  
      await updateBrand({ id: selectedBrand.id, data: formData }).unwrap();
  
      setSelectedBrand(null);
      setLogoPreview(null);
      refetch();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };
  

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedBrand((prev) => ({ ...prev, logoFile: file }));
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleEdit = (brand) => {
    setSelectedBrand({
      id: brand.id,
      name: brand.name,
      description: brand.description || "",
      is_featured: brand.is_featured,
      logo: brand.logo,
    });
    setLogoPreview(null);
  };
  const baseUrl = import.meta.env.VITE_IMAGE_API_URL;
  if (isLoading)
    return <div className="min-h-screen flex justify-center items-center">Loading...</div>;
  if (isError)
    return <div className="text-red-500 text-center">Error loading brands.</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4">
          <h1 className="text-2xl font-bold text-gray-800">All Brands</h1>
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
              <BrandCard
                key={brand.id}
                brand={brand}
                isOwner={brand.access}
                isExpanded={descExpandedMap[brand.id]}
                toggleDescription={toggleDescription}
                handleEdit={handleEdit}
                openDeleteConfirm={openDeleteConfirm}
              />
            ))}

          </div>
        )}
      </div>

      {/* Edit Modal */}
      {selectedBrand && (
  <div className="fixed inset-0 z-50 bg-black/60  flex items-center justify-center px-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 md:p-8 relative">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900">
        Edit Brand
      </h2>

      <div className="flex flex-col items-center space-y-4 mb-6">
        <img
          src={
            logoPreview
              ? logoPreview
              : selectedBrand.logo
              ? `${baseUrl}${selectedBrand.logo}`
              : "/placeholder.png"
          }
          alt="Brand Logo Preview"
          className="w-28 h-28 object-cover rounded-full border border-gray-300 shadow-sm"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="file-input file-input-bordered w-full max-w-xs"
        />
      </div>

      <input
        type="text"
        placeholder="Brand Name"
        className="input input-bordered w-full mb-4"
        value={selectedBrand.name}
        onChange={(e) =>
          setSelectedBrand((prev) => ({ ...prev, name: e.target.value }))
        }
      />

      <textarea
        placeholder="Brand Description"
        className="textarea textarea-bordered w-full mb-4 resize-none"
        rows={4}
        value={selectedBrand.description}
        onChange={(e) =>
          setSelectedBrand((prev) => ({ ...prev, description: e.target.value }))
        }
      />

      <label className="flex items-center gap-3 mb-6 cursor-pointer select-none">
        <input
          type="checkbox"
          className="checkbox checkbox-primary"
          checked={selectedBrand.is_featured}
          onChange={(e) =>
            setSelectedBrand((prev) => ({ ...prev, is_featured: e.target.checked }))
          }
        />
        <span className="text-gray-700 font-medium">Is Featured</span>
      </label>

      <div className="flex justify-end gap-3">
        <button
          className="btn btn-outline btn-sm px-6"
          onClick={() => setSelectedBrand(null)}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm px-6"
          onClick={handleUpdate}
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}


      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && brandToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60  flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center shadow-xl">
            <h2 className="text-lg font-semibold mb-4">
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
