import { memo } from "react";
import { MdBusiness, MdStore, MdLocalShipping, MdSupportAgent } from "react-icons/md";

const BusinessCard = memo(({ icon: Icon, title, description, features }) => (
  <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
      <Icon className="text-3xl text-white" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center text-gray-700">
          <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
          {feature}
        </li>
      ))}
    </ul>
  </div>
));

const BusinessPage = () => {
  const businessModels = [
    {
      icon: MdStore,
      title: "For Vendors",
      description: "Complete vendor management system to streamline your operations and increase profitability.",
      features: [
        "Multi-location inventory management",
        "Automated purchase orders",
        "Vendor performance analytics",
        "Real-time stock alerts"
      ]
    },
    {
      icon: MdBusiness,
      title: "For Stockists",
      description: "Advanced tools for stockists to manage large inventories and distribution networks.",
      features: [
        "Bulk inventory management",
        "Distribution channel tracking",
        "Price management system",
        "Sales forecasting tools"
      ]
    },
    {
      icon: MdLocalShipping,
      title: "For Resellers",
      description: "Perfect solution for resellers to manage multiple suppliers and customer relationships.",
      features: [
        "Supplier management",
        "Customer relationship tools",
        "Profit margin tracking",
        "Order fulfillment automation"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
            Business <span className="text-indigo-600">Solutions</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Tailored solutions for different business models. Choose the perfect plan 
            that fits your operational needs and growth ambitions.
          </p>
        </div>

        {/* Business Models Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {businessModels.map((model, index) => (
            <BusinessCard
              key={index}
              icon={model.icon}
              title={model.title}
              description={model.description}
              features={model.features}
            />
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 sm:p-12 text-center text-white">
          <div className="max-w-2xl mx-auto">
            <MdSupportAgent className="text-5xl mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
              Join hundreds of successful businesses using StockTN to streamline their operations 
              and drive growth. Get started today with our specialized solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-indigo-600 hover:bg-gray-100 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                Apply Now
              </button>
              <button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-indigo-600 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPage;