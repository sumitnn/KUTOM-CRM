// utils/orderApi.js
import axios from "../utils/axiosInstance";

export const fetchAdminOrders = async (status = 'all') => {
    const response = await axios.get(`/orders/admin/?status=${status}`);
    return response.data;
};
