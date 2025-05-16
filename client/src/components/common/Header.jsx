
import logo  from '../../assets/icons/ios.png';

const Header = () => {
  return (
    <div className="w-full fixed top-0 h-16 bg-white flex items-center justify-between px-6 lg:px-20 border-b border-[#E5E7EB] shadow-sm z-50">
  <img src={logo} alt="Logo" className="w-10 h-10" />
  
  <button className="btn btn-sm lg:btn-md text-white bg-[#4F46E5] hover:bg-indigo-700">
    Contact Admin
  </button>
</div>
  )
}

export default Header