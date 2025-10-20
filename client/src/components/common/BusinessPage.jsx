import { memo } from "react";
import { MdBusiness, MdStore, MdLocalShipping, MdSupportAgent, MdGroups, MdTrendingUp, MdSecurity, MdPublic, MdStar, MdCheckCircle } from "react-icons/md";
import { useNavigate } from "react-router-dom";

// Floating animation keyframes
const floatingAnimation = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;

const BusinessCard = memo(({ icon: Icon, title, description, features, profitMargin, example, advantage }) => (
  <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-300"></div>
    
    <div className="relative z-10">
      <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300 shadow-md">
        <Icon className="text-2xl text-white" />
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors duration-300">{title}</h3>
      <p className="text-gray-600 mb-4 leading-relaxed text-base">{description}</p>
      
      {profitMargin && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 mb-4 border border-green-100 group-hover:border-green-200 transition-colors duration-300">
          <div className="flex items-center text-green-700 font-semibold text-sm">
            <MdTrendingUp className="mr-2 text-lg" />
            Avg Profit: <span className="ml-1 text-green-800">{profitMargin}</span>
          </div>
        </div>
      )}
      
      <ul className="space-y-2 mb-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 group-hover:bg-green-200 transition-colors duration-300 flex-shrink-0">
              <MdCheckCircle className="text-green-600 text-sm" />
            </div>
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      {example && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 mb-3 border border-blue-100 group-hover:border-blue-200 transition-colors duration-300">
          <p className="text-blue-800 text-sm italic">
            <span className="font-bold text-blue-900">📈 Example:</span> {example}
          </p>
        </div>
      )}
      
      {advantage && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100 group-hover:border-purple-200 transition-colors duration-300">
          <p className="text-purple-800 text-sm">
            <span className="font-bold text-purple-900">💡 Advantage:</span> {advantage}
          </p>
        </div>
      )}
    </div>
  </div>
));

