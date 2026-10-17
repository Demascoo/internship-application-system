import React from "react";
import { Link } from "react-router-dom";
import { Clock, Users, CheckCircle, ArrowRight, Calendar } from "lucide-react";
import { Program } from "../../contexts/AppContext";

interface ProgramCardProps {
  program: Program;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ program }) => {

  const getIcon = (iconName: string) => {
    const iconProps = { size: 24, className: "text-white" };
    switch (iconName) {
      case "network":
        return (
          <div className="w-6 h-6 bg-white rounded border-2 border-white"></div>
        );
      case "code":
        return (
          <div className="w-6 h-6 text-white font-mono text-lg flex items-center justify-center">
            &lt;/&gt;
          </div>
        );
      case "tool":
        return <div className="w-6 h-6 bg-white rounded rotate-45"></div>;
      default:
        return <CheckCircle {...iconProps} />;
    }
  };

  // Background images for different program categories
  const getBackgroundImage = (category: string) => {
    switch (category) {
      case "networking":
        return "https://images.pexels.com/photos/2881224/pexels-photo-2881224.jpeg?auto=compress&cs=tinysrgb&w=800";
      case "software":
        return "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=800";
      case "maintenance":
        return "https://images.pexels.com/photos/3862629/pexels-photo-3862629.jpeg?auto=compress&cs=tinysrgb&w=800";
      default:
        return "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800";
    }
  };

  return (
    <div
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden hover-stick-float"
    >
      <div
        className={`h-32 bg-gradient-to-br ${program.color} p-6 flex items-center justify-between relative overflow-hidden`}
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.4)), url(${getBackgroundImage(
            program.category
          )})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-2 animate-stick-wiggle">
            {getIcon(program.icon)}
          </div>
          <h3 className="text-xl font-bold text-white">{program.name}</h3>
        </div>

        <div className="relative z-10 text-right">
          <div className="text-2xl font-bold text-white animate-stick-pulse">
            <Users size={24} />
          </div>
          <div className="text-white/80 text-sm">
            Available
          </div>
        </div>

        <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500 animate-stick-float"></div>
      </div>

      <div className="p-6">
        <p className="text-gray-600 mb-4 leading-relaxed">
          {program.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock size={16} />
            <span>Duration varies</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Users size={16} />
            <span>Multiple spots</span>
          </div>
        </div>

        {/* Program Timeline */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Program Timeline
            </span>
            <span className="text-sm text-gray-500">
              Flexible duration
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar size={14} />
            <span>
              Year-round availability
            </span>
          </div>
        </div>


        {/* Requirements */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">Requirements:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {program.requirements.slice(0, 2).map((req, index) => (
              <li key={index} className="flex items-start space-x-2">
                <CheckCircle
                  size={14}
                  className="text-green-500 mt-0.5 flex-shrink-0 animate-stick-pulse"
                />
                <span>{req}</span>
              </li>
            ))}
            {program.requirements.length > 2 && (
              <li className="text-gray-500 text-sm">
                +{program.requirements.length - 2} more
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            to={`/programs/${program.id}`}
            className="group w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-md transform hover:scale-105"
          >
            <span>Learn More</span>
          </Link>

          <Link
            to={`/apply/${program.id}`}
            className={`group w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r ${program.color} text-white hover:shadow-lg transform hover:scale-105 hover-stick-bounce`}
          >
            <span>Apply Now</span>
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProgramCard;
