import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Records from '@/pages/Records';
import RecordNew from '@/pages/RecordNew';
import RecordDetail from '@/pages/RecordDetail';
import Consultations from '@/pages/Consultations';
import ConsultationDetail from '@/pages/ConsultationDetail';
import Transfers from '@/pages/Transfers';
import TransferDetail from '@/pages/TransferDetail';
import Beds from '@/pages/Beds';
import GreenChannel from '@/pages/GreenChannel';
import Admissions from '@/pages/Admissions';
import AdmissionDetail from '@/pages/AdmissionDetail';
import { useAuthStore } from '@/store/auth';
import type { ReactNode } from 'react';

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="records" element={<Records />} />
          <Route path="records/new" element={<RecordNew />} />
          <Route path="records/:id" element={<RecordDetail />} />
          <Route path="consultations" element={<Consultations />} />
          <Route path="consultations/:id" element={<ConsultationDetail />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="transfers/:id" element={<TransferDetail />} />
          <Route path="beds" element={<Beds />} />
          <Route path="green-channel" element={<GreenChannel />} />
          <Route path="admissions" element={<Admissions />} />
          <Route path="admissions/:transferId" element={<AdmissionDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