const BusinessPage = () => {
  const navigate = useNavigate();
  
  const businessModels = [
    {
      icon: MdStore,
      title: "For Vendors",
      description: "Sell your products nationwide through verified stockists and resellers. Get access to large bulk orders and expand your brand reach.",
      features: [
        "Secure payments & logistics support",
        "Marketing and brand promotion",
        "Direct access to bulk orders",
        "Nationwide distribution network"
      ],
      profitMargin: "15% – 30%",
      example: "If your product sells at ₹100, you can earn an additional 20–30% profit through the StockTN distribution network."
    },
    {
      icon: MdBusiness,
      title: "For Stockists",
      description: "Purchase directly from multiple vendors in bulk and distribute to local resellers. Build your regional trading network.",
      features: [
        "Multiple brands at one place",
        "Warehousing & delivery management",
        "Regional trading network",
        "Consistent monthly income"
      ],
      profitMargin: "15% – 25%",
      advantage: "Get access to multiple brands at one place and become a key supplier in your district."
    },
    {
      icon: MdLocalShipping,
      title: "For Resellers",
      description: "Buy from StockTN stockists and sell directly to local customers. Start with low investment and no inventory risk.",
      features: [
        "Low investment startup",
        "No inventory risk",
        "Real-time order tracking",
        "Mobile business management"
      ],
      profitMargin: "10% – 30%",
      example: "Start reselling today and grow your income from your smartphone."
    }
  ];

  const companyStats = [
    { icon: MdBusiness, number: "150+", label: "Brands", color: "from-blue-500 to-cyan-500" },
    { icon: MdStore, number: "100+", label: "Vendors", color: "from-purple-500 to-pink-500" },
    { icon: MdGroups, number: "50+", label: "Stockists", color: "from-green-500 to-emerald-500" },
    { icon: MdPublic, number: "500+", label: "Resellers", color: "from-orange-500 to-red-500" },
    { icon: MdTrendingUp, number: "15-30%", label: "Avg Profit", color: "from-indigo-500 to-purple-500" },
    { icon: MdSecurity, number: "24/7", label: "Support", color: "from-teal-500 to-blue-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Add floating animation styles */}
      <style>{floatingAnimation}</style>
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm text-indigo-800 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-indigo-100 shadow-lg">
            <MdStar className="mr-2 text-yellow-500 text-lg" />
            Powered by Kotom Corporation
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
            About <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">StockTN</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            India's fastest-growing B2B marketplace connecting <span className="font-bold text-gray-900">Vendors, Stockists, and Resellers</span> under one powerful platform.
          </p>
        </div>

        {/* Our Story & Vision Section - Reduced Height */}
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-white mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[350px]">
            {/* Left Image Section */}
            <div className="relative flex items-center justify-center bg-gradient-to-br p-6">
              <img
                src="https://stocktn-bkt-1.s3.eu-north-1.amazonaws.com/frontend-images/4700b0d5-8d30-44a8-84e3-b3ba64d43a06.png"
                alt="Business Vision"
                className="w-full h-full object-contain animate-float"
                onError={(e) => {
                  e.target.src = "https://stocktn-bkt-1.s3.eu-north-1.amazonaws.com/frontend-images/4700b0d5-8d30-44a8-84e3-b3ba64d43a06.png";
                }}
              />
            </div>

            {/* Right Content Section */}
            <div className="p-6 sm:p-8 lg:p-10 flex items-center">
              <div className="max-w-xl">
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight">
                  Our <span className="text-indigo-600">Story</span> & <span className="text-purple-600">Vision</span>
                </h2>

                <div className="space-y-4 text-gray-700 leading-relaxed mb-6">
                  <p>
                    <strong className="text-gray-900">StockTN</strong> — powered by <strong className="text-gray-900">Kotom Corporation</strong> — is India's fastest-growing B2B marketplace connecting businesses in one powerful ecosystem.
                  </p>
                  <p>
                    We simplify business by enabling direct and transparent bulk trading across <strong className="text-gray-900">Grocery, FMCG, and Fashion</strong> categories.
                  </p>
                </div>

                {/* Mission & Vision Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                      <MdBusiness className="text-xl" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Our Mission</h3>
                    <p className="opacity-90 text-sm leading-relaxed">
                      Make business dreams simple through India's largest digital trading network.
                    </p>
                  </div>
                  <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                      <MdPublic className="text-xl text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-purple-900 mb-2">Our Vision</h3>
                    <p className="text-purple-700 text-sm leading-relaxed">
                      Every entrepreneur successful through innovation and collaboration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            Business <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Snapshot</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-8">
            Trusted by hundreds of businesses across India
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-16">
          {companyStats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg border border-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 shadow-md`}>
                <stat.icon className="text-xl text-white" />
              </div>
              <div className="text-2xl font-black text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors duration-300">{stat.number}</div>
              <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Business Solutions Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Business <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Opportunities</span>
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Choose your path to success with specialized solutions
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {businessModels.map((model, index) => (
              <BusinessCard
                key={index}
                icon={model.icon}
                title={model.title}
                description={model.description}
                features={model.features}
                profitMargin={model.profitMargin}
                example={model.example}
                advantage={model.advantage}
              />
            ))}
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-2xl font-black text-gray-900 mb-6">Benefits for Customers</h3>
            <div className="space-y-4">
              {[
                "Thousands of genuine products from trusted vendors",
                "Competitive pricing, fast delivery, and verified resellers",
                "From groceries to fashion — everything under one roof"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center text-gray-700 group">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-green-200 group-hover:scale-105 transition-all duration-300 flex-shrink-0">
                    <MdCheckCircle className="text-green-600 text-lg" />
                  </div>
                  <span className="text-base font-medium">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-white rounded-xl border border-green-100 shadow-md">
              <p className="text-green-900 font-black text-lg text-center">
                🛒 "Buy smarter, save more — with StockTN"
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <h3 className="text-2xl font-black text-gray-900 mb-6">Platform Overview</h3>
            <div className="space-y-3 text-base text-gray-700">
              {[
                { icon: "📦", label: "Products", value: "150+" },
                { icon: "🏭", label: "Vendors", value: "100+" },
                { icon: "🏢", label: "Stockists", value: "50+" },
                { icon: "🛍️", label: "Resellers", value: "500+" },
                { icon: "💰", label: "Average Profit", value: "15% – 30%" },
                { icon: "🌍", label: "Business Type", value: "B2B Network" }
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-blue-100 last:border-b-0">
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{item.icon}</span>
                    <span className="font-semibold text-gray-900">{item.label}:</span>
                  </div>
                  <span className="font-black text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section - Reduced Height */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 sm:p-10 text-center text-white relative overflow-hidden shadow-xl mb-8">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <MdSupportAgent className="text-2xl text-white" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black mb-4 leading-tight">
              Join India's Fastest Growing B2B Network!
            </h2>
            
            <p className="text-lg text-indigo-100 mb-6 leading-relaxed max-w-2xl mx-auto">
              Register as a <strong className="text-white">Vendor, Stockist, or Reseller</strong> and grow your business digitally.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <button
                onClick={() => navigate("/login")}
                className="bg-white text-indigo-600 hover:bg-gray-100 font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-base min-w-[160px] cursor-pointer"
              >
                Login Now
              </button>
              <button
                onClick={() => navigate("/contact-us")}
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-indigo-600 font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-base min-w-[160px] cursor-pointer"
              >
                Contact Sales
              </button>
            </div>
            
            <p className="text-indigo-200 text-lg font-bold">
              🚀 Start your journey today!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPage;