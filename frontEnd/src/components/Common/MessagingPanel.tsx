import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { advisersAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";

interface MessagingPanelProps {
  studentId: string;
  receiverId: string;
}

const MessagingPanel: React.FC<MessagingPanelProps> = ({ studentId, receiverId }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const myUserId = useMemo(() => (user as any)?._id || (user as any)?.id, [user]);

  const loadMessages = async () => {
    try {
      const res = await advisersAPI.listMessages(studentId);
      setMessages(res.data.messages || res.messages || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load messages");
    }
  };

  useEffect(() => {
    loadMessages();
    // live updates
    if (socket) {
      const handler = () => loadMessages();
      socket.on("newMessage", handler);
      return () => {
        socket.off("newMessage", handler);
      };
    }
  }, [studentId, socket]);

  const onSend = async () => {
    if (!content && !files?.length) return;
    try {
      if (files && files.length > 0) {
        const form = new FormData();
        form.append("studentId", studentId);
        form.append("receiverId", receiverId);
        form.append("content", content);
        Array.from(files).forEach((f) => form.append("attachments", f));
        await advisersAPI.sendMessageWithFiles(form);
      } else {
        await advisersAPI.sendMessage({ studentId, receiverId, content });
      }
      setContent("");
      setFiles(null);
      await loadMessages();
      toast.success("Message sent");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message");
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleString();

  return (
    <div className="bg-white rounded shadow p-4 space-y-2">
      <div className="mb-4 h-64 overflow-y-auto border rounded p-2">
        {messages.map((m) => {
          const isMine = (m.senderId?._id || m.senderId) === myUserId;
          return (
            <div key={m._id} className={`mb-3 ${isMine ? "text-right" : "text-left"}`}>
              <div className={`inline-block max-w-[80%] rounded px-3 py-2 ${isMine ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
                <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {m.attachments.map((a: any, idx: number) => (
                      <a key={idx} className="underline text-sm" href={`/${a.filePath}`} target="_blank" rel="noreferrer">
                        {a.originalName || a.filename}
                      </a>
                    ))}
                  </div>
                )}
                <div className="text-[10px] opacity-75 mt-1">{formatTime(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && <div className="text-center text-gray-500">No messages yet</div>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          className="text-sm"
        />
        {files && files.length > 0 && (
          <span className="text-xs text-gray-600">{files.length} file(s) selected</span>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded p-2 h-24"
        />
        <button onClick={onSend} className="self-end bg-blue-600 text-white px-4 py-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
};

export default MessagingPanel;


