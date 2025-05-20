const WalletTransactionTable = () => {
    const transactions = [
      { id: 1, user: "Vendor A", amount: 5000, type: "Credit", date: "2025-05-15" },
      { id: 2, user: "Stockist B", amount: -3000, type: "Debit", date: "2025-05-14" },
    ];
  
    return (
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.user}</td>
                <td className={tx.amount > 0 ? "text-green-600" : "text-red-600"}>
                  ₹{Math.abs(tx.amount)}
                </td>
                <td>{tx.type}</td>
                <td>{tx.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default WalletTransactionTable;
  