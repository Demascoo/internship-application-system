import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Award, Clock, ChevronDown } from "lucide-react";
import ProgramCard from "../Common/ProgramCard";
import { useApp } from "../../contexts/AppContext";
// import homeImage from "./home.png";
import aboutImage from "./about.png";

const LandingPage: React.FC = () => {
  const { programs } = useApp();

  const scrollToPrograms = () => {
    document.getElementById("programs")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 text-white">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed opacity-60" // increased visibility
          style={{
            backgroundImage: `url(${aboutImage})`,
          }}
        />
        {/* Keep overlays but lighter */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-teal-600/20"></div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/30 rounded-full blur-3xl animate-stick-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-400/30 rounded-full blur-3xl animate-stick-float delay-1000"></div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl animate-stick-pulse delay-600"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-orange-400/20 rounded-full blur-2xl animate-stick-bounce delay-800"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-8 animate-stick-zoom-in">
              <Award className="w-4 h-4 mr-2" />
              Professional Internship Programs
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-stick-slide-in-left">
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Sidama Innovation &
              </span>
              <br />
              <span className="bg-gradient-to-r from-teal-200 to-white bg-clip-text text-transparent animate-stick-slide-in-right delay-400">
                Technology Agency
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed animate-stick-zoom-in delay-600">
              Launch your career in technology with hands-on experience in our
              cutting-edge internship programs. Join Ethiopia's leading science
              and technology innovation hub.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-stick-slide-in-left delay-800">
              <Link
                to="/programs"
                className="group bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 hover-stick-bounce"
              >
                <span>Explore Programs</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={scrollToPrograms}
                className="group bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 hover-stick-pulse"
              >
                <span>Learn More</span>
                <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-stick-slide-in-right delay-1000">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 animate-stick-bounce stagger-1">
                  <Users className="w-8 h-8 text-teal-300" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-blue-200">500+</h3>
                <p className="text-blue-200">Successful Graduates</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 animate-stick-bounce stagger-2">
                  <Award className="w-8 h-8 text-teal-300" />
                </div>
                <h3 className="text-2xl font-bold mb- text-blue-200">95%</h3>
                <p className="text-blue-200">Job Placement Rate</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 animate-stick-bounce stagger-3">
                  <Clock className="w-8 h-8 text-teal-300" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-blue-200">
                  1 - 12 Months
                </h3>
                <p className="text-blue-200">Program Duration</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About SITA Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-stick-slide-in-left">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                About{" "}
                <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  SITA
                </span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Sidama Innovation and Technology Agency stands at the forefront
                of Ethiopia's technological advancement. We bridge the gap
                between academic learning and professional practice through
                comprehensive internship programs.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our mission is to cultivate the next generation of technology
                leaders by providing hands-on experience in cutting-edge
                technologies and real-world problem-solving scenarios.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-teal-50 p-6 rounded-xl hover-stick-pulse">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Innovation Focus
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Cutting-edge technology and research-driven solutions
                  </p>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-6 rounded-xl hover-stick-pulse">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Industry Partnership
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Strong connections with leading tech companies
                  </p>
                </div>
              </div>
            </div>

            <div className="animate-stick-slide-in-right delay-400">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-teal-500 rounded-2xl transform rotate-6 animate-stick-wiggle"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Why Choose SITA?
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-stick-pulse stagger-1">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-700">
                        Industry-relevant curriculum designed by experts
                      </span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-stick-pulse stagger-2">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-700">
                        Mentorship from experienced professionals
                      </span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-stick-pulse stagger-3">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-700">
                        Real project experience with impact
                      </span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-stick-pulse stagger-4">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-700">
                        Career placement assistance
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section
        id="programs"
        className="py-20 bg-gradient-to-br from-gray-50 to-blue-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our{" "}
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Programs
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our comprehensive internship programs designed to
              prepare you for success in the technology industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program, index) => (
              <div
                key={program.id}
                className={`animate-stick-zoom-in delay-${(index + 1) * 200}`}
              >
                <ProgramCard program={program} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join hundreds of successful graduates who have launched their
            careers through our internship programs.
          </p>
          <Link
            to="/programs"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 space-x-2 hover-stick-bounce animate-stick-pulse"
          >
            <span>Apply Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
