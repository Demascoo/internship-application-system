import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Calendar,
  Users,
  Clock,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface Program {
  _id: string;
  name: string;
  description: string;
  category: string;
  totalSpots: number;
  availableSpots: number;
  duration: string;
  requirements: string[];
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  startMonth: string;
  endMonth: string;
  durationInMonths: number;
  skills: string[];
  benefits: string[];
  color?: string;
  icon?: string;
  backgroundImage?: string;
}

interface ProgramFormProps {
  program: Program | null;
  onBack: () => void;
  onSuccess: () => void;
}

const ProgramForm: React.FC<ProgramFormProps> = ({ program, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    totalSpots: 10,
    duration: "",
    requirements: [""],
    startDate: "",
    endDate: "",
    applicationDeadline: "",
    startMonth: "March",
    endMonth: "September",
    durationInMonths: 6,
    skills: [""],
    benefits: [""],
    color: "from-blue-500 to-blue-600",
    icon: "default",
    backgroundImage: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const colorOptions = [
    { value: "from-blue-500 to-blue-600", label: "Blue", preview: "bg-gradient-to-r from-blue-500 to-blue-600" },
    { value: "from-teal-500 to-teal-600", label: "Teal", preview: "bg-gradient-to-r from-teal-500 to-teal-600" },
    { value: "from-orange-500 to-orange-600", label: "Orange", preview: "bg-gradient-to-r from-orange-500 to-orange-600" },
    { value: "from-purple-500 to-purple-600", label: "Purple", preview: "bg-gradient-to-r from-purple-500 to-purple-600" },
    { value: "from-green-500 to-green-600", label: "Green", preview: "bg-gradient-to-r from-green-500 to-green-600" },
    { value: "from-red-500 to-red-600", label: "Red", preview: "bg-gradient-to-r from-red-500 to-red-600" },
    { value: "from-indigo-500 to-indigo-600", label: "Indigo", preview: "bg-gradient-to-r from-indigo-500 to-indigo-600" },
    { value: "from-pink-500 to-pink-600", label: "Pink", preview: "bg-gradient-to-r from-pink-500 to-pink-600" },
  ];

  // Pre-fill form if editing existing program
  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name,
        description: program.description,
        category: program.category,
        totalSpots: program.totalSpots,
        duration: program.duration,
        requirements: program.requirements.length > 0 ? program.requirements : [""],
        startDate: program.startDate ? new Date(program.startDate).toISOString().split('T')[0] : "",
        endDate: program.endDate ? new Date(program.endDate).toISOString().split('T')[0] : "",
        applicationDeadline: program.applicationDeadline ? new Date(program.applicationDeadline).toISOString().split('T')[0] : "",
        startMonth: program.startMonth || "March",
        endMonth: program.endMonth || "September",
        durationInMonths: program.durationInMonths || 6,
        skills: program.skills && program.skills.length > 0 ? program.skills : [""],
        benefits: program.benefits && program.benefits.length > 0 ? program.benefits : [""],
        color: program.color || "from-blue-500 to-blue-600",
        icon: program.icon || "default",
        backgroundImage: program.backgroundImage || "",
      });
    }
  }, [program]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalSpots' || name === 'durationInMonths' ? parseInt(value) || 0 : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleArrayInputChange = (arrayName: 'requirements' | 'skills' | 'benefits', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (arrayName: 'requirements' | 'skills' | 'benefits') => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], ""]
    }));
  };

  const removeArrayItem = (arrayName: 'requirements' | 'skills' | 'benefits', index: number) => {
    if (formData[arrayName].length > 1) {
      setFormData(prev => ({
        ...prev,
        [arrayName]: prev[arrayName].filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Program name is required";
    if (formData.name.length > 200) newErrors.name = "Program name must be less than 200 characters";
    
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (formData.description.length > 1000) newErrors.description = "Description must be less than 1000 characters";
    
    if (!formData.category.trim()) newErrors.category = "Category is required";
    if (formData.totalSpots < 1 || formData.totalSpots > 1000) newErrors.totalSpots = "Total spots must be between 1 and 1000";
    if (!formData.duration.trim()) newErrors.duration = "Duration is required";
    
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.applicationDeadline) newErrors.applicationDeadline = "Application deadline is required";
    
    // Date validation
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = "End date must be after start date";
    }
    if (formData.applicationDeadline && formData.startDate && new Date(formData.applicationDeadline) >= new Date(formData.startDate)) {
      newErrors.applicationDeadline = "Application deadline must be before start date";
    }
    
    // Requirements validation
    const validRequirements = formData.requirements.filter(req => req.trim() !== "");
    if (validRequirements.length === 0) {
      newErrors.requirements = "At least one requirement is needed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean up array data
      const cleanedData = {
        ...formData,
        requirements: formData.requirements.filter(req => req.trim() !== ""),
        skills: formData.skills.filter(skill => skill.trim() !== ""),
        benefits: formData.benefits.filter(benefit => benefit.trim() !== ""),
      };

      const url = program
        ? `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/programs/${program._id}`
        : `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/programs`;
      
      const method = program ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(cleanedData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Program ${program ? "updated" : "created"} successfully!`);
        onSuccess();
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          // Handle validation errors
          const newErrors: Record<string, string> = {};
          data.errors.forEach((error: any) => {
            const field = error.path || error.param;
            if (field) {
              newErrors[field] = error.msg || error.message;
            }
          });
          setErrors(newErrors);
          toast.error("Please fix the validation errors");
        } else {
          toast.error(data.message || "Failed to save program");
        }
      }
    } catch (error) {
      console.error("Error saving program:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="program-form-page">
      <div className="container">
        <div className="form-header">
          <button onClick={onBack} className="back-btn">
            <ArrowLeft className="icon" />
            Back to Programs
          </button>

          <div className="header-content">
            <h1 className="form-title">
              {program ? "Edit Program" : "Create New Program"}
            </h1>
            <p className="form-subtitle">
              {program ? "Update program details" : "Set up a new internship program"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="program-form">
          <div className="form-sections">
            {/* Basic Information */}
            <div className="form-section">
              <h2 className="section-title">Basic Information</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Program Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`form-input ${errors.name ? "error" : ""}`}
                    placeholder="e.g., Advanced Web Development"
                    maxLength={200}
                    disabled={isSubmitting}
                  />
                  {errors.name && <div className="error-message">{errors.name}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`form-input ${errors.category ? "error" : ""}`}
                    placeholder="e.g., web development, data science, design"
                    maxLength={50}
                    disabled={isSubmitting}
                  />
                  {errors.category && <div className="error-message">{errors.category}</div>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`form-textarea ${errors.description ? "error" : ""}`}
                  rows={4}
                  placeholder="Describe what students will learn and do in this program..."
                  maxLength={1000}
                  disabled={isSubmitting}
                />
                <div className="char-count">{formData.description.length}/1000</div>
                {errors.description && <div className="error-message">{errors.description}</div>}
              </div>
            </div>

            {/* Program Details */}
            <div className="form-section">
              <h2 className="section-title">Program Details</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Total Spots *</label>
                  <div className="input-group">
                    <Users className="input-icon" />
                    <input
                      type="number"
                      name="totalSpots"
                      value={formData.totalSpots}
                      onChange={handleInputChange}
                      className={`form-input ${errors.totalSpots ? "error" : ""}`}
                      min="1"
                      max="1000"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.totalSpots && <div className="error-message">{errors.totalSpots}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Duration *</label>
                  <div className="input-group">
                    <Clock className="input-icon" />
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className={`form-input ${errors.duration ? "error" : ""}`}
                      placeholder="e.g., 6 months, 12 weeks"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.duration && <div className="error-message">{errors.duration}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (Months) *</label>
                  <input
                    type="number"
                    name="durationInMonths"
                    value={formData.durationInMonths}
                    onChange={handleInputChange}
                    className="form-input"
                    min="1"
                    max="24"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Start Month *</label>
                  <select
                    name="startMonth"
                    value={formData.startMonth}
                    onChange={handleInputChange}
                    className="form-select"
                    disabled={isSubmitting}
                  >
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">End Month *</label>
                  <select
                    name="endMonth"
                    value={formData.endMonth}
                    onChange={handleInputChange}
                    className="form-select"
                    disabled={isSubmitting}
                  >
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="form-section">
              <h2 className="section-title">Important Dates</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <div className="input-group">
                    <Calendar className="input-icon" />
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={`form-input ${errors.startDate ? "error" : ""}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.startDate && <div className="error-message">{errors.startDate}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <div className="input-group">
                    <Calendar className="input-icon" />
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className={`form-input ${errors.endDate ? "error" : ""}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.endDate && <div className="error-message">{errors.endDate}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Application Deadline *</label>
                  <div className="input-group">
                    <Calendar className="input-icon" />
                    <input
                      type="date"
                      name="applicationDeadline"
                      value={formData.applicationDeadline}
                      onChange={handleInputChange}
                      className={`form-input ${errors.applicationDeadline ? "error" : ""}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.applicationDeadline && <div className="error-message">{errors.applicationDeadline}</div>}
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="form-section">
              <h2 className="section-title">Requirements</h2>
              {errors.requirements && (
                <div className="error-message mb-4">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.requirements}
                </div>
              )}
              
              {formData.requirements.map((requirement, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => handleArrayInputChange('requirements', index, e.target.value)}
                    className="form-input"
                    placeholder={`Requirement ${index + 1}`}
                    maxLength={200}
                    disabled={isSubmitting}
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('requirements', index)}
                      className="remove-btn"
                      disabled={isSubmitting}
                    >
                      <X className="icon" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => addArrayItem('requirements')}
                className="add-btn"
                disabled={isSubmitting}
              >
                <Plus className="icon" />
                Add Requirement
              </button>
            </div>

            {/* Skills (Optional) */}
            <div className="form-section">
              <h2 className="section-title">Skills (Optional)</h2>
              <p className="section-description">Skills that students will learn in this program</p>
              
              {formData.skills.map((skill, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => handleArrayInputChange('skills', index, e.target.value)}
                    className="form-input"
                    placeholder={`Skill ${index + 1}`}
                    maxLength={100}
                    disabled={isSubmitting}
                  />
                  {formData.skills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('skills', index)}
                      className="remove-btn"
                      disabled={isSubmitting}
                    >
                      <X className="icon" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => addArrayItem('skills')}
                className="add-btn"
                disabled={isSubmitting}
              >
                <Plus className="icon" />
                Add Skill
              </button>
            </div>

            {/* Benefits (Optional) */}
            <div className="form-section">
              <h2 className="section-title">Benefits (Optional)</h2>
              <p className="section-description">Benefits students will receive from this program</p>
              
              {formData.benefits.map((benefit, index) => (
                <div key={index} className="array-input-group">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => handleArrayInputChange('benefits', index, e.target.value)}
                    className="form-input"
                    placeholder={`Benefit ${index + 1}`}
                    maxLength={200}
                    disabled={isSubmitting}
                  />
                  {formData.benefits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('benefits', index)}
                      className="remove-btn"
                      disabled={isSubmitting}
                    >
                      <X className="icon" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => addArrayItem('benefits')}
                className="add-btn"
                disabled={isSubmitting}
              >
                <Plus className="icon" />
                Add Benefit
              </button>
            </div>

            {/* Appearance */}
            <div className="form-section">
              <h2 className="section-title">Appearance</h2>
              
              <div className="form-group">
                <label className="form-label">Color Scheme</label>
                <div className="color-options">
                  {colorOptions.map((color) => (
                    <label key={color.value} className="color-option">
                      <input
                        type="radio"
                        name="color"
                        value={color.value}
                        checked={formData.color === color.value}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                      <div className={`color-preview ${color.preview}`}></div>
                      <span>{color.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Background Image URL (Optional)</label>
                <input
                  type="url"
                  name="backgroundImage"
                  value={formData.backgroundImage}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                  disabled={isSubmitting}
                />
                <p className="form-help">
                  Leave empty to use the default image based on category
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" onClick={onBack} className="btn btn-outline" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {program ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="icon" />
                  {program ? "Update Program" : "Create Program"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgramForm;