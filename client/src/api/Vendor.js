
import axios from "../utils/axiosInstance";

export const fetchVendors = async () => {
    return await axios.get("/users-list/?role=vendor");
};

export const createVendor = async (data) => {
    const vendorData = { ...data, role: "vendor" };
    return await axios.post("/register/", vendorData);
};

export const updateVendor = async (id, data) => {
    return await axios.put(`/vendors/${id}/`, data);
};

export const deleteVendor = async (user_id) => {
    return await axios.delete("/delete-user/", {
        data: { user_id: user_id }
    });
};

