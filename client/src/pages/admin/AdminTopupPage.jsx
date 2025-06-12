import React from 'react'
import TopUpRequestsTable from './TopUpRequestsTable'

const AdminTopupPage = () => {
  return (
    <section className=" p-5">
    <h2 className="text-2xl font-bold text-center text-gray-700 mb-2">💸 Top-Up Requests (via UPI)</h2>
    <p className="text-sm font-bold text-center text-gray-500 mb-4">Review and manage wallet top-up requests securely.</p>
    <TopUpRequestsTable />
  </section>
  )
}

export default AdminTopupPage