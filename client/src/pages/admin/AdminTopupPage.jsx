import React from 'react'
import { lazy, Suspense } from 'react'
import { BiMoney } from 'react-icons/bi'

// Lazy import for the table component
const TopUpRequestsTable = lazy(() => import('./TopUpRequestsTable'))

const AdminTopupPage = () => {
  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-8xl mx-auto">
        {/* Header Section with Enhanced Design */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                  <BiMoney className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Top-Up Requests
                  </h1>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                    Manage and verify user top-up transactions
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats Cards - You can make these dynamic based on API response */}
            <div className="flex gap-4">
              <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">12</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Today</div>
                <div className="text-2xl font-bold text-blue-600">5</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <Suspense fallback={
            <div className="flex justify-center items-center py-32">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          }>
            <TopUpRequestsTable />
          </Suspense>
        </div>
      </div>
    </section>
  )
}

export default AdminTopupPage