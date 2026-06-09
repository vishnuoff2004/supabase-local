import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardStats from '../../components/DashboardStats';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';

function DriverDashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="driver-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">Driver Dashboard</h1>
              <p className="text-muted">Your driving overview</p>
            </div>
          </div>
        </ScrollReveal>

        <DashboardStats fetchStats={() => api.get('/dashboard/driver').then(r => ({
          pendingRequests: r.data.pendingRequests ?? 0,
          activeTrips: r.data.activeTrips ?? 0,
        }))} />
      </div>
    </div>
  );
}

export default DriverDashboardPage;
