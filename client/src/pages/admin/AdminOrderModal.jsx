const AdminOrderModal = ({ orders, isLoading, onClose }) => {
  return (
    <>
      <input type="checkbox" id="AdminOrderModal" className="modal-toggle" checked readOnly />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box relative max-w-3xl">
          <button
            className="btn btn-sm btn-circle absolute right-4 top-4"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
          <h3 className="text-xl font-bold mb-4">User Order History</h3>

          <div className="overflow-x-auto max-h-96">
            {isLoading ? (
              <p className="text-center py-4">Loading order history...</p>
            ) : (
              <table className="table w-full table-zebra">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price ($)</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-gray-500 py-4">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map(({ id, product, quantity, price, date }) => (
                      <tr key={id}>
                        <td>{id}</td>
                        <td>{product}</td>
                        <td>{quantity}</td>
                        <td>{price.toFixed(2)}</td>
                        <td>{date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOrderModal;