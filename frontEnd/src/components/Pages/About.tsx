import React from "react";
import { Link } from "react-router-dom";
import aboutImage from "./about.png";
import {
  Award,
  Users,
  Target,
  Eye,
  Heart,
  Zap,
  Globe,
  BookOpen,
  Lightbulb,
  Rocket,
} from "lucide-react";

const About: React.FC = () => {
  const stats = [
    {
      icon: Users,
      number: "500+",
      label: "Graduates",
      color: "from-blue-500 to-teal-500",
    },
    {
      icon: Award,
      number: "95%",
      label: "Job Placement",
      color: "from-teal-500 to-green-500",
    },
    {
      icon: Globe,
      number: "3",
      label: "Programs",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Rocket,
      number: "10+",
      label: "Years Experience",
      color: "from-purple-500 to-pink-500",
    },
  ];

  const values = [
    {
      icon: Lightbulb,
      title: "Innovation",
      description:
        "We foster creative thinking and cutting-edge solutions to technological challenges.",
      color: "from-yellow-400 to-orange-500",
    },
    {
      icon: Users,
      title: "Collaboration",
      description:
        "We believe in the power of teamwork and building strong professional networks.",
      color: "from-blue-500 to-purple-500",
    },
    {
      icon: Target,
      title: "Excellence",
      description:
        "We strive for the highest standards in education and professional development.",
      color: "from-green-500 to-teal-500",
    },
    {
      icon: Heart,
      title: "Impact",
      description:
        "We're committed to making a positive difference in our community and beyond.",
      color: "from-pink-500 to-red-500",
    },
  ];

  const team = [
    {
      name: "Yonatan",
      position: "Directorate of SITA",
      image:
        "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400",
      expertise: "Contact : +251942100585",
    },
    {
      name: "Hanan Mohammed",
      position: "Software Development Lead",
      image:
        "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400",
      expertise: "Full-Stack Development",
    },
    {
      name: "Solomon Girma",
      position: "IT Support Manager",
      image:
        "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
      expertise: "System Administration",
    },
    {
      name: "Bethlehem Yosef",
      position: "Career Development Coordinator",
      image:
        "https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg?auto=compress&cs=tinysrgb&w=400",
      expertise: "Professional Mentoring",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 text-white">
        {/* Background Image (matched to LandingPage style) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed opacity-60"
          style={{
            // backgroundImage: `url('https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1600')`,
            backgroundImage: `url(${aboutImage})`,
          }}
        />
        {/* Light overlays (matched to LandingPage style) */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-teal-600/20"></div>

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
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                About
              </span>
              <br />
              <span className="bg-gradient-to-r from-teal-200 to-white bg-clip-text text-transparent">
                SITA
              </span>
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-blue-100 mb-8 animate-stick-slide-in-left delay-400">
            Pioneering Ethiopia's technological future through innovation,
            education, and excellence
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-stick-slide-in-right delay-800">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20 hover-stick-pulse">
              <span className="text-2xl font-bold">2015</span>
              <p className="text-sm text-blue-200">Established</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20 hover-stick-pulse">
              <span className="text-2xl font-bold">500+</span>
              <p className="text-sm text-blue-200">Graduates</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20 hover-stick-pulse">
              <span className="text-2xl font-bold">50+</span>
              <p className="text-sm text-blue-200">Partners</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-teal-50/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-stick-slide-in-left">
              <div className="bg-gradient-to-br from-blue-600 to-teal-600 p-8 rounded-3xl text-white shadow-2xl transform hover:scale-105 transition-all duration-500">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 animate-stick-wiggle">
                    <Target className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-bold">Our Mission</h2>
                </div>
                <p className="text-lg leading-relaxed text-blue-100">
                  To empower the next generation of technology leaders by
                  providing world-class internship programs that bridge the gap
                  between academic learning and industry practice, fostering
                  innovation and excellence in Ethiopia's tech ecosystem.
                </p>
              </div>
            </div>

            <div className="animate-stick-slide-in-right delay-400">
              <div className="bg-gradient-to-br from-teal-600 to-blue-600 p-8 rounded-3xl text-white shadow-2xl transform hover:scale-105 transition-all duration-500">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 animate-stick-wiggle">
                    <Eye className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-bold">Our Vision</h2>
                </div>
                <p className="text-lg leading-relaxed text-blue-100">
                  To be Ethiopia's premier technology innovation hub, recognized
                  globally for producing skilled professionals who drive
                  technological advancement and contribute to the nation's
                  digital transformation agenda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-teal-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-stick-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl animate-stick-float delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 animate-stick-zoom-in">
              Our{" "}
              <span className="bg-gradient-to-r from-teal-300 to-blue-300 bg-clip-text text-transparent">
                Impact
              </span>
            </h2>
            <p className="text-xl text-blue-200 animate-stick-slide-in-left delay-400">
              Numbers that speak to our commitment and success
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center animate-stick-zoom-in delay-${
                  (index + 1) * 200
                } group`}
              >
                <div
                  className={`w-20 h-20 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300 animate-stick-bounce`}
                >
                  <stat.icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-4xl font-bold mb-2 group-hover:scale-105 transition-transform">
                  {stat.number}
                </div>
                <div className="text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-stick-zoom-in">
              Our{" "}
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Values
              </span>
            </h2>
            <p className="text-xl text-gray-600 animate-stick-slide-in-left delay-400">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className={`group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-stick-slide-in-left delay-${
                  (index + 1) * 200
                } border-2 border-gray-100 hover:border-transparent`}
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${value.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 animate-stick-wiggle`}
                >
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-stick-zoom-in">
              Meet Our{" "}
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Team
              </span>
            </h2>
            <p className="text-xl text-gray-600 animate-stick-slide-in-left delay-400">
              Experienced professionals dedicated to your success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden animate-stick-zoom-in delay-${
                  (index + 1) * 200
                } transform hover:-translate-y-2`}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-semibold mb-2">
                    {member.position}
                  </p>
                  <p className="text-gray-600 text-sm">{member.expertise}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-stick-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-stick-float delay-1000"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="animate-stick-zoom-in">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Join Our Community?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Take the first step towards an exciting career in technology with
              our comprehensive internship programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/programs"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 hover-stick-bounce"
              >
                Explore Programs
              </Link>
              <Link
                to="/contact"
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-300 hover-stick-pulse"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
