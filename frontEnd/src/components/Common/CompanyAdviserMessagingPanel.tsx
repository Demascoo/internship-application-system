import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Send, Paperclip, Download, User, MessageSquare } from "lucide-react";
import { advisersAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";

interface Student {
  _id: string;
  name: string;
  email: string;
  universityAdviserId?: {
    _id: string;
    name: string;
    email: string;
  } | string;
  facultyHeadId?: {
    _id: string;
    name: string;
    email: string;
  } | string;
  companyAdviserId?: {
    _id: string;
    name: string;
    email: string;
  } | string;
  profile?: {
    university?: string;
    graduationYear?: number;
    course?: string;
  };
}

interface LinkedAdvisers {
  universityAdviser?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  facultyHead?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  companyAdviser?: {
    _id: string;
    name: string;
    email: string;
  } | null;
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
  createdAt: string;
  attachments?: Array<{
    filename: string;
    originalName: string;
    filePath: string;
  }>;
}

interface Props {
  students: Student[];
  onStudentSelect?: (student: Student) => void;
}

export const CompanyAdviserMessagingPanel: React.FC<Props> = ({ students, onStudentSelect }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeConversation, setActiveConversation] = useState<'university' | 'faculty'>('university');
  const [universityMessages, setUniversityMessages] = useState<Message[]>([]);
  const [facultyMessages, setFacultyMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [linkedAdvisers, setLinkedAdvisers] = useState<LinkedAdvisers | null>(null);

  // Load linked advisers for the student
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
      }
    } catch (error: any) {
      console.error('💥 Error loading linked advisers:', error);
      setLinkedAdvisers(null);
    }
  };

  // Load messages for specific conversation
  const loadMessages = async (studentId: string, conversationType: 'university' | 'faculty') => {
    if (!linkedAdvisers) return;
    
    setLoading(true);
    try {
      const peerId = conversationType === 'university' 
        ? linkedAdvisers.universityAdviser?._id
        : linkedAdvisers.facultyHead?._id;
      
      if (!peerId) {
        if (conversationType === 'university') {
          setUniversityMessages([]);
        } else {
          setFacultyMessages([]);
        }
        return;
      }

      const response: any = await advisersAPI.listMessages(studentId, peerId);
      const messages = response?.data?.messages || response?.messages || [];
      
      if (conversationType === 'university') {
        setUniversityMessages(messages);
      } else {
        setFacultyMessages(messages);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Real-time message updates
  useEffect(() => {
    if (socket && selectedStudent && linkedAdvisers) {
      const handler = (data: any) => {
        const message = data.message;
        if (message.studentId === selectedStudent._id) {
          // Determine which conversation this message belongs to
          const isUniversityConversation = 
            message.senderId._id === linkedAdvisers.universityAdviser?._id ||
            message.receiverId._id === linkedAdvisers.universityAdviser?._id;
          
          if (isUniversityConversation) {
            setUniversityMessages(prev => [message, ...prev]);
          } else {
            setFacultyMessages(prev => [message, ...prev]);
          }
        }
      };
      
      socket.on("newMessage", handler);
      return () => {
        socket.off("newMessage", handler);
      };
    }
  }, [socket, selectedStudent, linkedAdvisers]);

  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    setUniversityMessages([]);
    setFacultyMessages([]);
    setLinkedAdvisers(null);
    setActiveConversation('university');
    onStudentSelect?.(student);
    
    // First load linked advisers, then load conversations
    await loadLinkedAdvisers(student._id);
  };

  // Load messages when linkedAdvisers is updated
  useEffect(() => {
    if (selectedStudent && linkedAdvisers) {
      loadMessages(selectedStudent._id, 'university');
      loadMessages(selectedStudent._id, 'faculty');
    }
  }, [selectedStudent, linkedAdvisers]);

  const handleSendMessage = async () => {
    if (!selectedStudent || !content.trim() || !linkedAdvisers) return;
    
    const receiverId = activeConversation === 'university'
      ? linkedAdvisers.universityAdviser?._id
      : linkedAdvisers.facultyHead?._id;
    
    if (!receiverId) {
      toast.error(`No ${activeConversation === 'university' ? 'University Adviser' : 'Faculty Head'} assigned to this student.`);
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
      // Reload the active conversation
      await loadMessages(selectedStudent._id, activeConversation);
      toast.success("Message sent successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const currentMessages = activeConversation === 'university' ? universityMessages : facultyMessages;
  const currentAdvisor = activeConversation === 'university' 
    ? linkedAdvisers?.universityAdviser 
    : linkedAdvisers?.facultyHead;

  return (
    <div className="flex h-[600px]">
      {/* Student List */}
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Students</h3>
        </div>
        <div className="space-y-1">
          {students.map((student) => (
            <button
              key={student._id}
              onClick={() => handleStudentSelect(student)}
              className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                selectedStudent?._id === student._id ? "bg-blue-50 border-blue-200" : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <User className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-500">{student.email}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 flex flex-col">
        {selectedStudent ? (
          <>
            {/* Header with conversation tabs */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Messages with {selectedStudent.name}
                </h3>
              </div>
              
              {/* Conversation Tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveConversation('university')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeConversation === 'university'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>University Adviser</span>
                  {universityMessages.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1">
                      {universityMessages.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveConversation('faculty')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeConversation === 'faculty'
                      ? 'bg-white text-green-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Faculty Head</span>
                  {facultyMessages.length > 0 && (
                    <span className="bg-green-100 text-green-800 text-xs rounded-full px-2 py-1">
                      {facultyMessages.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Current advisor info */}
              {currentAdvisor && (
                <div className="mt-3 p-2 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    Chatting with: <span className="font-medium text-gray-900">{currentAdvisor.name}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : currentMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No messages yet with {activeConversation === 'university' ? 'University Adviser' : 'Faculty Head'}</p>
                  {!currentAdvisor && (
                    <p className="text-sm mt-2">No {activeConversation === 'university' ? 'University Adviser' : 'Faculty Head'} assigned to this student</p>
                  )}
                </div>
              ) : (
                currentMessages.map((message) => {
                  const isSentByMe = message.senderId._id === (user as any)?._id;
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isSentByMe ? "justify-end" : "justify-start"} mb-4`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                          isSentByMe
                            ? "bg-blue-500 text-white rounded-br-md"
                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                        }`}
                      >
                        <p className={`text-sm leading-relaxed ${
                          isSentByMe ? "text-white" : "text-gray-800"
                        }`}>
                          {message.content}
                        </p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment, idx) => (
                              <a
                                key={idx}
                                href={`http://localhost:5000/${attachment.filePath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center space-x-2 text-xs underline hover:no-underline ${
                                  isSentByMe ? "text-blue-100" : "text-blue-600"
                                }`}
                              >
                                <Download className="w-3 h-3" />
                                <span>{attachment.originalName}</span>
                              </a>
                            ))}
                          </div>
                        )}
                        <p className={`text-xs mt-2 ${
                          isSentByMe ? "text-blue-100" : "text-gray-500"
                        }`}>
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            {selectedStudent && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={`Message ${activeConversation === 'university' ? 'University Adviser' : 'Faculty Head'}...`}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    {files && files.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {Array.from(files).map((f, idx) => (
                          <span key={idx} className="inline-block mr-2">
                            📎 {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => setFiles(e.target.files)}
                      />
                      <Paperclip className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </label>
                    <button
                      onClick={handleSendMessage}
                      disabled={(!content.trim() && !files?.length) || sending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{sending ? "Sending..." : "Send"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Select a student to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
