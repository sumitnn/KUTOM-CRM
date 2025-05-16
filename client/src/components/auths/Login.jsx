import React from 'react'
import Header from '../common/Header'


const Login = () => {
  return (
      <>
          <Header />
          <div className="w-full h-screen flex items-center justify-center bg-[#E5E7EB]">
  <div className="w-full max-w-md p-10 bg-white rounded-xl shadow-xl flex flex-col items-center gap-6">
    
    <div className="text-center">
      <h1 className="text-4xl font-extrabold">Welcome Back</h1>
      <p className="text-[#4B5563] text-sm mt-2">Please sign in to your account</p>
    </div>

    <form className="w-full flex flex-col items-center gap-5">
      <input
        type="email"
        placeholder="Email"
        className="w-full h-12 border border-gray-300 rounded-md px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full h-12 border border-gray-300 rounded-md px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="flex justify-between items-center w-full text-sm text-gray-600">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="w-4 h-4" />
          Remember me
        </label>
        <a href="#" className="text-indigo-600 hover:underline">
          Forgot Password?
        </a>
      </div>

      <button
        type="submit"
        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium"
      >
        Login
      </button>
    </form>
  </div>
</div>

      </>
  )
}

export default Login