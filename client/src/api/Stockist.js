
import axios from "../utils/axiosInstance";

export const fetchStockist = async () => {
    return await axios.get("/users-list/?role=stockist");
};

export const createStockist = async (data) => {
    const vendorData = { ...data, role: "stockist" };
    return await axios.post("/register/", vendorData);
};

export const updateStockist = async (user_id, data) => {
    return await axios.put(`/update-user/${user_id}/`, data);
};

export const deleteStockist = async (user_id) => {
    return await axios.delete(`/delete-user/${user_id}/`, {
        data: { user_id: user_id }
    });
};

