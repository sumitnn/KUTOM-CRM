const TopUpRequestsTable = () => {
    const requests = [
      {
        id: 1,
        user: "Stockist X",
        amount: 2500,
        date: "2025-05-18",
        screenshot: "https://via.placeholder.com/100",
      },
    ];
  
    return (
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Screenshot</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.user}</td>
                <td>₹{req.amount}</td>
                <td>{req.date}</td>
                <td>
                  <a href={req.screenshot} target="_blank" rel="noopener noreferrer">
                    <img src={req.screenshot} alt="UPI Screenshot" className="w-16 h-16 object-cover rounded" />
                  </a>
                </td>
                <td className="flex gap-2">
                  <button className="btn btn-sm btn-success">Approve</button>
                  <button className="btn btn-sm btn-error">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default TopUpRequestsTable;
  