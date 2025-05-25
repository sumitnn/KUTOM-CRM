import CreateBrandForm from "./CreateBrandForm";
import axios from "axios";

const CreateBrandPage = () => {
  const handleSubmit = async (formData) => {
    try {
      const response = await axios.post("/api/brands", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Brand created successfully!");
      console.log(response.data);
    } catch (error) {
      alert("Error creating brand");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-10 ">
      <CreateBrandForm onSubmit={handleSubmit} />
    </div>
  );
};

export default CreateBrandPage;
