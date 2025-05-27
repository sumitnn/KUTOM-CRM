import { useState } from "react";
import { useCreateBrandMutation } from "../features/brand/brandApi";
import { toast } from "react-toastify";
import CreateBrandForm from "./CreateBrandForm";

const CreateBrandPage = () => {
  const [createBrand, { isLoading }] = useCreateBrandMutation();
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleSubmit = async (formData) => {
    try {
      await createBrand(formData).unwrap();
      toast.success("New Brand Added Successfully");

      // Increment reset trigger to reset form fields
      setResetTrigger((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create brand");
    }
  };

  return (
    <CreateBrandForm
      onSubmit={handleSubmit}
      loading={isLoading}
      resetTrigger={resetTrigger}
    />
  );
};

export default CreateBrandPage;
