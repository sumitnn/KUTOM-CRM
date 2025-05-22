import { useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

const ResellerMainLayout = ({ children }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      <Navbar />
      <div className="flex pt-20 px-2">
        <Sidebar expanded={expanded} setExpanded={setExpanded} />
        <main
          className={`transition-all duration-300 p-4 w-full min-h-screen bg-gray-50 ${
            expanded ? "ml-64" : "ml-16"
          }`}
        >
          {children}
        </main>
      </div>
    </>
  );
};

export default ResellerMainLayout;
