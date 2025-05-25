import React, { useState } from "react";

const initialCartItems = [
  {
    id: "P-1001",
    name: "Wireless Headphones",
    price: 99.99,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1517059224940-d4af9eec41e1?auto=format&fit=crop&w=80&q=80",
  },
  {
    id: "P-1002",
    name: "Smartwatch",
    price: 149.99,
    quantity: 2,
    image:
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=80&q=80",
  },
  {
    id: "P-1003",
    name: "Portable Speaker",
    price: 59.99,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=80&q=80",
  },
];

const MyCart = () => {
  const [cartItems, setCartItems] = useState(initialCartItems);

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return; // minimum 1
    setCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity: newQty } : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-8">My Cart</h1>

        {cartItems.length === 0 ? (
          <p className="text-center text-gray-500 py-20 text-xl">
            Your cart is empty.
          </p>
        ) : (
          <>
            <div className="space-y-6">
              {cartItems.map(({ id, name, price, quantity, image }) => (
                <div
                  key={id}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b pb-4"
                >
                  <img
                    src={image}
                    alt={name}
                    className="w-20 h-20 rounded object-cover"
                  />
                  <div className="flex-grow">
                    <h2 className="text-lg font-semibold">{name}</h2>
                    <p className="text-gray-600">${price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(id, quantity - 1)}
                      className="btn btn-sm btn-outline"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) =>
                        updateQuantity(id, Number(e.target.value))
                      }
                      className="w-12 text-center border rounded"
                    />
                    <button
                      onClick={() => updateQuantity(id, quantity + 1)}
                      className="btn btn-sm btn-outline"
                    >
                      +
                    </button>
                  </div>
                  <div className="w-20 text-right font-semibold">
                    ${(price * quantity).toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeItem(id)}
                    className="btn btn-sm btn-error ml-4"
                    title="Remove item"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-between items-center">
              <p className="text-xl font-semibold">
                Total: ${totalPrice.toFixed(2)}
              </p>
              <button
                disabled={cartItems.length === 0}
                className="btn btn-primary px-6 py-2 text-lg"
                onClick={() => alert("Proceeding to checkout...")}
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyCart;
