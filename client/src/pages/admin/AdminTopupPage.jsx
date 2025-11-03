import React from 'react'
import { lazy, Suspense } from 'react'

// Lazy import for the table component
const TopUpRequestsTable = lazy(() => import('./TopUpRequestsTable'))

const AdminTopupPage = () => {
  return (
    <section className="py-4">
      <div className="max-w-8xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
            💸 Top-Up Requests
          </h2>
          <p className="text-sm lg:text-base text-gray-600 max-w-2xl mx-auto">
            Review and manage wallet top-up requests securely. Approve or reject requests after verifying payment details.
          </p>
        </div>
        
        <Suspense fallback={
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        }>
          <TopUpRequestsTable />
        </Suspense>
      </div>
    </section>
  )
}

export default AdminTopupPage