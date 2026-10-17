import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Clock, Users, CheckCircle, ArrowRight, MapPin, Calendar } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const ProgramDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { programs } = useApp();

  const program = programs.find(p => p.id === id);

  if (!program) {
    return <Navigate to="/programs" replace />;
  }


  return (
    <div className="program-detail">
      <div className="container">
        <div className="program-header">
          <div className="program-breadcrumb">
            <Link to="/programs">Programs</Link>
            <span>/</span>
            <span>{program.name}</span>
          </div>

          <div className="program-hero">
            <div className="program-info">
              <div className="program-badges">
                <span className="badge available">
                  Open for Applications
                </span>
                <span className="badge-outline">
                  <Users className="icon" />
                  Internship Program
                </span>
              </div>

              <h1 className="program-title">{program.name}</h1>
              <p className="program-description">{program.description}</p>

              <div className="program-meta">
                <div className="meta-item">
                  <Clock className="icon" />
                  <span>Flexible duration</span>
                </div>
                <div className="meta-item">
                  <Users className="icon" />
                  <span>Multiple opportunities</span>
                </div>
                <div className="meta-item">
                  <MapPin className="icon" />
                  <span>Hawassa, Sidama</span>
                </div>
                <div className="meta-item">
                  <Calendar className="icon" />
                  <span>Year-round enrollment</span>
                </div>
              </div>

              <div className="program-actions">
                <Link to={`/apply/${program.id}`} className="btn btn-primary btn-large">
                  Apply Now
                  <ArrowRight className="icon" />
                </Link>
                <button className="btn btn-outline btn-large">
                  Save Program
                </button>
              </div>
            </div>

            <div className="program-visual">
              <img 
                src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt={program.name}
                className="program-image"
              />
            </div>
          </div>
        </div>

        <div className="program-content">
          <div className="content-main">
            <section className="content-section">
              <h2>Program Overview</h2>
              <p>
                This comprehensive internship program is designed to provide hands-on experience 
                and practical skills in {program.name.toLowerCase()}. You'll work alongside industry professionals 
                on real-world projects while developing the technical and soft skills needed for a successful career.
              </p>
            </section>

            <section className="content-section">
              <h2>What You'll Learn</h2>
              <div className="learning-grid">
                <div className="learning-item">
                  <CheckCircle className="icon" />
                  <div>
                    <h4>Technical Skills</h4>
                    <p>Master the latest tools and technologies used in the industry.</p>
                  </div>
                </div>
                <div className="learning-item">
                  <CheckCircle className="icon" />
                  <div>
                    <h4>Project Management</h4>
                    <p>Learn to plan, execute, and deliver projects effectively.</p>
                  </div>
                </div>
                <div className="learning-item">
                  <CheckCircle className="icon" />
                  <div>
                    <h4>Team Collaboration</h4>
                    <p>Work in cross-functional teams on challenging projects.</p>
                  </div>
                </div>
                <div className="learning-item">
                  <CheckCircle className="icon" />
                  <div>
                    <h4>Professional Development</h4>
                    <p>Build communication skills and professional network.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="content-section">
              <h2>Program Structure</h2>
              <div className="program-timeline">
                <div className="timeline-item">
                  <div className="timeline-marker">1</div>
                  <div className="timeline-content">
                    <h4>Foundation Phase (Weeks 1-4)</h4>
                    <p>Introduction to core concepts and tools</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker">2</div>
                  <div className="timeline-content">
                    <h4>Development Phase (Weeks 5-16)</h4>
                    <p>Hands-on projects and skill development</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker">3</div>
                  <div className="timeline-content">
                    <h4>Capstone Phase (Weeks 17-24)</h4>
                    <p>Final project and presentation</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="content-sidebar">
            <div className="sidebar-card">
              <h3>Requirements</h3>
              <ul className="requirements-list">
                {program.requirements.map((req, index) => (
                  <li key={index}>
                    <CheckCircle className="icon" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div className="sidebar-card">
              <h3>Application Status</h3>
              <div className="deadline-info">
                <Calendar className="icon" />
                <div>
                  <strong>Open Applications</strong>
                  <p>Apply anytime throughout the year</p>
                </div>
              </div>
            </div>

            <div className="sidebar-card">
              <h3>Program Benefits</h3>
              <ul className="benefits-list">
                <li>✓ Industry mentorship</li>
                <li>✓ Certificate of completion</li>
                <li>✓ Job placement assistance</li>
                <li>✓ Networking opportunities</li>
                <li>✓ Real project experience</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramDetail;