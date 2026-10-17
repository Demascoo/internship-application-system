import React from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ArrowUp,
  Heart,
} from "lucide-react";

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-teal-900 text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-stick-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl animate-stick-float delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-400/5 rounded-full blur-3xl animate-stick-pulse"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="animate-stick-slide-in-left">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center animate-stick-wiggle">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">SSTA</h3>
                <p className="text-sm text-blue-200">Science & Technology</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Empowering the next generation of technology leaders through
              comprehensive internship programs and hands-on experience.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-blue-500 transition-all duration-300 hover-stick-bounce"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-blue-400 transition-all duration-300 hover-stick-bounce"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-blue-600 transition-all duration-300 hover-stick-bounce"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-pink-500 transition-all duration-300 hover-stick-bounce"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="animate-stick-slide-in-left delay-200">
            <h3 className="text-lg font-semibold mb-6 text-blue-200">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-white transition-colors duration-200 hover-stick-wiggle inline-block"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/programs"
                  className="text-gray-300 hover:text-white transition-colors duration-200 hover-stick-wiggle inline-block"
                >
                  Programs
                </Link>
              </li>
              <li>
                <Link
                  to="/auth"
                  className="text-gray-300 hover:text-white transition-colors duration-200 hover-stick-wiggle inline-block"
                >
                  Apply Now
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-300 hover:text-white transition-colors duration-200 hover-stick-wiggle inline-block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-300 hover:text-white transition-colors duration-200 hover-stick-wiggle inline-block"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Programs */}
          <div className="animate-stick-slide-in-right delay-400">
            <h3 className="text-lg font-semibold mb-6 text-teal-200">
              Programs
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/apply/networking"
                  className="text-gray-300 hover:text-white transition-colors duration-200 hover-stick-wiggle inline-block"
                >
                  Network Engineering
                </Link>
              </li>
              <li>
                <Link
                  to="/apply/software"
                  className="text-gray-300 hover:text-white transition-colors duration-200 hover-stick-wiggle inline-block"
                >
                  Software Development
                </Link>
              </li>
              <li>
                <Link
                  to="/apply/maintenance"
                  className="text-gray-300 hover:text-white transition-colors duration-200 hover-stick-wiggle inline-block"
                >
                  IT Maintenance & Support
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors duration-200 hover-stick-wiggle inline-block"
                >
                  Career Guidance
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors duration-200 hover-stick-wiggle inline-block"
                >
                  Mentorship
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="animate-stick-slide-in-right delay-600">
            <h3 className="text-lg font-semibold mb-6 text-orange-200">
              Contact Info
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin
                  className="text-orange-400 mt-1 animate-stick-bounce"
                  size={18}
                />
                <div>
                  <p className="text-gray-300">Hawassa, Sidama Region</p>
                  <p className="text-gray-300">Ethiopia</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone
                  className="text-orange-400 animate-stick-wiggle"
                  size={18}
                />
                <p className="text-gray-300">+251 46 220 4455</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail
                  className="text-orange-400 animate-stick-pulse"
                  size={18}
                />
                <p className="text-gray-300">info@ssta.gov.et</p>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3 text-orange-200">
                Stay Updated
              </h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent input-focus transition-all duration-200"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-r-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 hover-stick-pulse">
                  <Mail size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0 animate-stick-zoom-in">
            <p className="text-gray-400">
              © 2025 Sidama Innovation & Technology Agency. Made with
            </p>
            <Heart className="text-red-400 animate-stick-pulse" size={16} />
            <p className="text-gray-400">for innovation.</p>
          </div>

          <div className="flex items-center space-x-6 animate-stick-zoom-in delay-200">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors duration-200 hover-stick-wiggle"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors duration-200 hover-stick-wiggle"
            >
              Terms of Service
            </a>
            <button
              onClick={scrollToTop}
              className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center hover:from-blue-600 hover:to-teal-600 transition-all duration-200 hover-stick-bounce"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
