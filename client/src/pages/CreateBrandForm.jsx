import { useEffect, useState } from "react";

const CreateBrandForm = ({ onSubmit, onCancel, loading = false, resetTrigger }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [visible, setVisible] = useState(true);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogo(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Brand name is required");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("visible", visible);
    if (logo) formData.append("logo", logo);

    onSubmit(formData);
  };

  // Reset fields when resetTrigger changes
  useEffect(() => {
    setName("");
    setDescription("");
    setLogo(null);
    setLogoPreview(null);
    setVisible(true);
  }, [resetTrigger]);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-xl rounded-lg p-6 max-w-lg w-full mx-auto space-y-6"
    >
      <h2 className="text-2xl font-extrabold text-gray-800">Create Brand</h2>

      {/* Logo Upload */}
      <div className="flex flex-col items-center gap-4">
        {logoPreview ? (
          <img
            src={logoPreview}
            alt="Logo Preview"
            className="w-24 h-24 rounded-full object-cover border"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            Logo
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="file-input file-input-bordered w-full max-w-xs"
          onChange={handleLogoChange}
        />
      </div>

      {/* Brand Name */}
      <div>
        <label className="label">
          <span className="label-text font-bold">Brand Name *</span>
        </label>
        <input
          type="text"
          placeholder="Enter brand name"
          className="input input-bordered w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="label">
          <span className="label-text font-bold">Description</span>
        </label>
        <textarea
          placeholder="Enter description (optional)"
          className="textarea textarea-bordered w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
      </div>

      {/* Visible Checkbox */}
      <div className="flex items-center justify-between border rounded-lg px-4 py-3 bg-gray-50 hover:shadow-sm transition">
        <label htmlFor="visible" className="text-sm font-medium text-gray-700">
          Show this brand as visible
        </label>
        <input
          id="visible"
          type="checkbox"
          className="toggle toggle-primary"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className={`btn btn-primary ${loading ? "loading" : ""}`}
        >
          Create Brand
        </button>
      </div>
    </form>
  );
};

export default CreateBrandForm;
