import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getLinkedPartner } from "../../services/partner/partnerService";

import DashboardHeader from "../../components/Dashboard/DashboardHeader";
import ProfileCard from "../../components/Profile/ProfileCard";
import PartnerCard from "../../components/Partner/PartnerCard";
import PartnerSearch from "../../components/Partner/PartnerSearch";
import IncomingRequests from "../../components/Partner/IncomingRequests";
import QuickActions from "../../components/Dashboard/QuickActions";
import DashboardStats from "../../components/Dashboard/DashboardStats";
import LogoutButton from "../../components/Dashboard/LogoutButton";

export default function Home() {
  const { user } = useAuth();
  const [partner, setPartner] = useState(null);
  const [loadingPartner, setLoadingPartner] = useState(true);

  // Fetch the partner details on load
  async function loadPartnerData() {
    if (!user) return;
    try {
      setLoadingPartner(true);
      const partnerData = await getLinkedPartner(user.id);
      setPartner(partnerData);
    } catch (err) {
      console.error("Error loading partner details:", err);
    } finally {
      setLoadingPartner(false);
    }
  }

  useEffect(() => {
    loadPartnerData();
  }, [user]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <DashboardHeader />

        {/* Profile */}
        <ProfileCard />

        {/* Partner - Now explicitly receiving partner state! */}
        <PartnerCard
  user={user}
  partner={partner}
/>

        {/* Search Partner */}
        <PartnerSearch />

        {/* Incoming Partner Requests */}
        <IncomingRequests />

        {/* Quick Actions */}
        <QuickActions />

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Logout */}
        <LogoutButton />

      </div>
    </div>
  );
}