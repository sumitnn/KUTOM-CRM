import axiosInstance from './axiosInstance';

const axiosBaseQuery =
    () =>
        async ({ url = '', method, data, params }) => {
            try {
                // Just call axiosInstance with url and other options
                const result = await axiosInstance({
                    url,
                    method,
                    data,
                    params,
                });

                return { data: result.data };
            } catch (axiosError) {
                const err = axiosError;
                return {
                    error: {
                        status: err.response?.status,
                        data: err.response?.data || err.message,
                    },
                };
            }
        };

export default axiosBaseQuery;
