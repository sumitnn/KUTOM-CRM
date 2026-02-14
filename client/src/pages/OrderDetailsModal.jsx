import { FiX, FiTruck, FiMapPin, FiPackage, FiDollarSign, FiInfo, FiCalendar, FiFileText, FiUser, FiClipboard, FiBox, FiShoppingBag, FiMail, FiPhone, FiHome, FiCreditCard, FiPercent, FiTag, FiLayers, FiHash, FiClock, FiCalendar as FiCalendarIcon, FiTrendingUp, FiDownload } from "react-icons/fi";
import ModalPortal from "../components/ModalPortal";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const OrderDetailsModal = ({ order, onClose }) => {
  console.log(order)
 
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₹0.00";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(amount));
  };

  const calculateTotalQuantity = () => {
    if (!order.items) return 0;
    return order.items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  const renderReceipt = () => {
    if (!order.receipt) return <p className="text-sm text-gray-500">No receipt provided</p>;
    
    const extension = order.receipt.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) {
      return (
        <a 
          href={order.receipt} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
        >
          <FiFileText className="h-4 w-4" />
          <span>View Receipt PDF</span>
        </a>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return (
        <div className="mt-2">
          <img 
            src={order.receipt} 
            alt="Order Receipt" 
            className="h-32 w-auto rounded-md border border-gray-200"
          />
        </div>
      );
    }
    return null;
  };

  const hasBatchDetails = () => {
    if (!order.items) return false;
    return order.items.some(item => 
      item.batch_number || item.manufacture_date || item.expiry_date
    );
  };

  // Format address from address object
  const formatAddress = (address) => {
    if (!address) return 'N/A';
    
    const parts = [
      address.street_address,
      address.city,
      address.district,
      address.state,
      address.postal_code,
      address.country
    ].filter(part => part && part !== null && part.toString().trim() !== '');
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  // Calculate order totals - SIMPLIFIED to use existing values
  const calculateOrderTotals = () => {
    // Use the totalAmount from the order if available
    const grandTotal = parseFloat(order.totalAmount) || 0;
    
    // Calculate subtotal from items if needed
    let subtotal = 0;
    order.items?.forEach(item => {
      subtotal += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
    });

    // Use existing values or calculate
    return {
      subtotal: Math.round(subtotal),
      totalDiscount: Math.round(parseFloat(order.discountAmount) || 0),
      totalGST: Math.round(parseFloat(order.gstAmount) || 0),
      shippingCharges: Math.round(parseFloat(order.transport_charges) || 0),
      grandTotal: Math.round(grandTotal)
    };
  };

  const orderTotals = calculateOrderTotals();

  // PDF Download function
  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Helper function for PDF currency formatting
      const formatPdfCurrency = (amount) => {
        if (!amount && amount !== 0) return "Rs. 0.00";
        const num = parseFloat(amount);
        return `Rs. ${num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
      };
      
      // Add title
      doc.setFontSize(18);
      doc.text(`Order Details - #${order.id}`, 14, 20);
      
      // Add order date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      // Order Status Section
      doc.setFontSize(12);
      doc.text('Order Information', 14, 45);
      doc.setFontSize(10);
      doc.text(`Order Date: ${formatDate(order.created_at || order.date)}`, 14, 55);
      doc.text(`Order Status: ${order.statusDisplay || order.status || "Not specified"}`, 14, 62);
      doc.text(`Payment Status: ${order.paymentStatusDisplay || order.paymentStatus || "Not specified"}`, 14, 69);
      doc.text(`Total Amount: ${formatPdfCurrency(order.totalAmount || orderTotals.grandTotal)}`, 14, 76);
      
      // Buyer Information
      let yPos = 90;
      doc.setFontSize(12);
      doc.text('Buyer Information', 14, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.text(`Name: ${order.buyer?.name || 'N/A'}`, 14, yPos);
      yPos += 7;
      doc.text(`Email: ${order.buyer?.email || 'N/A'}`, 14, yPos);
      yPos += 7;
      doc.text(`Phone: ${order.buyer?.phone || 'Not provided'}`, 14, yPos);
      yPos += 7;
      doc.text(`WhatsApp: ${order.buyer?.whatsapp || 'Not provided'}`, 14, yPos);
      yPos += 7;
      
      // Handle multi-line address
      const addressText = `Address: ${formatAddress(order.buyer?.address)}`;
      const splitAddress = doc.splitTextToSize(addressText, 180);
      doc.text(splitAddress, 14, yPos);
      yPos += (splitAddress.length * 7);
      
      // Vendor Information
      yPos += 5;
      doc.setFontSize(12);
      doc.text('Vendor Information', 14, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.text(`Name: ${order.seller?.name || 'N/A'}`, 14, yPos);
      yPos += 7;
      doc.text(`Email: ${order.seller?.email || 'N/A'}`, 14, yPos);
      yPos += 7;
      doc.text(`Phone: ${order.seller?.phone || 'N/A'}`, 14, yPos);
      yPos += 7;
      doc.text(`Vendor ID: ${order.seller?.roleId || 'N/A'}`, 14, yPos);
      yPos += 7;
      
      // Handle multi-line vendor address
      const vendorAddressText = `Address: ${formatAddress(order.seller?.address)}`;
      const splitVendorAddress = doc.splitTextToSize(vendorAddressText, 180);
      doc.text(splitVendorAddress, 14, yPos);
      yPos += (splitVendorAddress.length * 7);
      
      // Items Table
      yPos += 5;
      const tableColumn = ["Product", "Variant", "Qty", "Base Price", "Discount %", "GST %", "Final Price", "Total"];
      const tableRows = [];
      
      order.items?.forEach(item => {
        const productName = item.productName || item.product?.name || 'N/A';
        const variant = item.size || item.variant?.name || 'N/A';
        const quantity = item.quantity || 0;
        const unitPrice = formatPdfCurrency(item.price || 0);
        const discount = `${item.discount || item.discount_percentage || '0'}%`;
        const gst = `${item.gst_percentage || '0'}%`;
        const finalPrice = formatPdfCurrency(item.single_quantity_after_gst_and_discount_price || 
          (item.price && item.quantity ? (item.price / item.quantity) : 0));
        const total = formatPdfCurrency(item.total || (item.price * item.quantity) || 0);
        
        tableRows.push([productName, variant, quantity, unitPrice, discount, gst, finalPrice, total]);
      });
      
      // Use autoTable
      autoTable(doc, {
        startY: yPos,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66] }
      });
      
      // Order Summary
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Order Summary', 14, finalY);
      
      const summaryY = finalY + 7;
      doc.setFontSize(10);
      
      // Add summary items
      let summaryYPos = summaryY;
      doc.text(`Subtotal (Base): ${formatPdfCurrency(order.subtotal || orderTotals.subtotal)}`, 140, summaryYPos);
      summaryYPos += 7;
      doc.text(`Total Discount: -${formatPdfCurrency(order.discountAmount || orderTotals.totalDiscount)}`, 140, summaryYPos);
      summaryYPos += 7;
      doc.text(`Price After Discount: ${formatPdfCurrency((order.subtotal || orderTotals.subtotal) - (order.discountAmount || orderTotals.totalDiscount))}`, 140, summaryYPos);
      summaryYPos += 7;
      doc.text(`Total GST: +${formatPdfCurrency(order.gstAmount || orderTotals.totalGST)}`, 140, summaryYPos);
      summaryYPos += 7;
      
      if (order.transport_charges && parseFloat(order.transport_charges) > 0) {
        doc.text(`Shipping: +${formatPdfCurrency(order.transport_charges)}`, 140, summaryYPos);
        summaryYPos += 7;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Grand Total: ${formatPdfCurrency(order.totalAmount || orderTotals.grandTotal)}`, 140, summaryYPos + 7);
      doc.setFont('helvetica', 'normal');
      
      // Shipping Information Section
      let shippingYPos = finalY + 50;
      
      // Check if any shipping information exists
      const hasShippingInfo = order.courier_name || order.tracking_number || (order.transport_charges && parseFloat(order.transport_charges) > 0) || order.expected_delivery_date;
      
      if (hasShippingInfo) {
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 0);
        doc.text('Shipping Information', 14, shippingYPos);
        doc.setTextColor(0, 0, 0);
        
        shippingYPos += 10;
        doc.setFontSize(11);
        
        if (order.courier_name) {
          doc.text(`Courier Name:`, 14, shippingYPos);
          doc.setFont('helvetica', 'bold');
          doc.text(`${order.courier_name}`, 70, shippingYPos);
          doc.setFont('helvetica', 'normal');
          shippingYPos += 8;
        }
        
        if (order.tracking_number) {
          doc.text(`Tracking Number:`, 14, shippingYPos);
          doc.setFont('helvetica', 'bold');
          doc.text(`${order.tracking_number}`, 70, shippingYPos);
          doc.setFont('helvetica', 'normal');
          shippingYPos += 8;
        }
        
        if (order.transport_charges && parseFloat(order.transport_charges) > 0) {
          doc.text(`Transport Charges:`, 14, shippingYPos);
          doc.setFont('helvetica', 'bold');
          doc.text(`${formatPdfCurrency(order.transport_charges)}`, 70, shippingYPos);
          doc.setFont('helvetica', 'normal');
          shippingYPos += 8;
        }
        
        if (order.expected_delivery_date) {
          doc.text(`Expected Delivery:`, 14, shippingYPos);
          doc.setFont('helvetica', 'bold');
          doc.text(`${formatDate(order.expected_delivery_date)}`, 70, shippingYPos);
          doc.setFont('helvetica', 'normal');
          shippingYPos += 8;
        }
        
        shippingYPos += 5;
      }
      
      // Additional Information
      if (order.description || order.note) {
        const addInfoY = shippingYPos + 10;
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 150);
        doc.text('Additional Information', 14, addInfoY);
        doc.setTextColor(0, 0, 0);
        
        let addInfoYPos = addInfoY + 10;
        doc.setFontSize(11);
        
        if (order.description) {
          doc.text('Description:', 14, addInfoYPos);
          const descText = `${order.description}`;
          const splitDesc = doc.splitTextToSize(descText, 160);
          doc.text(splitDesc, 60, addInfoYPos);
          addInfoYPos += (splitDesc.length * 7) + 3;
        }
        
        if (order.note) {
          doc.text('Note:', 14, addInfoYPos);
          const noteText = `${order.note}`;
          const splitNote = doc.splitTextToSize(noteText, 160);
          doc.text(splitNote, 60, addInfoYPos);
        }
      }
      
      // Save the PDF
      doc.save(`order-${order.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Check if download button should be shown (not pending)
  const showDownloadButton = order.status && order.status.toLowerCase() !== 'pending';

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FiInfo className="text-blue-500" />
              Order Details - #{order.id}
            </h2>
            <div className="flex items-center gap-2">
              {/* Download Button - Shows only if order status is not pending */}
              {showDownloadButton && (
                <button
                  onClick={downloadPDF}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer flex items-center gap-2"
                >
                  <FiDownload className="h-4 w-4" />
                  Download PDF
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Order Status & Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
                  <FiCalendar className="text-blue-600" />
                  Order Date
                </h3>
                <p className="text-sm font-semibold text-gray-900">
                  {formatDate(order.created_at || order.date)}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <h3 className="text-sm font-medium text-yellow-700 mb-2 flex items-center gap-1">
                  <FiClipboard className="text-yellow-600" />
                  Order Status
                </h3>
                <p className="text-sm font-semibold capitalize text-gray-900">
                  {order.statusDisplay || order.status || "Not specified"}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-sm font-medium text-purple-700 mb-2 flex items-center gap-1">
                  <FiCreditCard className="text-purple-600" />
                  Payment Status
                </h3>
                <p className="text-sm font-semibold capitalize text-gray-900">
                  {order.paymentStatusDisplay || order.paymentStatus || "Not specified"}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                  <FiDollarSign className="text-green-600" />
                  Total Amount
                </h3>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(order.totalAmount || orderTotals.grandTotal)}
                </p>
              </div>
            </div>

            {/* Buyer & Seller Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buyer Information */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FiUser className="text-blue-500" />
                  Buyer Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.buyer?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FiMail className="h-3 w-3" />
                      Email
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.buyer?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FiPhone className="h-3 w-3" />
                      Phone
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.buyer?.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FiPhone className="h-3 w-3 text-green-600" />
                      WhatsApp Number
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.buyer?.whatsapp || 'Not provided'}
                      {order.buyer?.whatsapp && (
                        <span className="ml-2 text-xs text-green-600">✓</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FiMapPin className="h-3 w-3" />
                      Address
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatAddress(order.buyer?.address)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FiShoppingBag className="text-green-500" />
                  Vendor Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.seller?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FiMail className="h-3 w-3" />
                      Email
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.seller?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vendor ID</p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.seller?.roleId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FiPhone className="h-3 w-3" />
                      Phone
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.seller?.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.seller?.role || 'vendor'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FiMapPin className="h-3 w-3" />
                      Address
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatAddress(order.seller?.address)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FiPackage className="text-purple-500" />
                Order Items (Total: {calculateTotalQuantity()} items across {order.items?.length || 0} products)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size/Variant
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Price
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discount %
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GST %
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Final Price
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      {hasBatchDetails() && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Batch Details
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items?.map((item, index) => {
                      return (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded flex items-center justify-center mr-3">
                                <FiBox className="h-5 w-5 text-gray-500" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.productName || item.product?.name || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  SKU: {item.sku || 'N/A'}
                                </div>
                                {item.bulk_price_applied && (
                                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                                    Bulk Pricing
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {item.size || item.variant?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.price || 0)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500">
                            {item.discount || item.discount_percentage || '0'}%
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">
                            {item.gst_percentage || '0'}%
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-600">
                            {formatCurrency(item.single_quantity_after_gst_and_discount_price || 
                              (item.price && item.quantity ? (item.price / item.quantity) : 0))}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(item.total || (item.price * item.quantity))}
                          </td>
                          {hasBatchDetails() && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {item.batch_number || item.manufacture_date || item.expiry_date ? (
                                <div className="space-y-1">
                                  {item.batch_number && (
                                    <div className="flex items-center gap-1">
                                      <FiHash className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs">{item.batch_number}</span>
                                    </div>
                                  )}
                                  {item.manufacture_date && (
                                    <div className="flex items-center gap-1">
                                      <FiCalendarIcon className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs">Mfg: {formatDate(item.manufacture_date)}</span>
                                    </div>
                                  )}
                                  {item.expiry_date && (
                                    <div className="flex items-center gap-1">
                                      <FiClock className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs">Exp: {formatDate(item.expiry_date)}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Not set</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Batch Details Section */}
            {hasBatchDetails() && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                  <FiLayers className="text-blue-600" />
                  Batch Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.items?.map((item, index) => (
                    (item.batch_number || item.manufacture_date || item.expiry_date) && (
                      <div key={index} className="bg-white p-3 rounded border border-blue-100">
                        <h4 className="font-medium text-sm text-gray-800 mb-2">
                          {item.productName || item.product?.name || 'N/A'} - {item.size || item.variant?.name || 'N/A'}
                        </h4>
                        <div className="space-y-2 text-xs">
                          {item.batch_number && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Batch No:</span>
                              <span className="font-medium">{item.batch_number}</span>
                            </div>
                          )}
                          {item.manufacture_date && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Manufacture:</span>
                              <span className="font-medium">{formatDate(item.manufacture_date)}</span>
                            </div>
                          )}
                          {item.expiry_date && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Expiry:</span>
                              <span className="font-medium text-red-600">{formatDate(item.expiry_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FiDollarSign className="text-green-500" />
                Order Summary
              </h3>
              <div className="flex justify-end">
                <div className="w-full md:w-1/2 lg:w-1/3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <FiTag className="text-blue-500" />
                      Subtotal (Base):
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.subtotal || orderTotals.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <FiPercent className="text-red-500" />
                      Total Discount:
                    </span>
                    <span className="text-sm font-medium text-red-500">
                      -{formatCurrency(order.discountAmount || orderTotals.totalDiscount)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <FiTrendingUp className="text-green-500" />
                      Price After Discount:
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency((order.subtotal || orderTotals.subtotal) - (order.discountAmount || orderTotals.totalDiscount))}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <FiCreditCard className="text-green-500" />
                      Total GST:
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      +{formatCurrency(order.gstAmount || orderTotals.totalGST)}
                    </span>
                  </div>
                  {(order.transport_charges && parseFloat(order.transport_charges) > 0) && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <FiTruck className="text-purple-500" />
                        Shipping:
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          +{formatCurrency(order.transport_charges)}
                        </p>
                        <p className="text-xs text-red-500 font-bold">
                          Auto-deducted on delivery
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between py-3 mt-2 bg-gray-100 px-2 rounded">
                    <span className="text-sm font-bold text-gray-800">Grand Total</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(order.totalAmount || orderTotals.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            {(order.courier_name || order.tracking_number || (order.transport_charges && parseFloat(order.transport_charges) > 0) || order.expected_delivery_date) && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FiTruck className="text-green-500" />
                  Shipping Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.courier_name && (
                    <div>
                      <p className="text-xs text-gray-500">Courier Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {order.courier_name}
                      </p>
                    </div>
                  )}
                  {order.tracking_number && (
                    <div>
                      <p className="text-xs text-gray-500">Tracking Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {order.tracking_number}
                      </p>
                    </div>
                  )}
                  {order.transport_charges && parseFloat(order.transport_charges) > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">Transport Charges</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.transport_charges)}
                      </p>
                    </div>
                  )}
                  {order.expected_delivery_date && (
                    <div>
                      <p className="text-xs text-gray-500">Expected Delivery</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(order.expected_delivery_date)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FiClipboard className="text-blue-500" />
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.description || 'No description provided'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Note</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.note || 'No note provided'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Receipt</p>
                  {renderReceipt()}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default OrderDetailsModal;