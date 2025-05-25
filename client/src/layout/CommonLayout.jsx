
import logo from "../assets/icons/fev.png"
const CommonLayout = ({ children }) => {


  return (
    <>
       <header className="w-full fixed top-0 h-16 bg-white flex items-center justify-between px-6 lg:px-20 border-b border-[#E5E7EB] shadow-sm z-50">
        <div className="flex justify-content-center items-center gap-3">
        <img src={logo} alt="Logo" className="w-12 h-10" /><span className="font-extrabold text-xl">StockTN</span>
  </div>
       
  
  <button className="btn btn-sm lg:btn-md text-white bg-[#4F46E5] hover:bg-indigo-700">
    Contact Admin
  </button>
</header>
          {children}
        
    </>
  );
};

export default CommonLayout;
