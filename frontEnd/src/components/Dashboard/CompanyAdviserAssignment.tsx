import React, { useEffect, useState } from "react";
import { accountManagementAPI } from "../../services/api";
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  Building, 
  GraduationCap, 
  CheckCircle,
  User,
  Briefcase,
  Code,
  Network,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";

type Props = { onBack: () => void };

interface Student {
  _id: string;
  name: string;
  email: string;
  university: string;
  course: string;
  graduationYear: number;
  programId: string;
  programName: string;
}

interface ProgramGroup {
  programName: string;
  students: Student[];
}

interface CompanyAdviser {
  _id: string;
  name: string;
  email: string;
  company: string;
  programId: string;
  programName: string;
}

const CompanyAdviserAssignment: React.FC<Props> = ({ onBack }) => {
  const [programGroups, setProgramGroups] = useState<ProgramGroup[]>([]);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [currentProgram, setCurrentProgram] = useState<string>("");
  const [companyAdvisers, setCompanyAdvisers] = useState<CompanyAdviser[]>([]);
  const [selectedAdviserId, setSelectedAdviserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<boolean>(false);
  const [adviserProfile, setAdviserProfile] = useState<{
    adviser: CompanyAdviser | null;
    assignedStudents: any[];
    totalAssigned: number;
    loading: boolean;
  }>({
    adviser: null,
    assignedStudents: [],
    totalAssigned: 0,
    loading: false
  });

  // Program icons mapping
  const programIcons = {
    "Software Development": Code,
    "Networking Infrastructure": Network,
    "IT Maintenance & Support": Settings,
    "Unassigned Students": Users
  };

  // Load unassigned students grouped by program
  const loadUnassignedStudents = async () => {
    setLoading(true);
    try {
      console.log('🔄 LOADING UNASSIGNED STUDENTS - Starting API call...');
      
      // First, try the debug endpoint to see all students
      try {
        const debugRes = await accountManagementAPI.debugStudentAssignments();
        console.log('🔍 DEBUG - All students data:', debugRes.data);
      } catch (debugError) {
        console.log('⚠️ Debug endpoint failed (might need auth):', debugError);
      }
      
      const res = await accountManagementAPI.getUnassignedStudentsByProgram();
      console.log('📡 UNASSIGNED STUDENTS API RESPONSE:');
      console.log('   Status:', res.status);
      console.log('   Data:', res.data);
      console.log('   Data type:', typeof res.data);
      console.log('   Data keys:', Object.keys(res.data || {}));
      
      // Check if the API call was successful and has data
      if (!res.data) {
        console.error('API returned no data:', res);
        toast.error("API returned no data");
        return;
      }
      
      // The backend returns {success: true, data: {programGroups: [...]}}
      // But axios wraps it in res.data, so we access res.data.data.programGroups
      const apiData = res.data;
      console.log('API data structure:', apiData);
      console.log('API data.success:', apiData.success);
      console.log('API data.data:', apiData.data);
      console.log('API data.programGroups:', apiData.programGroups);
      
      // Enhanced validation for API response
      if (!apiData) {
        console.error('API returned no data');
        toast.error("API returned no data");
        return;
      }

      // Check for error response
      if (apiData.success === false) {
        console.error('API returned error response:', apiData);
        toast.error("API error: " + (apiData?.message || "Unknown error"));
        return;
      }
      
      // Extract program groups with robust fallback handling
      let groups = [];
      if (apiData.data?.programGroups && Array.isArray(apiData.data.programGroups)) {
        groups = apiData.data.programGroups;
        console.log('✅ Found groups in apiData.data.programGroups:', groups.length);
      } else if (apiData.programGroups && Array.isArray(apiData.programGroups)) {
        groups = apiData.programGroups;
        console.log('✅ Found groups in apiData.programGroups:', groups.length);
      } else {
        console.warn('⚠️ No valid program groups array found in response');
        console.log('Response structure:', Object.keys(apiData));
        groups = [];
      }

      // Validate each group structure
      const validGroups = groups.filter((group: any) => {
        const isValid = group && 
          typeof group.programName === 'string' && 
          Array.isArray(group.students);
        
        if (!isValid) {
          console.warn('Invalid group structure:', group);
        }
        return isValid;
      });
      
      console.log(`📊 Program groups validation: ${validGroups.length}/${groups.length} valid groups`);
      console.log('Valid groups:', JSON.stringify(validGroups, null, 2));
      
      // Log each valid group's details
      validGroups.forEach((group: ProgramGroup, index: number) => {
        console.log(`📁 Group ${index + 1}: "${group.programName}" - ${group.students.length} students`);
        group.students.forEach((student: Student, studentIndex: number) => {
          console.log(`   👤 Student ${studentIndex + 1}: ${student.name} (${student.email})`);
        });
      });
      
      // Use only valid groups and ensure they're not empty
      const finalGroups = validGroups.filter((group: ProgramGroup) => 
        group.students && group.students.length > 0
      );
      
      console.log(`🎯 Final groups after filtering empty: ${finalGroups.length}`);
      
      // Force set the groups to trigger UI update
      setProgramGroups(finalGroups);
      console.log('✅ Set program groups state to:', finalGroups.length, 'groups');
      
      // Auto-expand programs that have students (use finalGroups)
      const programsWithStudents = new Set(
        finalGroups.map((group: ProgramGroup) => group.programName)
      );
      setExpandedPrograms(programsWithStudents as Set<string>);
      
      console.log(`🔄 Auto-expanding ${programsWithStudents.size} programs with students`);
      console.log('Programs to expand:', Array.from(programsWithStudents));
      
      // Show appropriate messages based on results
      if (finalGroups.length === 0) {
        console.warn('⚠️ No program groups with students found');
        if (apiData.meta?.totalStudents > 0) {
          toast(`Found ${apiData.meta.totalStudents} students but they may not be assigned to programs yet.`, { icon: '📝' });
        } else {
          toast("No unassigned students found. All students may already have company advisers.", { icon: '✅' });
        }
      } else {
        const totalStudents = finalGroups.reduce((sum, group) => sum + group.students.length, 0);
        console.log(`✅ Successfully loaded ${finalGroups.length} program groups with ${totalStudents} total students`);
        toast.success(`Loaded ${finalGroups.length} program groups with ${totalStudents} unassigned students`);
      }
      
    } catch (error: any) {
      console.error('Error loading unassigned students:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error("Failed to load unassigned students: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Load company advisers for selected program
  const loadCompanyAdvisersForProgram = async (programId: string) => {
    try {
      console.log('Loading company advisers for program:', programId);
      const res = await accountManagementAPI.getCompanyAdvisersByProgram(programId);
      console.log('Company advisers response:', res);
      
      const advisers = res.data?.companyAdvisers || [];
      setCompanyAdvisers(advisers);
      console.log(`Loaded ${advisers.length} company advisers for program`);
      if (advisers.length === 0) {
        console.log('No company advisers found for program:', programId);
        toast('No company advisers found for this program', { icon: '📝' });
      }
    } catch (error) {
      console.error('Error loading company advisers:', error);
      toast.error("Failed to load company advisers");
      setCompanyAdvisers([]);
    }
  };

  // Load adviser profile with assigned students
  const loadAdviserProfile = async (adviserId: string) => {
    setAdviserProfile(prev => ({ ...prev, loading: true }));
    
    try {
      console.log('Loading adviser profile for:', adviserId);
      
      // Find the adviser details
      const adviser = companyAdvisers.find(a => a._id === adviserId);
      
      // Get assigned students for this adviser
      const res = await accountManagementAPI.getStudentsByCompanyAdviser(adviserId);
      const assignedStudents = res.data?.students || [];
      
      console.log(`Adviser ${adviser?.name} has ${assignedStudents.length} assigned students`);
      
      setAdviserProfile({
        adviser: adviser || null,
        assignedStudents,
        totalAssigned: assignedStudents.length,
        loading: false
      });
      
    } catch (error) {
      console.error('Error loading adviser profile:', error);
      setAdviserProfile({
        adviser: null,
        assignedStudents: [],
        totalAssigned: 0,
        loading: false
      });
    }
  };

  // Handle student selection
  const handleStudentSelect = (student: Student, isSelected: boolean) => {
    if (isSelected) {
      // Check if selecting from different program
      if (currentProgram && currentProgram !== student.programName) {
        toast.error("Cannot select students from different programs");
        return;
      }
      
      // Add student to selection
      setSelectedStudents(prev => [...prev, student]);
      
      // Set current program and load advisers if first selection
      if (!currentProgram) {
        setCurrentProgram(student.programName);
        if (student.programId) {
          loadCompanyAdvisersForProgram(student.programId);
        }
      }
    } else {
      // Remove student from selection
      setSelectedStudents(prev => prev.filter(s => s._id !== student._id));
      
      // Clear program if no students selected
      if (selectedStudents.length === 1) {
        setCurrentProgram("");
        setCompanyAdvisers([]);
        setSelectedAdviserId("");
      }
    }
  };

  // Handle assignment save
  const handleAssignment = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    if (!selectedAdviserId) {
      toast.error("Please select a company adviser");
      return;
    }

    const studentIds = selectedStudents.map(student => student._id);

    setAssigning(true);
    try {
      console.log('🎯 ASSIGNMENT START - Students to assign:', {
        studentIds,
        companyAdviserId: selectedAdviserId,
        selectedStudentsDetails: selectedStudents.map(s => ({ id: s._id, name: s.name, program: s.programName }))
      });
      
      console.log('📊 BEFORE ASSIGNMENT - Current program groups state:');
      programGroups.forEach((group, index) => {
        console.log(`   Group ${index + 1}: ${group.programName} - ${group.students.length} students`);
        group.students.forEach((student, studentIndex) => {
          console.log(`      Student ${studentIndex + 1}: ${student.name} (ID: ${student._id})`);
        });
      });
      
      const response = await accountManagementAPI.assignStudentsToCompanyAdviser({
        studentIds,
        adviserId: selectedAdviserId
      });
      
      console.log('✅ Assignment API response:', response);
      
      toast.success(`Successfully assigned ${studentIds.length} student${studentIds.length !== 1 ? 's' : ''} to company adviser`);
      
      console.log('🔄 IMMEDIATE STATE UPDATE - Removing assigned students from UI...');
      console.log('Student IDs to remove:', studentIds);
      
      // Remove assigned students from the current program groups immediately
      setProgramGroups(prevGroups => {
        console.log('📝 Previous groups before filtering:', prevGroups.length);
        const updatedGroups = prevGroups.map(group => {
          const originalCount = group.students.length;
          const filteredStudents = group.students.filter(student => {
            const shouldKeep = !studentIds.includes(student._id);
            if (!shouldKeep) {
              console.log(`   ❌ Removing student: ${student.name} (ID: ${student._id}) from ${group.programName}`);
            }
            return shouldKeep;
          });
          
          console.log(`   📊 ${group.programName}: ${originalCount} → ${filteredStudents.length} students`);
          
          return {
            ...group,
            students: filteredStudents
          };
        }).filter(group => {
          const keepGroup = group.students.length > 0;
          if (!keepGroup) {
            console.log(`   🗑️ Removing empty group: ${group.programName}`);
          }
          return keepGroup;
        });
        
        console.log('📝 Updated groups after filtering:', updatedGroups.length);
        return updatedGroups;
      });
      
      // Clear selections
      setSelectedStudents([]);
      setSelectedAdviserId("");
      setCurrentProgram("");
      setCompanyAdvisers([]);
      
      console.log('🔄 BACKEND REFRESH - Loading fresh data from server...');
      // Auto-refresh the data to show updated assignments from backend
      setTimeout(async () => {
        await loadUnassignedStudents();
      }, 1000); // Wait 1 second for backend to process assignment
      
    } catch (error: any) {
      console.error('❌ Error assigning students:', error);
      console.error('❌ Error response data:', error.response?.data);
      
      // Extract the specific error message from backend
      let errorMessage = "Failed to assign students";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Display the specific error message
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  // Toggle program expansion
  const toggleProgram = (programName: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programName)) {
      newExpanded.delete(programName);
    } else {
      newExpanded.add(programName);
    }
    setExpandedPrograms(newExpanded);
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedStudents([]);
    setCurrentProgram("");
    setSelectedAdviserId("");
    setCompanyAdvisers([]);
  };

  useEffect(() => {
    loadUnassignedStudents();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">Assign Company Advisers to Students</h1>
            <p className="dashboard-subtitle">
              Select unassigned students from the same program and assign them to a company adviser
            </p>
          </div>
          <button onClick={onBack} className="btn btn-outline">Back</button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Programs Accordion - Left Side */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                  Programs & Unassigned Students
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Expand a program to view and select unassigned students • {programGroups.reduce((total, group) => total + group.students.length, 0)} unassigned students
                </p>
                {selectedStudents.length > 0 && (
                  <div className="mt-3 flex items-center justify-between bg-blue-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedStudents.length} student(s) selected from {currentProgram}
                    </span>
                    <button
                      onClick={clearSelections}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading students...</p>
                  </div>
                ) : programGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-green-800 mb-2">🎉 All Students Successfully Assigned!</h3>
                    <p className="text-green-600 mb-2">Great work! Every student has been assigned to a company adviser.</p>
                    <p className="text-gray-500 text-sm mb-4">
                      All students across all programs now have dedicated company advisers to guide their internship journey.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Assignment Status: Complete</span>
                      </div>
                      <p className="text-green-600 text-sm mt-1">
                        No unassigned students remaining in any program
                      </p>
                    </div>
                    <button 
                      onClick={loadUnassignedStudents}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      🔄 Refresh to Check for New Students
                    </button>
                  </div>
                ) : (
                  programGroups.map((group) => {
                    const isExpanded = expandedPrograms.has(group.programName);
                    const ProgramIcon = programIcons[group.programName as keyof typeof programIcons] || Users;

                    return (
                      <div key={group.programName} className="border-b border-gray-100 last:border-b-0">
                        {/* Program Header */}
                        <button
                          onClick={() => toggleProgram(group.programName)}
                          className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                            <ProgramIcon className="w-6 h-6 text-purple-600" />
                            <div>
                              <h4 className="font-semibold text-gray-900">{group.programName}</h4>
                              <p className="text-sm text-gray-500">
                                {group.students.length} unassigned student{group.students.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          {group.students.length === 0 && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </button>

                        {/* Students List */}
                        {isExpanded && (
                          <div className="bg-gray-50 border-t border-gray-100">
                            {group.students.length === 0 ? (
                              <div className="p-6 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                <p className="text-green-700 font-medium">All students assigned!</p>
                                <p className="text-gray-500 text-sm">No unassigned students in this program</p>
                              </div>
                            ) : (
                              <div className="p-2">
                                {group.students.map((student) => {
                                  const isSelected = selectedStudents.some(s => s._id === student._id);
                                  const isDisabled = currentProgram && currentProgram !== student.programName;
                                  
                                  return (
                                    <label
                                      key={student._id}
                                      className={`flex items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                        isSelected 
                                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                          : isDisabled
                                          ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                                          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        disabled={isDisabled || false}
                                        onChange={(e) => handleStudentSelect(student, e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <div className="ml-3 flex items-center gap-3 flex-1">
                                        <User className="w-5 h-5 text-gray-400" />
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900">{student.name}</p>
                                          <p className="text-sm text-gray-500">{student.email}</p>
                                          <p className="text-xs text-gray-400">
                                            {student.university} • {student.course} • {student.graduationYear}
                                          </p>
                                        </div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Company Adviser Selection - Right Side Panel */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-green-600" />
                  Company Adviser Selection
                </h3>
              </div>

              <div className="p-6">
                {selectedStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Select Students First</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose students from a program to see available company advisers
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Selected Students Summary */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Selected Students</h4>
                      <p className="text-sm text-blue-800 mb-2">
                        Program: <span className="font-medium">{currentProgram}</span>
                      </p>
                      <div className="space-y-1">
                        {selectedStudents.map(student => (
                          <p key={student._id} className="text-sm text-blue-700">
                            • {student.name}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Company Advisers */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Available Company Advisers
                      </h4>
                      {companyAdvisers.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                          <Building className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No company advisers available</p>
                          <p className="text-sm text-gray-500">for this program</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {companyAdvisers.map((adviser) => (
                            <label
                              key={adviser._id}
                              className={`flex items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                selectedAdviserId === adviser._id
                                  ? 'bg-green-50 border-green-200 shadow-sm'
                                  : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'
                              }`}
                            >
                              <input
                                type="radio"
                                name="companyAdviser"
                                value={adviser._id}
                                checked={selectedAdviserId === adviser._id}
                                onChange={() => {
                                  setSelectedAdviserId(adviser._id);
                                  loadAdviserProfile(adviser._id);
                                }}
                                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                              />
                              <div className="ml-3 flex items-center gap-3 flex-1">
                                <Building className="w-5 h-5 text-gray-400" />
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{adviser.name}</p>
                                  <p className="text-sm text-gray-500">{adviser.email}</p>
                                  <p className="text-xs text-gray-400">{adviser.company}</p>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Company Adviser Profile Display */}
                    {selectedAdviserId && adviserProfile.adviser && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Building className="w-6 h-6 text-blue-600" />
                          <div>
                            <h4 className="font-semibold text-blue-900">{adviserProfile.adviser.name}</h4>
                            <p className="text-sm text-blue-700">{adviserProfile.adviser.company}</p>
                          </div>
                        </div>
                        
                        {adviserProfile.loading ? (
                          <div className="flex items-center gap-2 text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm">Loading assigned students...</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-blue-800">
                                {adviserProfile.totalAssigned} Students Assigned
                              </span>
                            </div>
                            
                            {adviserProfile.totalAssigned > 0 && (
                              <div className="max-h-32 overflow-y-auto">
                                <div className="space-y-1">
                                  {adviserProfile.assignedStudents.map((student: any, index: number) => (
                                    <div key={student._id || index} className="text-sm text-blue-700 bg-blue-100 rounded px-2 py-1">
                                      • {student.name} ({student.email})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {adviserProfile.totalAssigned === 0 && (
                              <p className="text-sm text-blue-600">No students currently assigned</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assignment Button */}
                    {selectedAdviserId && (
                      <button
                        onClick={handleAssignment}
                        disabled={assigning}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {assigning ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Assigning...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Assign Students to Adviser
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAdviserAssignment;
