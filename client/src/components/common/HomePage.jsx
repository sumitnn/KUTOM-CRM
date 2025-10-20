import { memo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useAnimation } from "framer-motion";
import { 
  MdTrendingUp, 
  MdInventory, 
  MdAnalytics, 
  MdSecurity,
  MdStore,
  MdLocalShipping,
  MdShoppingCart,
  MdPeople,
  MdAttachMoney,
  MdVerified,
  MdBusiness,
  MdArrowForward
} from "react-icons/md";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

const slideInRight = {
  hidden: { opacity: 0, x: 100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

// Feature Card Component
const FeatureCard = memo(({ icon: Icon, title, description, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.2 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={itemVariants}
      transition={{ delay }}
      className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
    >
      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="text-2xl text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-lg">{description}</p>
    </motion.div>
  );
});

// Business Opportunity Card
const BusinessCard = memo(({ icon: Icon, title, description, profitMargin, example, buttonText, delay = 0, gradient }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.2 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={scaleUp}
      transition={{ delay }}
      className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
    >
      <div className={`w-20 h-20 ${gradient} rounded-2xl flex items-center justify-center mb-6`}>
        <Icon className="text-3xl text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-lg mb-4">{description}</p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <p className="text-green-800 font-semibold text-lg">Profit Margin: {profitMargin}</p>
        {example && <p className="text-green-700 mt-2 text-sm">{example}</p>}
      </div>
      <button className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
        {buttonText} 
      </button>
    </motion.div>
  );
});

// Stat Counter Component
const StatCounter = memo(({ number, label, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.2 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={itemVariants}
      transition={{ delay }}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
        {number}+
      </div>
      <div className="text-gray-600 text-lg">{label}</div>
    </motion.div>
  );
});

// Animated Workflow Step
const WorkflowStep = memo(({ step, index, icon: Icon, description }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.2 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={itemVariants}
      transition={{ delay: index * 0.2 }}
      className="text-center"
    >
      <div className="bg-indigo-100 rounded-2xl p-6 mb-4">
        <Icon className="text-4xl text-indigo-600 mx-auto" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{step}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
});

const HomePage = () => {
  const workflowRef = useRef(null);
  const isWorkflowInView = useInView(workflowRef, { once: true, threshold: 0.2 });

  const businessOpportunities = [
    {
      icon: MdBusiness,
      title: "For Vendors",
      description: "Sell your products nationwide with trusted stockists and resellers. Bulk order sales with secure payments and logistics support.",
      profitMargin: "15% – 30%",
      example: "Sell at ₹100, earn up to ₹130 through network reselling",
      buttonText: "Become a Vendor",
      gradient: "bg-gradient-to-r from-blue-500 to-cyan-500"
    },
    {
      icon: MdStore,
      title: "For Stockists",
      description: "Become a regional distributor and earn consistent income. Purchase in bulk directly from verified vendors.",
      profitMargin: "15% – 25%",
      example: "Multiple brands, one platform — become a key local supplier",
      buttonText: "Become a Stockist",
      gradient: "bg-gradient-to-r from-green-500 to-emerald-500"
    },
    {
      icon: MdShoppingCart,
      title: "For Resellers",
      description: "Start your own business with low investment and no inventory risk. Buy small quantities from stockists.",
      profitMargin: "10% – 30%",
      example: "Start reselling today — earn profits from your phone!",
      buttonText: "Become a Reseller",
      gradient: "bg-gradient-to-r from-orange-500 to-red-500"
    }
  ];

  const stats = [
    { number: "100", label: "Vendors" },
    { number: "50", label: "Stockists" },
    { number: "500", label: "Resellers" },
    { number: "150", label: "Products" }
  ];

  const benefits = [
    { icon: MdVerified, text: "Wide product range — Grocery, FMCG, Fashion & more" },
    { icon: MdAttachMoney, text: "Affordable pricing and fast delivery" },
    { icon: MdSecurity, text: "Trusted resellers and verified suppliers" },
    { icon: MdStore, text: "One platform, thousands of options" }
  ];

  const workflowSteps = [
    {
      step: "Vendors",
      icon: MdBusiness,
      description: "Upload products and sell in bulk to verified stockists nationwide."
    },
    {
      step: "Stockists",
      icon: MdStore,
      description: "Buy wholesale and supply regionally to local resellers."
    },
    {
      step: "Resellers",
      icon: MdShoppingCart,
      description: "Sell to customers locally or online with minimal investment."
    },
    {
      step: "Customers",
      icon: MdPeople,
      description: "Get access to trusted, affordable products with fast delivery."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple to-indigo-50">
      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={slideInLeft}
              className="text-left"
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
                StockTN
                <motion.span 
                  className="text-indigo-600 block text-3xl sm:text-4xl lg:text-5xl mt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Make a Dream Easy
                </motion.span>
              </h1>
              <motion.p 
                className="mt-6 text-xl text-gray-600 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                India's Fastest-Growing B2B Marketplace Connecting Vendors, Stockists & Resellers.
              </motion.p>
              <motion.p 
                className="mt-4 text-lg text-gray-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Grow Your Business. Multiply Your Profits.
              </motion.p>
              <motion.div 
                className="mt-10 flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Link
                  to="#"
                  className="inline-flex items-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  🏭 Become a Vendor
                </Link>
                <Link
                  to="#"
                  className="inline-flex items-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  🏢 Become a Stockist
                </Link>
                <Link
                  to="#"
                  className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  🛍️ Become a Reseller
                </Link>
              </motion.div>
            </motion.div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={slideInRight}
              className="relative"
            >
              <div className="  ">
                <img 
                  src="https://stocktn-bkt-1.s3.eu-north-1.amazonaws.com/frontend-images/undraw_groceries_4via.svg" 
                  alt="StockTN Business Network"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" ref={workflowRef}>
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={isWorkflowInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              How StockTN Works
            </h2>
            <motion.div 
              className="flex justify-center items-center space-x-4 sm:space-x-8 mb-8 flex-wrap"
              initial="hidden"
              animate={isWorkflowInView ? "visible" : "hidden"}
              variants={containerVariants}
            >
              {['Vendor','Admin', 'Stockist', 'Reseller'].map((step, index) => (
                <motion.div 
                  key={step} 
                  className="flex items-center" 
                  variants={itemVariants}
                  transition={{ delay: index * 0.2 }}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
                      {index + 1}
                    </div>
                    <span className="text-lg font-semibold text-gray-800">{step}</span>
                  </div>
                  {index < 3 && (
                    <div className="w-8 h-1 bg-orange-500 mx-2 sm:mx-4 hidden sm:block"></div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            animate={isWorkflowInView ? "visible" : "hidden"}
            variants={containerVariants}
          >
            {workflowSteps.map((step, index) => (
              <WorkflowStep
                key={index}
                step={step.step}
                index={index}
                icon={step.icon}
                description={step.description}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Business Opportunities */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, threshold: 0.2 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Business Opportunities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join India's fastest-growing B2B marketplace and unlock new revenue streams
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true, threshold: 0.2 }}
          >
            {businessOpportunities.map((opportunity, index) => (
              <BusinessCard
                key={index}
                {...opportunity}
                delay={index * 0.2}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, threshold: 0.2 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Our Growing Network
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of businesses already growing with StockTN
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
            initial="hidden"
            whileInView="visible"
            variants={containerVariants}
            viewport={{ once: true, threshold: 0.2 }}
          >
            {stats.map((stat, index) => (
              <StatCounter
                key={index}
                number={stat.number}
                label={stat.label}
                delay={index * 0.15}
              />
            ))}
          </motion.div>

          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, threshold: 0.2 }}
          >
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-8 text-white">
              <p className="text-2xl font-bold mb-4">Average Profit Margin</p>
              <p className="text-4xl font-bold">15% – 30%</p>
              <p className="text-lg mt-2 opacity-90">B2B Corporate Trading Network</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Customer Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 ">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={slideInLeft}
              viewport={{ once: true, threshold: 0.2 }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Why Customers Love StockTN
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center gap-4"
                    variants={itemVariants}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="text-2xl text-white" />
                    </div>
                    <p className="text-lg text-gray-700">{benefit.text}</p>
                  </motion.div>
                ))}
              </div>
              <motion.div 
                className="mt-8 p-6 bg-white rounded-2xl shadow-lg"
                variants={itemVariants}
                transition={{ delay: 0.4 }}
              >
                <p className="text-2xl font-bold text-gray-900 text-center">
                  🛍️ "Buy smarter, save more — with StockTN.com"
                </p>
              </motion.div>
            </motion.div>
            
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={slideInRight}
              viewport={{ once: true, threshold: 0.2 }}
              className="relative"
            >
              <img 
                src="https://stocktn-bkt-1.s3.eu-north-1.amazonaws.com/frontend-images/undraw_reviews_ukai.svg" 
                alt="Happy Customers"
                className=" w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, threshold: 0.2 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to Grow Your Business?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              From startup sellers to established distributors — everyone grows with StockTN
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Start Your Journey
              </Link>
              <Link
                to="/contact-us"
                className="inline-flex items-center px-8 py-4 bg-transparent hover:bg-gray-800 text-white font-bold rounded-xl border-2 border-white transition-all duration-300"
              >
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;