import { useState } from "react";
import {
  useGetTopupRequestQuery,
  useUpdateTopupRequestMutation,
} from "../../features/topupApi";
import { toast } from "react-toastify";

const rejectionReasons = [
  { value: "INVALID_SCREENSHOT", label: "Invalid Screenshot" },
  { value: "INVALID_AMOUNT", label: "Invalid Amount" },
  { value: "REJECTED", label: "Other Reason" },
];

const TopUpRequestsTable = () => {
  const {
    data: requests = [],
    isLoading,
    refetch,
    error,
    isError,
  } = useGetTopupRequestQuery() || {};

  const [updateTopupRequest, { isLoading: updating }] = useUpdateTopupRequestMutation();
  const [modalImage, setModalImage] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null });
  const [rejectedReason, setRejectedReason] = useState("");
  const [rejectedDescription, setRejectedDescription] = useState("");

  const defaultScreenshot = "https://via.placeholder.com/150?text=No+Image";

  const openModal = (imageUrl) => {
    setModalImage(imageUrl || defaultScreenshot);
    document.getElementById("screenshot_modal").showModal();
  };

  const downloadImage = (imageUrl) => {
    const link = document.createElement("a");
    link.href = imageUrl || defaultScreenshot;
    link.download = "screenshot.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApprove = async (topupid) => {
    try {
    
      await updateTopupRequest({ topupId: topupid, data: { status: "APPROVED" } }).unwrap();
      toast.success("Request approved successfully.");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve request.");
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectedReason) {
      toast.error("Please select a rejection reason.");
      return;
    }
    console.log(rejectedReason);
    console.log(rejectModal.requestId);

    try {
      await updateTopupRequest({
        topupId: rejectModal.requestId,
        data:{
          status: rejectedReason,
          rejected_reason: rejectedDescription
        }
       
      }).unwrap();
      toast.success("Request rejected.");
      setRejectModal({ open: false, requestId: null });
      setRejectedReason("");
      setRejectedDescription("");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject request.");
    }
  };

  return (
    <>
      <div className="overflow-x-auto bg-white shadow-md rounded-xl p-4">
        {isLoading ? (
          <div className="text-center py-10">Loading requests...</div>
        ) : isError ? (
          <div className="text-center text-red-500">Failed to load data</div>
        ) : (
          <table className="table w-full text-sm md:text-base">
            <thead>
              <tr className="bg-blue-100 text-blue-900">
                <th className="py-2 px-3">UserEmail</th>
                <th className="py-2 px-3">UserRole</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Screenshot</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-blue-50 transition duration-200 ease-in-out"
                >
                  <td className="py-2 px-3 font-medium text-gray-700">
                    {req.user}
                  </td>
                  <td className="py-2 px-3 text-indigo-700 font-semibold capitalize">
                    {req.role || "N/A"}
                  </td>
                  <td className="py-2 px-3 text-green-700 font-semibold">
                    ₹{req.amount}
                  </td>
                  <td className="py-2 px-3">
                    <img
                      src={req.screenshot || defaultScreenshot}
                      alt="UPI Screenshot"
                      className="w-12 h-12 object-cover rounded cursor-pointer border border-gray-300 hover:scale-105 transition"
                      onClick={() => openModal(req.screenshot)}
                    />
                  </td>
                  <td className="py-2 px-3 text-gray-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-3 flex gap-2 flex-wrap">
                    <button
                      className="btn btn-sm btn-success"
                      disabled={updating}
                      onClick={() => handleApprove(req.id)}
                    >
                      {updating ? "Processing..." : "Approve"}
                    </button>
                    <button
                      className="btn btn-sm btn-error"
                      disabled={updating}
                      onClick={() =>
                        setRejectModal({ open: true, requestId: req.id })
                      }
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Screenshot Preview Modal */}
      <dialog id="screenshot_modal" className="modal">
        <div className="modal-box max-w-3xl">
          <h3 className="font-bold text-lg mb-4">Screenshot Preview</h3>
          {modalImage && (
            <img
              src={modalImage}
              alt="Large Screenshot"
              className="w-full h-auto rounded-lg mb-4"
            />
          )}
          <div className="modal-action justify-between">
            <button
              className="btn btn-outline"
              onClick={() => downloadImage(modalImage)}
            >
              Download
            </button>
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>

      {/* Reject Modal */}
      {rejectModal.open && (
        <dialog id="reject_modal" className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">Reject Top-up Request</h3>

            <label className="block mb-2 text-sm font-medium text-gray-700">
              Select Reason:
            </label>
            <select
              className="select select-bordered w-full mb-4"
              value={rejectedReason}
              onChange={(e) => setRejectedReason(e.target.value)}
            >
              <option value="">-- Choose Reason --</option>
              {rejectionReasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>

            <label className="block mb-2 text-sm font-medium text-gray-700">
              Additional Description (optional):
            </label>
            <textarea
              className="textarea textarea-bordered w-full mb-4"
              rows={3}
              placeholder="Add any additional details..."
              value={rejectedDescription}
              onChange={(e) => setRejectedDescription(e.target.value)}
            />

            <div className="modal-action justify-between">
              <form method="dialog">
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setRejectModal({ open: false, requestId: null });
                    setRejectedReason("");
                    setRejectedDescription("");
                  }}
                >
                  Cancel
                </button>
              </form>
              <button
                className="btn btn-error"
                disabled={updating}
                onClick={handleRejectConfirm}
              >
                {updating ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};

export default TopUpRequestsTable;
