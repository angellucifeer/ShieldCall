import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";

import {
  getIncomingRequests,
  acceptPartnerRequest,
  rejectPartnerRequest,
} from "../../services/partner/partnerService";

import PartnerRequestCard from "./PartnerRequestCard";

export default function IncomingRequests() {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadRequests() {
    if (!user) return;

    try {
      setLoading(true);

      const data = await getIncomingRequests(user.id);

      console.log("Incoming Requests:", data);

      setRequests(data || []);
    } catch (err) {
      console.error("Load Requests Error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [user]);

async function handleAccept(request) {
    try {
      // 1. Run the database function
      await acceptPartnerRequest(request.id);
      
      // 2. Clear out requests locally
      await loadRequests();
      
      // 3. Force a hard reload to cleanly pull your fresh partner profile details into the main view
      window.location.reload(); 
      
    } catch (err) {
      console.error("Accept request failed:", err);
      alert("Failed to accept request.");
    }
  }

  async function handleReject(request) {
    try {
      await rejectPartnerRequest(request.id);
      await loadRequests();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6">
        <p className="text-zinc-400">Loading partner requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">
        Incoming Partner Requests
      </h2>

      <div className="space-y-4">
        {requests.map((request) => (
          <PartnerRequestCard
            key={request.id}
            request={request}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        ))}
      </div>
    </div>
  );
}