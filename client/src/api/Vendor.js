import axios from "../utils/axiosInstance";

export const fetchVendors = async () => {
    return await axios.get("/users-list/?role=vendor");
};

export const createVendor = async (data) => {
    return await axios.post("/register/", data);
};

export const updateVendor = async (id, data) => {
    return await axios.put(`/user/${id}/`, data);
};

export const deleteVendor = async (id) => {
    return await axios.delete(`/user/${id}/`);
};
