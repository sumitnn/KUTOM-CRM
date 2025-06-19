import React, { useState, useEffect } from 'react';
import { 
    useGetVendorActiveProductsQuery,
    useGetProductSizesQuery 
} from '../features/product/productApi';

const StockModal = ({ 
    initialData, 
    onSubmit, 
    onClose 
}) => {
    const [formData, setFormData] = useState({
        product_id: initialData?.product_id || '',
        size_id: initialData?.size_id || '',
        old_quantity: initialData?.quantity || 0,
        new_quantity: 0,
        old_price: initialData?.price || 0,
        new_price: initialData?.price || 0,
        notes: initialData?.notes || '',
    });

    // Fetch vendor's active products
    const { data: products = [] } = useGetVendorActiveProductsQuery();
    
    // Fetch sizes for the selected product
    const { data: sizes = [] } = useGetProductSizesQuery(formData.product_id, {
        skip: !formData.product_id,
    });

    // When product changes, reset size and price
    const handleProductChange = (e) => {
        const productId = e.target.value;
        setFormData({
            ...formData,
            product_id: productId,
            size_id: '',
            old_price: 0,
            new_price: 0,
        });
    };

    // When size changes, update price
    const handleSizeChange = (e) => {
        const sizeId = e.target.value;
        const selectedSize = sizes.find(s => s.id === Number(sizeId));
        setFormData({
            ...formData,
            size_id: sizeId,
            old_price: selectedSize?.price || 0,
            new_price: selectedSize?.price || 0,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            product_id: formData.product_id,
            size_id: formData.size_id,
            quantity: formData.new_quantity,
            price: formData.new_price,
            notes: formData.notes,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {initialData ? 'Update Stock' : 'Add New Stock'}
                </h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Product</label>
                        <select
                            value={formData.product_id}
                            onChange={handleProductChange}
                            className="w-full p-2 border rounded"
                            required
                            disabled={!!initialData}
                        >
                            <option value="">Select Product</option>
                            {products.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Size</label>
                        <select
                            value={formData.size_id}
                            onChange={handleSizeChange}
                            className="w-full p-2 border rounded"
                            required
                            disabled={!!initialData && !!initialData.size_id}
                        >
                            <option value="">Select Size</option>
                            {sizes.map(size => (
                                <option key={size.id} value={size.id}>
                                    {size.size} (${size.price})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Current Qty</label>
                            <input
                                type="number"
                                value={formData.old_quantity}
                                readOnly
                                className="w-full p-2 border rounded bg-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">New Qty</label>
                            <input
                                type="number"
                                value={formData.new_quantity}
                                onChange={(e) => setFormData({...formData, new_quantity: e.target.value})}
                                min="0"
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Current Price</label>
                            <input
                                type="number"
                                value={formData.old_price}
                                readOnly
                                step="0.01"
                                className="w-full p-2 border rounded bg-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">New Price</label>
                            <input
                                type="number"
                                value={formData.new_price}
                                onChange={(e) => setFormData({...formData, new_price: e.target.value})}
                                step="0.01"
                                min="0"
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            className="w-full p-2 border rounded"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-black text-white rounded"
                        >
                            {initialData ? 'Update' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockModal;