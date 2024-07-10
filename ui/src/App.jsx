import Navbar from './components/navbar'
import Section from './components/section'
import Footer from './components/footer'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {

  return (
    <>
        <Navbar/>
        <Section/>
        <Footer/>  
        <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                />
        <ToastContainer />  
    </>
  )
}

export default App
