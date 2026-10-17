import React, { useState } from "react";
import { Search, Filter, Users, Clock, SortAsc } from "lucide-react";
import ProgramCard from "../Common/ProgramCard";
import { useApp } from "../../contexts/AppContext";

const ProgramSelection: React.FC = () => {
  const { programs } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");

  const filteredPrograms = programs
    .filter((program) => {
      const matchesSearch =
        program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.description.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterBy === "all") return matchesSearch;
      return matchesSearch && program.category === filterBy;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "category") return a.category.localeCompare(b.category);
      return 0;
    });

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Internship{" "}
            <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Programs
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Explore our comprehensive internship programs designed to prepare
            you for a successful career in technology.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-2xl font-bold text-teal-600 mb-2">
                {programs.length}
              </div>
              <div className="text-gray-600 flex items-center justify-center space-x-2">
                <Filter size={18} />
                <span>Programs Available</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                <Users size={24} />
              </div>
              <div className="text-gray-600 flex items-center justify-center space-x-2">
                <span>Open Applications</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent input-focus hover-stick-pulse"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex items-center">
                <Filter className="absolute left-3 text-gray-400" size={20} />
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none hover-stick-bounce"
                >
                  <option value="all">All Programs</option>
                  <option value="networking">Networking</option>
                  <option value="software">Software</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="relative flex items-center">
                <SortAsc className="absolute left-3 text-gray-400" size={20} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none hover-stick-bounce"
                >
                  <option value="name">Sort by Name</option>
                  <option value="category">Sort by Category</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-gray-600">
          {filteredPrograms.length} program
          {filteredPrograms.length !== 1 ? "s" : ""} found
        </div>

        {/* Programs Grid */}
        {filteredPrograms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map((program, index) => (
              <div
                key={program.id}
                className={`animate-stick-zoom-in delay-${
                  ((index % 3) + 1) * 200
                }`}
              >
                <ProgramCard program={program} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No Programs Found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}

        {/* Alternative Programs Suggestion */}
        {filteredPrograms.length === 0 && searchTerm && (
          <div className="mt-12 bg-blue-50 p-8 rounded-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Looking for something else?
            </h3>
            <p className="text-gray-600 mb-6">
              We have other programs that might interest you. Check out all
              available options below.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterBy("all");
              }}
              className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover-stick-bounce"
            >
              View All Programs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramSelection;
