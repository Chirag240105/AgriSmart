import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Signup from './components/pages/auth/Signup'
import Login from './components/pages/auth/Login'
import Home from './components/pages/Home/Home'

const App = () => {
  return (
    <BrowserRouter>
        <Routes>
          <Route path='/signup' element={<Signup/>}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/' element={<Home/>}/>
        </Routes>
    </BrowserRouter>
     
    
  )
}

export default App
