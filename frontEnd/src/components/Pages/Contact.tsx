import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  User,
  Building,
} from "lucide-react";

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    inquiryType: "general",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        inquiryType: "general",
      });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Us",
      details: ["Hawassa, Sidama Region", "Ethiopia"],
      color: "from-blue-500 to-teal-500",
    },
    {
      icon: Phone,
      title: "Call Us",
      details: ["+251 46 220 4455", "+251 91 234 5678"],
      color: "from-teal-500 to-green-500",
    },
    {
      icon: Mail,
      title: "Email Us",
      details: ["info@ssta.gov.et", "admissions@ssta.gov.et"],
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Clock,
      title: "Office Hours",
      details: [
        "Mon - Fri: Morning 2:00 pM - 6:00 PM",
        "Afternoon : 7:30 PM - 11:15 PM",
      ],
      color: "from-purple-500 to-pink-500",
    },
  ];

  const departments = [
    {
      icon: User,
      name: "Admissions",
      email: "admissions@ssta.gov.et",
      phone: "+251 46 220 4455",
      description: "Program applications and enrollment inquiries",
    },
    {
      icon: Building,
      name: "General Information",
      email: "info@ssta.gov.et",
      phone: "+251 46 220 4456",
      description: "General questions and information requests",
    },
    {
      icon: MessageSquare,
      name: "Student Support",
      email: "support@ssta.gov.et",
      phone: "+251 46 220 4457",
      description: "Current student assistance and guidance",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?auto=compress&cs=tinysrgb&w=1600')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-purple-900/85 to-teal-800/90"></div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-stick-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl animate-stick-float delay-1000"></div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl animate-stick-pulse delay-600"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-orange-400/10 rounded-full blur-2xl animate-stick-bounce delay-800"></div>
        </div>

        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="animate-stick-zoom-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Get In
              </span>
              <br />
              <span className="bg-gradient-to-r from-teal-200 to-white bg-clip-text text-transparent">
                Touch
              </span>
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-purple-100 mb-8 animate-stick-slide-in-left delay-400">
            We're here to help you start your journey in technology. Reach out
            to us anytime!
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-stick-slide-in-right delay-800">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20 hover-stick-pulse">
              <Mail className="w-6 h-6 mb-2 mx-auto" />
              <p className="text-sm text-purple-200">Email Support</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20 hover-stick-pulse">
              <Phone className="w-6 h-6 mb-2 mx-auto" />
              <p className="text-sm text-purple-200">Phone Support</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20 hover-stick-pulse">
              <MessageSquare className="w-6 h-6 mb-2 mx-auto" />
              <p className="text-sm text-purple-200">Telegram</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-stick-zoom-in">
              Contact{" "}
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Information
              </span>
            </h2>
            <p className="text-xl text-gray-600 animate-stick-slide-in-left delay-400">
              Multiple ways to reach us - choose what works best for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className={`group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-stick-zoom-in delay-${
                  (index + 1) * 200
                } border border-gray-100 hover:border-transparent`}
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${info.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 animate-stick-wiggle`}
                >
                  <info.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {info.title}
                </h3>
                <div className="space-y-2">
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-600">
                      {detail}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="animate-stick-slide-in-left">
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Send us a{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                    Message
                  </span>
                </h3>

                {submitted ? (
                  <div className="text-center py-12 animate-stick-zoom-in">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-stick-bounce">
                      <Send className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-4">
                      Message Sent!
                    </h4>
                    <p className="text-gray-600">
                      Thank you for contacting us. We'll get back to you within
                      24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-group">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400"
                          placeholder="Your full name"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400"
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Inquiry Type
                      </label>
                      <select
                        name="inquiryType"
                        value={formData.inquiryType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400"
                      >
                        <option value="general">General Information</option>
                        <option value="admissions">Program Admissions</option>
                        <option value="support">Student Support</option>
                        <option value="partnership">
                          Partnership Opportunities
                        </option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400"
                        placeholder="Brief subject of your message"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400"
                        placeholder="Tell us how we can help you..."
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover-stick-bounce flex items-center justify-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Location & Additional Info */}
            <div className="animate-stick-slide-in-right delay-400">
              <div className="bg-white p-8 rounded-2xl shadow-xl mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Visit Our{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                    Campus
                  </span>
                </h3>

                <div className="aspect-w-16 aspect-h-9 mb-6">
                  <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-stick-bounce" />
                      <p className="text-gray-600">
                        Interactive Map Coming Soon
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Hawassa, Sidama Region, Ethiopia
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Address</h4>
                      <p className="text-gray-600">
                        Hawassa Technology Park
                        <br />
                        Sidama Region, Ethiopia
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Campus Hours
                      </h4>
                      <p className="text-gray-600">
                        Monday - Friday: 8:00 AM - 6:00 PM
                        <br />
                        Saturday: 9:00 AM - 2:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Contacts */}
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Department{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                    Contacts
                  </span>
                </h3>

                <div className="space-y-6">
                  {departments.map((dept, index) => (
                    <div
                      key={index}
                      className={`flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:shadow-md transition-all duration-300 animate-stick-slide-in-right delay-${
                        (index + 1) * 200
                      }`}
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <dept.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {dept.name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {dept.description}
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm text-blue-600 font-medium">
                            {dept.email}
                          </p>
                          <p className="text-sm text-teal-600 font-medium">
                            {dept.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-stick-zoom-in">
              Frequently Asked{" "}
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <p className="text-xl text-gray-600 animate-stick-slide-in-left delay-400">
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "How do I apply for an internship program?",
                answer:
                  "You can apply by browsing our available programs and clicking the 'Apply Now' button. You'll need to create an account and complete the application form with your details and motivation.",
              },
              {
                question: "What are the program requirements?",
                answer:
                  "Requirements vary by program but generally include basic technical knowledge, relevant educational background, and strong motivation to learn. Specific requirements are listed on each program page.",
              },
              {
                question: "How long do the programs last?",
                answer:
                  "Our programs range from 4 to 6 months, depending on the specialization. Each program includes hands-on projects, mentorship, and career development activities.",
              },
              {
                question: "Is there any cost for the programs?",
                answer:
                  "Our internship programs are completely free for accepted students. We also provide resources, mentorship, and career placement assistance at no cost.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className={`bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 animate-stick-slide-in-left delay-${
                  (index + 1) * 200
                }`}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
