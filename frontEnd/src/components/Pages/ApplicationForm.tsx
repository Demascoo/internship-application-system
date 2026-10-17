import React, { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Send, ArrowLeft, Calendar, Clock } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useAuth } from "../../contexts/AuthContext";
import FileUpload from "../Common/FileUpload";
import toast from "react-hot-toast";

const ApplicationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { programs, addApplication } = useApp();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    motivation: "",
    experience: "",
    goals: "",
    availability: "full-time",
    preferredStartDate: "",
    preferredEndDate: "",
    preferredStartMonth: "March",
    preferredEndMonth: "September",
    desiredDuration: 6,
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const program = programs.find((p) => p.id === id);

  if (!program) {
    return <Navigate to="/programs" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: `/apply/${id}` }} replace />;
  }


  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "desiredDuration" ? parseInt(value) : value,
    }));
  };

  const handleFileUpload = (file: File) => {
    setResumeFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate dates
    const startDate = new Date(formData.preferredStartDate);
    const endDate = new Date(formData.preferredEndDate);

    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmSubmission = async () => {
    setIsSubmitting(true);
    setShowConfirmDialog(false);

    const applicationData = {
      programId: program.id,
      ...formData,
      resume: resumeFile,
    };

    const success = await addApplication(applicationData);

    if (success) {
      navigate("/dashboard", {
        state: { message: "Application submitted successfully!" },
      });
    }

    setIsSubmitting(false);
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="application-form-page">
      <div className="container">
        <div className="form-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft className="icon" />
            Back
          </button>

          <div className="form-title-section">
            <h1 className="form-title">Apply for {program.name}</h1>
            <p className="form-subtitle">
              Fill out the form below to submit your application. All fields
              marked with * are required.
            </p>
          </div>
        </div>

        <div className="form-content">
          <div className="form-main">
            <form onSubmit={handleSubmit} className="application-form">
              <div className="form-section">
                <h2 className="section-title">Personal Information</h2>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      value={user?.name || ""}
                      disabled
                      className="form-input disabled"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="form-input disabled"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2 className="section-title">Internship Preferences</h2>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Availability *</label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      className="form-select"
                      required
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Desired Duration (months) *
                    </label>
                    <select
                      name="desiredDuration"
                      value={formData.desiredDuration}
                      onChange={handleInputChange}
                      className="form-select"
                      required
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        (num) => (
                          <option key={num} value={num}>
                            {num} month{num > 1 ? "s" : ""}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Preferred Start Date *</label>
                    <input
                      type="date"
                      name="preferredStartDate"
                      value={formData.preferredStartDate}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preferred End Date *</label>
                    <input
                      type="date"
                      name="preferredEndDate"
                      value={formData.preferredEndDate}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                      min={formData.preferredStartDate}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Preferred Start Month *
                    </label>
                    <select
                      name="preferredStartMonth"
                      value={formData.preferredStartMonth}
                      onChange={handleInputChange}
                      className="form-select"
                      required
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preferred End Month *</label>
                    <select
                      name="preferredEndMonth"
                      value={formData.preferredEndMonth}
                      onChange={handleInputChange}
                      className="form-select"
                      required
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2 className="section-title">Application Details</h2>

                <div className="form-group">
                  <label className="form-label">
                    Why are you interested in this program? *
                  </label>
                  <textarea
                    name="motivation"
                    value={formData.motivation}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows={4}
                    placeholder="Tell us why you want to join this program and how it aligns with your career goals..."
                    required
                    minLength={50}
                    maxLength={2000}
                  />
                  <small className="text-gray-500">
                    {formData.motivation.length}/2000 characters (minimum 50
                    required)
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <strong>Campus Name you Came From</strong>
                  </label>
                  <textarea
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows={1}
                    placeholder="Addis Abeba ..."
                    // maxLength={2000}
                  />
                  {/* <small className="text-gray-500">
                    {formData.experience.length}/2000 characters
                  </small> */}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    What do you hope to achieve? *
                  </label>
                  <textarea
                    name="goals"
                    value={formData.goals}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows={3}
                    placeholder="What are your learning goals and expectations from this program?"
                    required
                    maxLength={1000}
                  />
                  <small className="text-gray-500">
                    {formData.goals.length}/1000 characters
                  </small>
                </div>
              </div>

              <div className="form-section">
                <h2 className="section-title">Documents</h2>
                <FileUpload onFileUpload={handleFileUpload} label="Resume/CV" />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting || !formData.motivation || !formData.goals
                  }
                  className="btn btn-primary"
                >
                  {isSubmitting ? (
                    <span className="loading">Submitting...</span>
                  ) : (
                    <>
                      Submit Application
                      <Send className="icon" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="form-sidebar">
            <div className="sidebar-card">
              <h3>Program Summary</h3>
              <div className="program-summary">
                <h4>{program.name}</h4>
                <p>{program.description}</p>
                <div className="summary-details">
                  <div className="detail">
                    <strong>Program Type:</strong> Internship Program
                  </div>
                  <div className="detail">
                    <strong>Application Status:</strong> Open
                  </div>
                </div>
              </div>
            </div>

            <div className="sidebar-card">
              <h3>Application Tips</h3>
              <ul className="tips-list">
                <li>Be specific about your motivation and goals</li>
                <li>Highlight relevant experience and skills</li>
                <li>Choose realistic start and end dates</li>
                <li>Upload a well-formatted resume</li>
                <li>Proofread your application before submitting</li>
                <li>Submit early - spots are limited!</li>
              </ul>
            </div>

            <div className="sidebar-card">
              <h3>Important Information</h3>
              <div className="dates-info">
                <div className="date-item">
                  <Calendar className="icon" />
                  <div>
                    <strong>Application Status</strong>
                    <p>Applications are open year-round</p>
                  </div>
                </div>
                <div className="date-item">
                  <Clock className="icon" />
                  <div>
                    <strong>Program Flexibility</strong>
                    <p>Duration based on your preferences</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sidebar-card">
              <h3>Need Help?</h3>
              <p>
                If you have questions about the application process, contact us:
              </p>
              <div className="contact-info">
                <p>
                  <strong>Email:</strong> admissions@sidamainnovation.et
                </p>
                <p>
                  <strong>Phone:</strong> +251 46 220 4567
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Confirmation Modal */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Review Your Application</h3>
            <p className="text-sm text-gray-600 mb-4">Please review your application details before submitting:</p>
            <div className="mb-4 p-4 bg-gray-50 rounded max-h-64 overflow-y-auto">
              <div className="space-y-2">
                <p><strong>Program:</strong> {program.name}</p>
                <p><strong>Availability:</strong> {formData.availability}</p>
                <p><strong>Desired Duration:</strong> {formData.desiredDuration} months</p>
                <p><strong>Preferred Start:</strong> {formData.preferredStartDate}</p>
                <p><strong>Preferred End:</strong> {formData.preferredEndDate}</p>
                <p><strong>Start Month:</strong> {formData.preferredStartMonth}</p>
                <p><strong>End Month:</strong> {formData.preferredEndMonth}</p>
                <p><strong>Campus:</strong> {formData.experience || 'Not specified'}</p>
                <p><strong>Resume:</strong> {resumeFile ? resumeFile.name : 'No file uploaded'}</p>
                <div className="mt-3">
                  <p><strong>Motivation:</strong></p>
                  <p className="text-sm text-gray-700 bg-white p-2 rounded border">{formData.motivation.substring(0, 200)}{formData.motivation.length > 200 ? '...' : ''}</p>
                </div>
                <div className="mt-3">
                  <p><strong>Goals:</strong></p>
                  <p className="text-sm text-gray-700 bg-white p-2 rounded border">{formData.goals.substring(0, 200)}{formData.goals.length > 200 ? '...' : ''}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmission}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationForm;
