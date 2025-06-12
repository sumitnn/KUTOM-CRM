import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiCheck, FiX, FiSearch, FiFilter, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import AdminEditProductModal from './AdminEditProductModal';

// Enhanced dummy data with different statuses
const dummyProductRequests = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    vendor: "SoundMaster Inc.",
    category: "Electronics",
    status: "pending",
    createdAt: "2023-05-15",
    variants: [
      { id: 101, color: "Black", price: 129.99, stock: 50 },
      { id: 102, color: "White", price: 139.99, stock: 30 }
    ]
  },
  {
    id: 2,
    name: "Organic Cotton T-Shirt",
    vendor: "EcoWear",
    category: "Clothing",
    status: "approved",
    createdAt: "2023-05-18",
    variants: [
      { id: 201, size: "S", color: "Blue", price: 29.99, stock: 100 },
      { id: 202, size: "M", color: "Blue", price: 31.99, stock: 80 },
      { id: 203, size: "L", color: "Blue", price: 33.99, stock: 60 }
    ]
  },
  {
    id: 3,
    name: "Stainless Steel Water Bottle",
    vendor: "HydroFlask",
    category: "Accessories",
    status: "pending",
    createdAt: "2023-05-20",
    variants: [
      { id: 301, capacity: "500ml", color: "Silver", price: 24.99, stock: 120 },
      { id: 302, capacity: "750ml", color: "Black", price: 29.99, stock: 90 }
    ]
  },
  {
    id: 4,
    name: "Smart Fitness Tracker",
    vendor: "FitTech",
    category: "Electronics",
    status: "rejected",
    createdAt: "2023-05-22",
    variants: [
      { id: 401, model: "Standard", color: "Black", price: 79.99, stock: 0 },
      { id: 402, model: "Pro", color: "Blue", price: 99.99, stock: 0 }
    ]
  }
];

const AdminProductApprovalPage = () => {
  const [products, setProducts] = useState(dummyProductRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter products based on search term and active tab
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = activeTab === 'all' || product.status === activeTab;
    
    return matchesSearch && matchesStatus;
  });

  // Approve product
  const approveProduct = (productId) => {
    setProducts(products.map(product => 
      product.id === productId ? { ...product, status: "approved" } : product
    ));
  };

  // Reject product
  const rejectProduct = (productId) => {
    setProducts(products.map(product => 
      product.id === productId ? { ...product, status: "rejected" } : product
    ));
  };

  // Save edited product
  const saveEditedProduct = (updatedProduct) => {
    setProducts(products.map(product => 
      product.id === updatedProduct.id ? updatedProduct : product
    ));
    closeModal();
  };

  // Toggle variant expansion
  const toggleExpand = (productId) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  // Open edit modal
  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    const statusText = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {statusText[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Approval Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review and manage products submitted by vendors before they go live
          </p>
        </div>

        {/* Status Tabs */}
        <div className="mb-6">
          <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">Select a tab</label>
            <select
              id="tabs"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              <option value="all">All Products</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  All Products
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'approved' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'rejected' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Rejected
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search products by name, vendor or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <FiFilter className="mr-2 h-4 w-4" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search' : `No ${activeTab} product requests`}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <li key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {product.name}
                          </h3>
                          <StatusBadge status={product.status} />
                        </div>
                        <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="truncate">Vendor: {product.vendor}</span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="truncate">Category: {product.category}</span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="truncate">Submitted: {new Date(product.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={() => toggleExpand(product.id)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center"
                        >
                          {expandedProduct === product.id ? (
                            <>
                              <span className="hidden sm:inline">Hide</span> 
                              <FiChevronUp className="ml-1 h-4 w-4" />
                            </>
                          ) : (
                            <>
                              <span className="hidden sm:inline">View</span> 
                              <FiChevronDown className="ml-1 h-4 w-4" />
                            </>
                          )}
                        </button>
                        {product.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-2 text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <FiEdit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => approveProduct(product.id)}
                              className="p-2 text-green-600 hover:text-green-800"
                              title="Approve"
                            >
                              <FiCheck className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => rejectProduct(product.id)}
                              className="p-2 text-red-600 hover:text-red-800"
                              title="Reject"
                            >
                              <FiX className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {product.status === 'approved' && (
                          <button
                            onClick={() => rejectProduct(product.id)}
                            className="p-2 text-red-600 hover:text-red-800"
                            title="Reject"
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                        )}
                        {product.status === 'rejected' && (
                          <button
                            onClick={() => approveProduct(product.id)}
                            className="p-2 text-green-600 hover:text-green-800"
                            title="Approve"
                          >
                            <FiCheck className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Variants Section */}
                    {expandedProduct === product.id && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Product Variants</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(product.variants[0]).map((key) => (
                                  key !== 'id' && (
                                    <th
                                      key={key}
                                      scope="col"
                                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      {key}
                                    </th>
                                  )
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {product.variants.map((variant) => (
                                <tr key={variant.id}>
                                  {Object.entries(variant).map(([key, value]) => (
                                    key !== 'id' && (
                                      <td key={key} className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {typeof value === 'number' ? value.toFixed(2) : value}
                                      </td>
                                    )
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Edit Product Modal */}
      {isModalOpen && (
        <AdminEditProductModal
          product={editingProduct}
          onClose={closeModal}
          onSave={saveEditedProduct}
        />
      )}
    </div>
  );
};



export default AdminProductApprovalPage;