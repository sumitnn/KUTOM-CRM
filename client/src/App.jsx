import { useState } from 'react'
import Login from './components/auths/Login'
import Admindashboard from './components/dashboard/Admindashboard'
import AuthHeader from './components/common/AuthHeader'

function App() {


  return (
    <>
      {/* <Login /> */}
       <AuthHeader />
      <Admindashboard /> 
      
    </>
  )
}

export default App
