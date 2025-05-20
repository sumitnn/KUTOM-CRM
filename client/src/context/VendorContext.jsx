import { createContext, useContext, useReducer, useEffect } from "react";
import {
  fetchVendors,
  createVendor,
  updateVendor,
  deleteVendor,
} from "../api/Vendor";

const VendorContext = createContext();

const initialState = {
  vendors: [],
  loading: false,
  error: null,
};

const vendorReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, vendors: action.payload };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "ADD_VENDOR":
      return { ...state, vendors: [...state.vendors, action.payload] };
    case "UPDATE_VENDOR":
      return {
        ...state,
        vendors: state.vendors.map((v) =>
          v.id === action.payload.id ? action.payload : v
        ),
      };
    case "DELETE_VENDOR":
      return {
        ...state,
        vendors: state.vendors.filter((v) => v.id !== action.payload),
      };
    default:
      return state;
  }
};

export const VendorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(vendorReducer, initialState);

  const loadVendors = async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const res = await fetchVendors();
      dispatch({ type: "FETCH_SUCCESS", payload: res.data });
    } catch (err) {
      dispatch({
        type: "FETCH_FAIL",
        payload: err.response?.data?.message || "Failed to load vendors",
      });
    }
  };

  const addVendor = async (data) => {
    try {
      const vendorData = { ...data, role: "vendor" };
      const res = await createVendor(vendorData);
  
      // Only dispatch if status is 2xx
      if (res.status >= 200 && res.status < 300) {
        dispatch({ type: "ADD_VENDOR", payload: res.data });
        return { success: true };
      } else {
        return {
          success: false,
          error: res.data || "Failed to create vendor",
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data || "Failed to create vendor",
      };
    }
  };

  const editVendor = async (id, data) => {
    const res = await updateVendor(id, data);
    dispatch({ type: "UPDATE_VENDOR", payload: res.data });
  };

  const removeVendor = async (id) => {
    await deleteVendor(id);
    dispatch({ type: "DELETE_VENDOR", payload: id });
  };

  useEffect(() => {
    loadVendors();
  }, []);

  return (
    <VendorContext.Provider
      value={{ ...state, addVendor, editVendor, removeVendor, loadVendors }}
    >
      {children}
    </VendorContext.Provider>
  );
};

export const useVendors = () => useContext(VendorContext);
