import { memo } from "react";
import { Link } from "react-router-dom";
import { MdTrendingUp, MdInventory, MdAnalytics, MdSecurity } from "react-icons/md";

const FeatureCard = memo(({ icon: Icon, title, description }) => (
  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
      <Icon className="text-2xl text-indigo-600" />
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
));

const HomePage = () => {
  const features = [
    {
      icon: MdTrendingUp,
      title: "Real-time Analytics",
      description: "Get instant insights into your stock levels, sales performance, and business growth with live analytics."
    },
    {
      icon: MdInventory,
      title: "Smart Inventory",
      description: "Automated stock tracking and intelligent alerts to never run out of popular products again."
    },
    {
      icon: MdAnalytics,
      title: "Sales Reports",
      description: "Comprehensive sales reports and forecasting tools to make data-driven business decisions."
    },
    {
      icon: MdSecurity,
      title: "Secure & Reliable",
      description: "Bank-grade security ensuring your business data is always protected and accessible."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Streamline Your
              <span className="text-indigo-600 block">Stock Management</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Powerful, intuitive stock management solution designed for vendors, 
              stockists, and resellers. Boost efficiency and grow your business.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
              <Link
                to="/business"
                className="inline-flex items-center px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-xl shadow-lg hover:shadow-xl border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
              Why Choose StockTN?
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Everything you need to manage your inventory efficiently and scale your business
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;