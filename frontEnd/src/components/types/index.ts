export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'companyAdviser' | 'universityAdviser' | 'companyAdmin' | 'facultyHead';
  skills?: string[];
  gpa?: number;
  experience?: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  availableSpots: number;
  totalSpots: number;
  duration: string;
  category: 'networking' | 'software' | 'maintenance';
  color: string;
  icon: string;
}

export interface Application {
  id: string;
  studentId: string;
  programId: string;
  studentName: string;
  studentEmail: string;
  coverLetter: string;
  resume?: File;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: string;
  programName: string;
}