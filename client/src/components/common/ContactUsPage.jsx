import { memo, useState } from "react";
import { motion } from "framer-motion";
import { 
  MdEmail, 
  MdPhone, 
  MdLocationOn, 
  MdSend,
  MdBusiness,
  MdStore,
  MdShoppingCart,
  MdPerson,
  MdArrowForward
} from "react-icons/md";
import { FaSpinner } from "react-icons/fa";
import {
  useSendContactMessageMutation,
} from "../../features/dashboardApi";

// Animation variants (keep your existing variants)
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const InputField = memo(({ 
  id, 
  name, 
  value, 
  onChange, 
  placeholder, 
  error, 
  icon: Icon, 
  type = "text",
  ...props 
}) => {
  return (
    <motion.div variants={fadeInUp}>
      <label
        htmlFor={id}
        className="block text-sm font-bold text-gray-700 mb-2"
      >
        {placeholder}
      </label>
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400 font-bold" />
          </div>
        )}
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={`block w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-4 border-2 ${
            error
              ? "border-red-300 focus:ring-indigo-500 focus:border-blue-500 focus:ring-4"
              : "border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          } rounded-xl shadow-sm focus:ring-opacity-20 transition-all duration-300 hover:border-gray-300`}
          placeholder={placeholder}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
      )}
    </motion.div>
  );
});

const ContactCard = memo(({ icon: Icon, title, content, link, delay = 0 }) => (
  <motion.div
    variants={fadeInUp}
    transition={{ delay }}
    whileHover={{ scale: 1.05, y: -5 }}
    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
  >
    <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
      <Icon className="text-2xl text-white" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    {link ? (
      <a 
        href={link} 
        className="text-indigo-600 hover:text-indigo-700 font-medium text-lg transition-all duration-300 group-hover:underline"
      >
        {content}
      </a>
    ) : (
      <p className="text-gray-700 text-lg font-medium">{content}</p>
    )}
  </motion.div>
));

const RoleCard = memo(({ 
  icon: Icon, 
  title, 
  description, 
  buttonText, 
  delay = 0, 
  gradient,
  onRegister,
  isSubmitting 
}) => (
  <motion.div
    variants={fadeInUp}
    transition={{ delay }}
    whileHover={{ scale: 1.02, y: -5 }}
    className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
  >
    <div className={`w-16 h-16 ${gradient} rounded-2xl flex items-center justify-center mb-6`}>
      <Icon className="text-3xl text-white" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-600 leading-relaxed text-lg mb-6">{description}</p>
    <button 
      onClick={onRegister}
      disabled={isSubmitting}
      className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isSubmitting ? (
        <>
          <FaSpinner className="animate-spin" />
          Registering...
        </>
      ) : (
        <>
          {buttonText} <MdArrowForward className="text-xl" />
        </>
      )}
    </button>
  </motion.div>
));

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState("");
  const [registrationMessage, setRegistrationMessage] = useState("");

  // RTK Query mutations
  const [sendContactMessage, { isLoading: isSubmittingContact }] = useSendContactMessageMutation();


  const contactMethods = [
    {
      icon: MdEmail,
      title: "Email Us",
      content: "stocktn.com@gmail.com",
      link: "mailto:stocktn.com@gmail.com",
      delay: 0.1
    },
    {
      icon: MdPhone,
      title: "Call Us",
      content: "+91 9270301020",
      link: "tel:+919270301020",
      delay: 0.2
    },
    {
      icon: MdLocationOn,
      title: "Office",
      content: "Savedi,Ahilyanagar, Maharashtra-414003 India",
      link: null,
      delay: 0.3
    }
  ];


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message should be at least 10 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const result = await sendContactMessage(formData).unwrap();
        setSubmitMessage("Thank you for your message! We'll get back to you within 24 hours.");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } catch (error) {
        setSubmitMessage("Sorry, there was an error sending your message. Please try again later.");
        console.error('Error sending message:', error);
      }
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
      {/* Header Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6"
          >
            Get In <span className="text-indigo-600">Touchs</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </motion.p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Information */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              variants={staggerContainer}
              viewport={{ once: true, threshold: 0.2 }}
            >
              <motion.h2 variants={fadeInUp} className="text-4xl font-bold text-gray-900 mb-8">
                Contact Information
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-gray-600 mb-8 text-lg leading-relaxed">
                Reach out to us through any of the following channels. Our team is always ready 
                to help you with your business growth needs.
              </motion.p>
              
              <div className="space-y-6">
                {contactMethods.map((method, index) => (
                  <ContactCard
                    key={index}
                    icon={method.icon}
                    title={method.title}
                    content={method.content}
                    link={method.link}
                    delay={method.delay}
                  />
                ))}
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, threshold: 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              
              {submitMessage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`${
                    submitMessage.includes('error') 
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-green-50 border-green-200 text-green-700'
                  } border rounded-xl p-4 mb-6`}
                >
                  <p className="text-center font-medium">{submitMessage}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InputField
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    error={errors.name}
                    icon={MdPerson}
                  />
                  
                  <InputField
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your Email"
                    error={errors.email}
                    icon={MdEmail}
                  />
                </div>

                <InputField
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Subject"
                  error={errors.subject}
                  icon={MdEmail}
                />

                <motion.div variants={fadeInUp}>
                  <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="6"
                    className={`block w-full px-4 py-4 border-2 ${
                      errors.message
                        ? "border-red-300 focus:ring-4 focus:ring-indigo-500 focus:border-blue-500"
                        : "border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-blue-500"
                    } rounded-xl shadow-sm focus:ring-opacity-20 transition-all duration-300 resize-none hover:border-gray-300`}
                    placeholder="Tell us how we can help you..."
                  />
                  {errors.message && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.message}</p>
                  )}
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={isSubmittingContact}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex cursor-pointer justify-center items-center bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmittingContact ? (
                    <>
                      <FaSpinner className="animate-spin mr-3 text-xl" />
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <MdSend className="mr-3 text-xl" />
                      Send Message
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Join Now Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={staggerContainer}
            viewport={{ once: true, threshold: 0.2 }}
            className="text-center mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6"
            >
              Join StockTN Today!
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8"
            >
              Be part of India's most trusted B2B e-commerce platform.<br />
              Register now as a Vendor, Stockist, or Reseller and take your business online.
            </motion.p>
            
            {registrationMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-600 text-white rounded-xl p-4 max-w-2xl mx-auto mb-6"
              >
                <p className="text-lg font-medium">{registrationMessage}</p>
              </motion.div>
            )}
          </motion.div>

          

          {/* Footer Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, threshold: 0.2 }}
            className="text-center border-t border-gray-700 pt-8"
          >
            <p className="text-gray-400 text-lg">
              Powered by <span className="text-orange-500 font-bold">Kotom Corporation</span> – 
              <span className="text-white font-medium"> Make a Dream Easy</span>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ContactUsPage;