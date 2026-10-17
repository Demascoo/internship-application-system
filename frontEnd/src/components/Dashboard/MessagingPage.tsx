import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { advisersAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import MessagingPanel from "../Common/MessagingPanel";

const MessagingPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const [receiverId, setReceiverId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      if (!studentId) return;
      try {
        setLoading(true);
        const res = await advisersAPI.getLink(studentId);
        const link = (res.data && res.data.link) || res.link;
        if (!link) {
          setError("No adviser link found for student");
          setLoading(false);
          return;
        }
        if (user?.role === "universityAdviser") {
          setReceiverId(link.companyAdviserId?._id || link.companyAdviserId || link.companyAdminId?._id || link.companyAdminId || "");
        } else if (user?.role === "companyAdviser" || user?.role === "companyAdmin") {
          setReceiverId(link.universityAdviserId?._id || link.universityAdviserId || "");
        } else {
          setError("Not authorized for adviser messaging");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to fetch link");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [studentId, user]);

  if (!studentId) return <div className="container">Invalid student</div>;
  if (loading) return <div className="container">Loading...</div>;
  if (error) return <div className="container text-red-600">{error}</div>;
  if (!receiverId) return <div className="container">No receiver found</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Adviser Messaging</h1>
      <MessagingPanel studentId={studentId} receiverId={receiverId} />
    </div>
  );
};

export default MessagingPage;


