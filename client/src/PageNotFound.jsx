import { Link } from "react-router-dom";

const PageNotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Modern Card Design */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden">
          {/* Decorative Header */}
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 p-8 text-center relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-white rounded-full blur-xl"></div>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-white rounded-full blur-xl"></div>
            </div>
            
            {/* Main 404 Display */}
            <div className="relative">
              <div className="text-8xl font-black text-white mb-4 tracking-tighter">
                404
              </div>
              <div className="w-24 h-2 bg-white/50 rounded-full mx-auto mb-6"></div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Page Not Found
              </h1>
              <p className="text-blue-100 text-lg font-medium">
                Oops! Looks like you're lost in space
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-12">
            {/* Illustration/Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-inner">
                  <svg 
                    className="w-12 h-12 text-blue-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Lost your way?
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed max-w-md mx-auto">
                The page you're looking for doesn't exist or has been moved. 
                Let's get you back on track.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-600/25 transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go Back Home
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Previous Page
              </button>
            </div>

          
          
          </div>

          {/* Decorative Footer */}
          <div className="bg-slate-50/50 border-t border-slate-100 p-4">
            <div className="flex items-center justify-center gap-6 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>StockTN </span>
              </div>
              <div className="hidden sm:block">•</div>
              <div>Error 404 - Page Not Found</div>
            </div>
          </div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;