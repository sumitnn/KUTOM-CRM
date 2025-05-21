
import axios from "../utils/axiosInstance";

export const fetchVendors = async () => {
    return await axios.get("/users-list/?role=vendor");
};

export const createVendor = async (data) => {
    const vendorData = { ...data, role: "vendor" };
    return await axios.post("/register/", vendorData);
};

export const updateVendor = async (user_id, data) => {
    return await axios.put(`/update-user/${user_id}/`, data);
};

export const deleteVendor = async (user_id) => {
    return await axios.delete(`/delete-user/${user_id}/`, {
        data: { user_id: user_id }
    });
};

