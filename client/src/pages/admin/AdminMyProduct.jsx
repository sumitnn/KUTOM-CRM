// AdminMyProduct.jsx
import React, { useState } from "react";
import { 
    useGetMyProductsQuery,
    useUpdateCommissionMutation,
    useUpdateProductPriceMutation,
    useUpdateProductFeaturedStatusMutation,
    useUpdateProductStatusMutation
} from "../../features/product/productApi";
import { useGetBrandsQuery } from "../../features/brand/brandApi";
import { 
    useGetCategoriesQuery, 
    useGetSubcategoriesByCategoryQuery 
} from '../../features/category/categoryApi';
import { toast } from "react-toastify";

import {
   
    FiEye,
    FiSearch,
    FiX,
    FiFilter,
    FiDollarSign,
    FiPackage,
    FiXCircle,
    FiArrowUp,
    FiArrowDown,
    FiChevronLeft,
    FiChevronRight,
    FiRefreshCw
} from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";
import ModalPortal from "../../components/ModalPortal";

// Commission Modal Component
const CommissionModal = ({ product, isOpen, onClose, onSave }) => {
    const [commissionData, setCommissionData] = useState({
        commission_type: "percentage",
        reseller_commission_value: "0",
        stockist_commission_value: "0",
        admin_commission_value: "0"
    });
   
    React.useEffect(() => {
        if (product?.commission) {
            setCommissionData({
                commission_type: product.commission.commission_type || "flat",
                reseller_commission_value: product.commission.reseller_commission_value || "0",
                stockist_commission_value: product.commission.stockist_commission_value || "0",
                admin_commission_value: product.commission.admin_commission_value || "0"
            });
        }
    }, [product]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate commission values
        const commissions = [
            commissionData.reseller_commission_value,
            commissionData.stockist_commission_value,
            commissionData.admin_commission_value
        ];
        
        if (commissions.some(commission => commission < 0)) {
            toast.error("Commission values cannot be negative");
            return;
        }
        
        if (commissionData.commission_type === 'percentage' && 
            commissions.some(commission => commission > 100)) {
            toast.error("Percentage commission cannot exceed 100%");
            return;
        }
        
        onSave(product.id, commissionData);
    };

    const handleCommissionChange = (field, value) => {
        setCommissionData(prev => ({
            ...prev,
            [field]: value
        }));
    };
  
    return (
        <ModalPortal>
        <div className="modal modal-open">
            <div className="modal-box max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">
                        {product?.commission ? "Edit" : "Add"} Commission - {product?.product_detail?.name}
                    </h3>
                    <button onClick={onClose} className="btn btn-sm btn-circle">
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-extrabold">Product Price : {product?.product_detail?.variants?.[0]?.product_variant_prices?.[0].price} </span>
                        </label>
                        
                    </div>

                    <div className="space-y-3">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    Reseller Commission ({commissionData.commission_type === 'percentage' ? '%' : '₹'})
                                </span>
                            </label>
                            <input
                                type="number"
                                step={commissionData.commission_type === 'percentage' ? "0.01" : "1"}
                                min="0"
                                max={commissionData.commission_type === 'percentage' ? "100" : ""}
                                className="input input-bordered cursor-pointer"
                                value={commissionData.reseller_commission_value}
                                onChange={(e) => handleCommissionChange('reseller_commission_value', e.target.value)}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    Stockist Commission ({commissionData.commission_type === 'percentage' ? '%' : '₹'})
                                </span>
                            </label>
                            <input
                                type="number"
                                step={commissionData.commission_type === 'percentage' ? "0.01" : "1"}
                                min="0"
                                max={commissionData.commission_type === 'percentage' ? "100" : ""}
                                className="input input-bordered cursor-pointer"
                                value={commissionData.stockist_commission_value}
                                onChange={(e) => handleCommissionChange('stockist_commission_value', e.target.value)}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">
                                    Admin Commission ({commissionData.commission_type === 'percentage' ? '%' : '₹'})
                                </span>
                            </label>
                            <input
                                type="number"
                                step="10"
                                min="0"
                                className="input input-bordered cursor-pointer"
                                value={commissionData.admin_commission_value}
                                onChange={(e) => handleCommissionChange('admin_commission_value', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="modal-action">
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary cursor-pointer">
                            Save Commission
                        </button>
                    </div>
                </form>
            </div>
            </div>
            </ModalPortal>
    );
};

// Product Details Modal Component
const ProductDetailsModal = ({ product, isOpen, onClose }) => {
    if (!isOpen || !product) return null;

    // Get admin price from variants
    const getAdminPrice = () => {
        if (product.product_detail?.variants && product.product_detail.variants.length > 0) {
            const variant = product.product_detail.variants[0];
            const adminPrice = variant.product_variant_prices?.find(
                price => price.role === 'admin'
            );
            return adminPrice ? `₹${adminPrice.price}` : 'N/A';
        }
        return 'N/A';
    };

    // Get first image
    const getFirstImage = () => {
        const images = product.product_detail?.images || [];
        if (images.length > 0) {
            const defaultImg = images.find(img => img.is_default);
            const featuredImg = images.find(img => img.is_featured);
            return defaultImg?.image || featuredImg?.image || images[0].image;
        }
        return "/placeholder.png";
    };

    // Get total available stock
    const getTotalStock = () => {
        return product.inventories?.reduce((total, inventory) => 
            total + (inventory.total_quantity || 0), 0) || 0;
    };

    const totalStock = getTotalStock();
    const isLowStock = totalStock < 10;

    return (
        <ModalPortal>
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Product Details</h3>
                    <button onClick={onClose} className="btn btn-sm btn-circle">
                        <FiX />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Product Images */}
                    <div>
                        <div className="bg-gray-100 rounded-lg p-4 mb-4">
                            <img
                                src={getFirstImage()}
                                alt={product.product_detail?.name}
                                className="w-full h-64 object-contain"
                            />
                        </div>
                        {product.product_detail?.images && product.product_detail.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {product.product_detail.images.map((img, index) => (
                                    <img
                                        key={img.id}
                                        src={img.image}
                                        alt={`${product.product_detail.name} ${index + 1}`}
                                        className="w-16 h-16 object-cover rounded border"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Information */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-lg">{product.product_detail?.name}</h4>
                            <p className="text-gray-600">SKU: {product.product_detail?.sku}</p>
                        </div>

                        {/* Stock Information */}
                        <div className={`p-3 rounded-lg ${isLowStock ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Stock Status:</span>
                                <span className={`badge ${isLowStock ? 'badge-error' : 'badge-success'}`}>
                                    {isLowStock ? 'Low Stock' : 'In Stock'}
                                </span>
                            </div>
                            <div className="mt-2">
                                <span className="font-medium">Total Available Quantity: </span>
                                <span className={isLowStock ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                                    {totalStock} units
                                </span>
                            </div>
                            {isLowStock && (
                                <p className="text-red-600 text-sm mt-1">
                                    ⚠️ Stock is running low. Consider restocking.
                                </p>
                            )}
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Brand:</strong> {product.product_detail?.brand_name || "N/A"}</div>
                            <div><strong>Category:</strong> {product.product_detail?.category_name || "N/A"}</div>
                            <div><strong>Subcategory:</strong> {product.product_detail?.subcategory_name || "N/A"}</div>
                            <div><strong>Product Type:</strong> {product.product_detail?.product_type_display || "N/A"}</div>
                            <div><strong>Status:</strong> 
                                <span className={`badge badge-sm ml-2 ${
                                    product.product_detail?.status === 'published' ? 'badge-success' : 'badge-warning'
                                }`}>
                                    {product.product_detail?.status_display}
                                </span>
                            </div>
                            <div><strong>Admin Price:</strong> {getAdminPrice()}</div>
                            <div><strong>Weight:</strong> {product.product_detail?.weight} {product.product_detail?.weight_unit}</div>
                            <div><strong>Dimensions:</strong> {product.product_detail?.dimensions || "N/A"}</div>
                        </div>

                        {/* Commission Information */}
                        {product.commission && (
                            <div className="border rounded-lg p-3">
                                <h5 className="font-semibold mb-2">Commission Details</h5>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><strong>Type:</strong> {product.commission.commission_type_display}</div>
                                    <div><strong>Reseller:</strong> {product.commission.reseller_commission_value} {product.commission.commission_type === 'percentage' ? '%' : '₹'}</div>
                                    <div><strong>Stockist:</strong> {product.commission.stockist_commission_value} {product.commission.commission_type === 'percentage' ? '%' : '₹'}</div>
                                    <div><strong>Admin:</strong> {product.commission.admin_commission_value} {product.commission.commission_type === 'percentage' ? '%' : '₹'}</div>
                                </div>
                            </div>
                        )}

                        {/* Inventory Details */}
                        {product.inventories && product.inventories.length > 0 && (
                            <div>
                                <h5 className="font-semibold mb-2">Inventory Details</h5>
                                <div className="space-y-2">
                                    {product.inventories.map((inventory) => (
                                        <div key={inventory.id} className="border rounded p-2 text-sm">
                                            <div className="flex justify-between">
                                                <span><strong>Variant:</strong> {inventory.variant_name}</span>
                                                <span className={`badge badge-sm ${inventory.total_quantity < 10 ? 'badge-error' : 'badge-success'}`}>
                                                    {inventory.total_quantity} units
                                                </span>
                                            </div>
                                            <div><strong>Last Updated:</strong> {new Date(inventory.updated_at).toLocaleDateString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div></ModalPortal>
    );
};

// Price Edit Modal Component
const PriceEditModal = ({ product, isOpen, onClose, onSave }) => {
    const [price, setPrice] = useState("");
    const [variantId, setVaraintId] = useState("");  
   
    React.useEffect(() => {
        if (product?.product_detail?.variants && product.product_detail.variants.length > 0) {
            const variant = product.product_detail.variants[0];
            const adminPrice = variant.product_variant_prices?.find(
                price => price.role === 'admin'
            );
            
            setPrice(adminPrice?.price || "");
            setVaraintId(adminPrice?.id || "");
        }
    }, [product]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!price || price <= 0) {
            toast.error("Please enter a valid price");
            return;
        }
        onSave(parseFloat(price),variantId);
    };

    return (
        <ModalPortal>
        <div className="modal modal-open">
            <div className="modal-box max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Edit Price - {product?.product_detail?.name}</h3>
                    <button onClick={onClose} className="btn btn-sm btn-circle">
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">New Price (₹)</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input input-bordered"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>

                    <div className="modal-action">
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Update Price
                        </button>
                    </div>
                </form>
            </div>
        </div></ModalPortal>
    );
};

const AdminMyProduct = () => {
    // Filter states
    const [filters, setFilters] = useState({
        search: "",
        featured: "all",
        brand: "all",
        category: "all",
        subcategory: "all"
    });
    
    // Active filters for API call
    const [activeFilters, setActiveFilters] = useState({});
    
    // Pagination and sort states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortField, setSortField] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");
    
    // Modal states
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [commissionModalOpen, setCommissionModalOpen] = useState(false);
    const [priceModalOpen, setPriceModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // API calls
    const { data: brandsData } = useGetBrandsQuery();
    const { data: categoriesData } = useGetCategoriesQuery();
    const { data: subcategoriesData } = useGetSubcategoriesByCategoryQuery(
        filters.category !== 'all' ? filters.category : null,
        { skip: filters.category === 'all' }
    );
    
    // RTK Mutation hooks
    const [updateCommission] = useUpdateCommissionMutation();
    const [updateProductPrice] = useUpdateProductPriceMutation();
    const [updateProductFeaturedStatus] = useUpdateProductFeaturedStatusMutation();
    const [updateProductStatus] = useUpdateProductStatusMutation();

    // Products API call with active filters
    const {
        data: apiResponse,
        isLoading,
        isError,
        refetch,
    } = useGetMyProductsQuery({
        page: currentPage,
        pageSize: itemsPerPage,
        ...activeFilters,
        sortField: sortField,
        sortDirection: sortDirection,
    });

    // Handle API response
    const productsData = apiResponse || {};
    const products = productsData.results || [];
    const totalCount = productsData.count || 0;
    const totalPages = productsData.total_pages || 1;

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSearch = () => {
        const newFilters = {
            search: filters.search || '',
            featured: filters.featured !== 'all' ? filters.featured : '',
            category: filters.category !== 'all' ? filters.category : '',
            brand: filters.brand !== 'all' ? filters.brand : '',
            subcategory: filters.subcategory !== 'all' ? filters.subcategory : '',
        };
        
        setActiveFilters(newFilters);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            featured: "all",
            brand: "all",
            category: "all",
            subcategory: "all"
        });
        setActiveFilters({});
        setCurrentPage(1);
    };

    const handleRefresh = () => {
        refetch();
        toast.success("Products refreshed");
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
        setCurrentPage(1);
    };

  

    const toggleFeaturedStatus = async (productId, currentFeatured) => {
        try {
            const newFeaturedStatus = !currentFeatured;
            await updateProductFeaturedStatus({
                productId,
                isFeatured: newFeaturedStatus
            }).unwrap();
            toast.success(`Product featured status ${newFeaturedStatus ? 'enabled' : 'disabled'}`);
        } catch (error) {
            toast.error("Failed to update featured status");
        }
    };

    const handleSaveCommission = async (productId, commissionData) => {
        try {
            await updateCommission({
                productId,
                commissionData
            }).unwrap();
            toast.success("Commission saved successfully");
            setCommissionModalOpen(false);
        } catch (error) {
            toast.error("Failed to save commission");
        }
    };

    const handleSavePrice = async (newPrice,variantId) => {
      
        try {
            // Assuming first variant for simplicity
            const productId = 424324;
            if (variantId) {
                await updateProductPrice({
                    productId,
                    variantId,
                    priceData: { price: newPrice }
                }).unwrap();
                toast.success("Price updated successfully");
                setPriceModalOpen(false);
            } else {
                toast.error("No variant found for this product");
            }
        } catch (error) {
            toast.error("Failed to update price");
        }
    };

    const openDetailsModal = (product) => {
        setSelectedProduct(product);
        setDetailsModalOpen(true);
    };

    const openCommissionModal = (product) => {
        setSelectedProduct(product);
        setCommissionModalOpen(true);
    };

    const openPriceModal = (product) => {
        setSelectedProduct(product);
        setPriceModalOpen(true);
    };

    // Get total stock for a product
    const getTotalStock = (product) => {
        return product.inventories?.reduce((total, inventory) => 
            total + (inventory.total_quantity || 0), 0) || 0;
    };

    // Get stock status badge
    const getStockBadge = (product) => {
        const totalStock = getTotalStock(product);
        if (totalStock === 0) {
            return <span className="badge badge-error badge-sm">Out of Stock</span>;
        } else if (totalStock < 10) {
            return <span className="badge badge-warning badge-sm">Low Stock</span>;
        } else {
            return <span className="badge badge-success badge-sm">In Stock</span>;
        }
    };

    // Get first image for product
    const getFirstImage = (product) => {
        const images = product.product_detail?.images || [];
        if (images.length > 0) {
            const defaultImg = images.find(img => img.is_default);
            const featuredImg = images.find(img => img.is_featured);
            return defaultImg?.image || featuredImg?.image || images[0].image;
        }
        return "/placeholder.png";
    };

    // Get admin price from variants
    const getAdminPrice = (product) => {
        
        if (product.product_detail?.variants && product.product_detail.variants.length > 0) {
            const variant = product.product_detail.variants[0];
            const adminPrice = variant.product_variant_prices?.find(
                price => price.role === 'admin'
            );
            return adminPrice ? `₹${adminPrice.price}` : 'N/A';
        }
        return 'N/A';
    };

    const SortableHeader = ({ field, children }) => (
        <th 
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center gap-1">
                {children}
                {sortField === field && (
                    sortDirection === "asc" ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />
                )}
            </div>
        </th>
    );

    return (
        <div className="px-6 py-8 max-w-8xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
                    <p className="text-gray-600 mt-2">Manage and monitor your product listings</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleRefresh} className="btn btn-outline">
                        <FiRefreshCw className="mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FiFilter className="text-gray-600" />
                        Filters & Search
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={handleSearch} className="btn btn-primary btn-sm">
                            <FiSearch className="mr-2" />
                            Apply Filters
                        </button>
                        <button onClick={clearFilters} className="btn btn-ghost btn-sm">
                            <FiXCircle className="mr-2" />
                            Clear All
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Input */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Search Products</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name or SKU..."
                                className="input input-bordered w-full pl-10 cursor-pointer"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <FiSearch className="absolute left-3 top-3 text-gray-400" />
                        </div>
                    </div>

                    {/* Featured Filter */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Featured Status</span>
                        </label>
                        <select
                            className="select select-bordered cursor-pointer"
                            value={filters.featured}
                            onChange={(e) => handleFilterChange('featured', e.target.value)}
                        >
                            <option value="all">All Products</option>
                            <option value="true">Featured Only</option>
                            <option value="false">Not Featured</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Category</span>
                        </label>
                        <select
                            className="select select-bordered cursor-pointer"
                            value={filters.category}
                            onChange={(e) => {
                                handleFilterChange('category', e.target.value);
                                handleFilterChange('subcategory', 'all');
                            }}
                        >
                            <option value="all">All Categories</option>
                            {categoriesData?.results?.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subcategory Filter */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Subcategory</span>
                        </label>
                        <select
                            className="select select-bordered cursor-pointer"
                            value={filters.subcategory}
                            onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                            disabled={filters.category === 'all'}
                        >
                            <option value="all">All Subcategories</option>
                            {subcategoriesData?.results?.map((subcategory) => (
                                <option key={subcategory.id} value={subcategory.id}>
                                    {subcategory.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Second Row of Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {/* Brand Filter */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Brand</span>
                        </label>
                        <select
                            className="select select-bordered cursor-pointer"
                            value={filters.brand}
                            onChange={(e) => handleFilterChange('brand', e.target.value)}
                        >
                            <option value="all">All Brands</option>
                            {brandsData?.results?.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Items Per Page */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Items Per Page</span>
                        </label>
                        <select
                            className="select select-bordered cursor-pointer"
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        >
                            <option value={5}>5 per page</option>
                            <option value={10}>10 per page</option>
                            <option value={25}>25 per page</option>
                          
                        </select>
                    </div>

                    {/* Active Filters Display */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Active Filters</span>
                        </label>
                        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded">
                            {Object.keys(activeFilters).length === 0 ? (
                                <span className="text-gray-500 text-sm">No active filters</span>
                            ) : (
                                Object.entries(activeFilters).map(([key, value]) => (
                                    value && (
                                        <span key={key} className="badge badge-primary badge-sm">
                                            {key}: {value}
                                        </span>
                                    )
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Table Header with Stats */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <div>
                        <h3 className="font-semibold">Product List</h3>
                        <p className="text-sm text-gray-600">
                            Showing {products.length} of {totalCount} products
                        </p>
                    </div>
                   
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <span className="loading loading-spinner text-primary loading-lg"></span>
                            <p className="mt-4 text-gray-600">Loading products...</p>
                        </div>
                    </div>
                ) : isError ? (
                    <div className="text-center py-10">
                        <div className="alert alert-error max-w-md mx-auto">
                            <div>
                                <span>Failed to load products.</span>
                            </div>
                            <button className="btn btn-sm btn-outline mt-4" onClick={refetch}>
                                Retry
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <SortableHeader field="name">Product</SortableHeader>
                                        <SortableHeader field="sku">SKU</SortableHeader>
                                        <th>Category</th>
                                        <th>Brand</th>
                                        <SortableHeader field="price">Price</SortableHeader>
                                        <th>Stock</th>
                                       
                                        <th>Featured</th>
                                        <th>Commission</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => {
                                        const totalStock = getTotalStock(product);
                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="avatar">
                                                            <div className="w-12 h-12 bg-gray-100 rounded">
                                                                <img 
                                                                    src={getFirstImage(product)} 
                                                                    alt={product.product_detail?.name}
                                                                    className="object-cover w-full h-full"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{product.product_detail?.name}</div>
                                                            <div className="text-sm text-gray-500">{product.product_detail?.product_type_display}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="font-extrabold text-sm">{product.product_detail?.sku}</td>
                                                <td>
                                                    <div>{product.product_detail?.category_name}</div>
                                                    <div className="text-xs text-gray-500">{product.product_detail?.subcategory_name}</div>
                                                </td>
                                                <td>{product.product_detail?.brand_name}</td>
                                                <td>
                                                    <div className="font-bold">{getAdminPrice(product)}</div>
                                                    <button 
                                                        onClick={() => openPriceModal(product)}
                                                        className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                                                    >
                                                        Edit Price
                                                    </button>
                                                </td>
                                                <td>
                                                    <div className="flex flex-col gap-1">
                                                        {getStockBadge(product)}
                                                        <span className="text-xs text-gray-600">
                                                            Qty: {totalStock}
                                                        </span>
                                                    </div>
                                                </td>
                                              
                                                <td>
                                                    <button
                                                        onClick={() => toggleFeaturedStatus(product.id, product.is_featured)}
                                                        className={`btn btn-xs ${
                                                            product.is_featured ? 'btn-primary' : 'btn-ghost'
                                                        }`}
                                                    >
                                                        {product.is_featured ? 'Currently Active' : 'Currently Not Active'}
                                                    </button>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => openCommissionModal(product)}
                                                        className={`btn btn-xs ${
                                                            product.commission ? 'btn-success' : 'btn-outline'
                                                        }`}
                                                    >
                                                        <FiDollarSign className="mr-1" />
                                                        {product.commission ? 'Edit' : 'Add'}
                                                    </button>
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openDetailsModal(product)}
                                                            className="btn btn-xs btn-ghost"
                                                            title="View Details"
                                                        >
                                                            <FiEye />
                                                        </button>
                                                        
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            
                            {products.length === 0 && (
                                <div className="text-center py-10">
                                    <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                                        No products found
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {Object.keys(activeFilters).length > 0
                                            ? "Try adjusting your search or filter criteria"
                                            : "There are currently no products available"}
                                    </p>
                                    {Object.keys(activeFilters).length > 0 && (
                                        <div className="mt-4">
                                            <button onClick={clearFilters} className="btn btn-primary">
                                                Clear all filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center p-4 border-t">
                                <div className="text-sm text-gray-600">
                                    Page {currentPage} of {totalPages} • {totalCount} total products
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="btn btn-sm btn-outline"
                                    >
                                        <FiChevronLeft className="mr-1" />
                                        Previous
                                    </button>
                                    <div className="flex gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`btn btn-sm ${
                                                        currentPage === pageNum 
                                                            ? 'btn-primary' 
                                                            : 'btn-outline'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="btn btn-sm btn-outline"
                                    >
                                        Next
                                        <FiChevronRight className="ml-1" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <ProductDetailsModal
                product={selectedProduct}
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
            />

            <CommissionModal
                product={selectedProduct}
                isOpen={commissionModalOpen}
                onClose={() => setCommissionModalOpen(false)}
                onSave={handleSaveCommission}
            />

            <PriceEditModal
                product={selectedProduct}
                isOpen={priceModalOpen}
                onClose={() => setPriceModalOpen(false)}
                onSave={handleSavePrice}
            />
        </div>
    );
};

export default AdminMyProduct;