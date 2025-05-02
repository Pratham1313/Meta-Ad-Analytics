import { Routes, Route } from 'react-router-dom';
import Credentials from './pages/credentials.jsx';
import Navbar from '../src/components/navbar/navbar';
import Dashboard from './pages/dashboard';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/' element={<Credentials />} />
        <Route path='/analytics' element={<Dashboard />} />
      </Routes>
      <Toaster position="top-center" />
    </>
  )
}

export default App;
