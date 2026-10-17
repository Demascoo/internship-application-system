import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Send, Paperclip, Download, User } from "lucide-react";
import { advisersAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";

interface Student {
  _id: string;
  name: string;
  email: string;
  profile?: {
    university?: string;
    graduationYear?: number;
    course?: string;
  };
  groupAssignment?: {
    programName?: string;
  };
}

interface Message {
  _id: string;
  content: string;
  senderId: {
    _id: string;
    name: string;
    role: string;
  };
  receiverId: {
    _id: string;
    name: string;
    role: string;
  };
  attachments?: Array<{
    filename: string;
    originalName: string;
    filePath: string;
    mimeType: string;
    size: number;
  }>;
  createdAt: string;
  readAt?: string;
}

interface AdviserMessagingPanelProps {
  students: Student[];
  onStudentSelect?: (student: Student) => void;
}

const AdviserMessagingPanel: React.FC<AdviserMessagingPanelProps> = ({ 
  students, 
  onStudentSelect 
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [linkedAdvisers, setLinkedAdvisers] = useState<any>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  
  const myUserId = useMemo(() => (user as any)?._id || (user as any)?.id, [user]);

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadMessages = async (studentId: string) => {
    setLoading(true);
    try {
      let peerId: string | undefined;
      
      // For Faculty Head and University Adviser, filter by Company Adviser
      if (user?.role === 'facultyHead' || user?.role === 'universityAdviser') {
        if (linkedAdvisers?.companyAdviser) {
          peerId = linkedAdvisers.companyAdviser._id;
        }
      }
      
      const response: any = await advisersAPI.listMessages(studentId, peerId);
      const messages = response?.data?.messages || response?.messages || [];
      setMessages(messages);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedAdvisers = async (studentId: string) => {
    try {
      console.log('🔗 Loading linked advisers for student:', studentId);
      const response: any = await advisersAPI.getLinkedAdvisers(studentId);
      console.log('📋 Linked advisers response:', response);
      
      if (response?.success) {
        setLinkedAdvisers(response.data);
        console.log('✅ Successfully loaded linked advisers:', response.data);
      } else {
        console.error('❌ Failed to load linked advisers:', response?.message);
        setLinkedAdvisers(null);
        toast.error(response?.message || 'Failed to load linked advisers');
      }
    } catch (error: any) {
      console.error('💥 Error loading linked advisers:', error);
      setLinkedAdvisers(null);
      toast.error('Failed to load linked advisers');
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      loadLinkedAdvisers(selectedStudent._id);
      onStudentSelect?.(selectedStudent);
      setSelectedRecipient(""); // Reset recipient selection
    }
  }, [selectedStudent]);

  // Load messages when linkedAdvisers is updated
  useEffect(() => {
    if (selectedStudent && linkedAdvisers) {
      loadMessages(selectedStudent._id);
    }
  }, [selectedStudent, linkedAdvisers]);

  // Real-time message updates
  useEffect(() => {
    if (socket && selectedStudent) {
      const handler = () => loadMessages(selectedStudent._id);
      socket.on("newMessage", handler);
      return () => {
        socket.off("newMessage", handler);
      };
    }
  }, [socket, selectedStudent]);

  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    setMessages([]);
    setLinkedAdvisers(null);
    setSelectedRecipient("");
  };

  const handleSendMessage = async () => {
    if (!selectedStudent || (!content.trim() && !files?.length)) return;
    
    let receiverId = selectedRecipient;
    
    // Auto-set receiverId based on user role
    if (user?.role === 'facultyHead' || user?.role === 'universityAdviser') {
      // Faculty Head and University Adviser always send to Company Adviser
      receiverId = linkedAdvisers?.companyAdviser?._id;
      if (!receiverId) {
        toast.error("No Company Adviser assigned to this student.");
        return;
      }
    } else if (user?.role === 'companyAdviser') {
      // Company Adviser must select recipient
      if (!selectedRecipient) {
        toast.error("Please select a recipient (University Adviser or Faculty Head) before sending.");
        return;
      }
      receiverId = selectedRecipient;
    }

    if (!receiverId) {
      toast.error("Unable to determine message recipient.");
      return;
    }

    setSending(true);
    try {
      if (files && files.length > 0) {
        const form = new FormData();
        form.append("studentId", selectedStudent._id);
        form.append("content", content);
        form.append("receiverId", receiverId);
        Array.from(files).forEach((f) => form.append("attachments", f));
        await advisersAPI.sendMessageWithFiles(form);
      } else {
        const messageData = {
          studentId: selectedStudent._id,
          content: content.trim(),
          receiverId: receiverId,
        };
        await advisersAPI.sendMessage(messageData);
      }
      
      setContent("");
      setFiles(null);
      if (user?.role === 'companyAdviser') {
        setSelectedRecipient(""); // Only reset for Company Adviser
      }
      await loadMessages(selectedStudent._id);
      toast.success("Message sent successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Left Panel - Student List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Students</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? 'No students found' : 'No students assigned'}
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student._id}
                onClick={() => handleStudentSelect(student)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedStudent?._id === student._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {student.name}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {student.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {student.profile?.course && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {student.profile.course}
                        </span>
                      )}
                      {student.profile?.graduationYear && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {student.profile.graduationYear}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat Interface */}
      <div className="flex-1 flex flex-col">
        {selectedStudent ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedStudent.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{selectedStudent.email}</span>
                    {selectedStudent.profile?.university && (
                      <span>• {selectedStudent.profile.university}</span>
                    )}
                    {selectedStudent.groupAssignment?.programName && (
                      <span>• {selectedStudent.groupAssignment.programName}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Send className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                  <p className="text-sm">Start a conversation with {selectedStudent.name}</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = (message.senderId._id || message.senderId) === myUserId;
                  return (
                    <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                        <div className={`rounded-lg px-4 py-3 ${
                          isMine 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="text-sm whitespace-pre-wrap mb-2">
                            {message.content}
                          </div>
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-2">
                              {message.attachments.map((attachment, idx) => (
                                <div key={idx} className={`flex items-center space-x-2 p-2 rounded ${
                                  isMine ? 'bg-blue-700' : 'bg-gray-200'
                                }`}>
                                  <Paperclip className="w-4 h-4" />
                                  <a
                                    href={`/${attachment.filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm underline hover:no-underline flex items-center space-x-1"
                                  >
                                    <span className="truncate">{attachment.originalName}</span>
                                    <Download className="w-3 h-3" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className={`text-xs mt-2 ${
                            isMine ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.createdAt)}
                            {message.readAt && (
                              <span className="ml-2">✓ Read</span>
                            )}
                          </div>
                        </div>
                        
                        {!isMine && (
                          <div className="text-xs text-gray-500 mt-1 ml-1">
                            {message.senderId.name} • {message.senderId.role}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              {/* Recipient Selection for Company Adviser */}
              {user?.role === 'companyAdviser' && linkedAdvisers && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Send message to:</h4>
                  <div className="space-y-2">
                    {linkedAdvisers.universityAdviser && (
                      <label className="flex items-center space-x-3 p-2 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer">
                        <input
                          type="radio"
                          name="recipient"
                          value={linkedAdvisers.universityAdviser._id}
                          checked={selectedRecipient === linkedAdvisers.universityAdviser._id}
                          onChange={(e) => setSelectedRecipient(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                          disabled={sending}
                        />
                        <User className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">{linkedAdvisers.universityAdviser.name}</p>
                          <p className="text-sm text-blue-700">University Adviser</p>
                        </div>
                      </label>
                    )}
                    {linkedAdvisers.facultyHead && (
                      <label className="flex items-center space-x-3 p-2 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer">
                        <input
                          type="radio"
                          name="recipient"
                          value={linkedAdvisers.facultyHead._id}
                          checked={selectedRecipient === linkedAdvisers.facultyHead._id}
                          onChange={(e) => setSelectedRecipient(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                          disabled={sending}
                        />
                        <User className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-blue-900">{linkedAdvisers.facultyHead.name}</p>
                          <p className="text-sm text-blue-700">Faculty Head</p>
                        </div>
                      </label>
                    )}
                    {!linkedAdvisers.universityAdviser && !linkedAdvisers.facultyHead && (
                      <p className="text-sm text-blue-600">No University Adviser or Faculty Head assigned yet for this student.</p>
                    )}
                  </div>
                </div>
              )}
              {/* File attachments preview */}
              {files && files.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Attachments ({files.length})
                    </span>
                    <button
                      onClick={() => setFiles(null)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {Array.from(files).map((file, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                        <Paperclip className="w-4 h-4" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={sending}
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setFiles(e.target.files)}
                      className="hidden"
                      disabled={sending}
                    />
                    <Paperclip className="w-5 h-5 text-gray-500 hover:text-blue-600 transition-colors" />
                  </label>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={(!content.trim() && !files?.length) || sending || (user?.role === 'companyAdviser' && !selectedRecipient)}
                    className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={user?.role === 'companyAdviser' && !selectedRecipient ? "Select a recipient first" : "Send message"}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium mb-2">Select a Student</h3>
              <p className="text-sm">Choose a student from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdviserMessagingPanel;
