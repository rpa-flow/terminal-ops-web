import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import { CatalogPage } from "./pages/CatalogPage";
import { LoginPage } from "./pages/LoginPage";
import { RecordsPage } from "./pages/RecordsPage";
import { NotesPage } from "./pages/NotesPage";
import { PurchaseOrderRulesPage } from "./pages/PurchaseOrderRulesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ShipmentsPage } from "./pages/ShipmentsPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/purchase-order-rules" element={<ProtectedRoute><PurchaseOrderRulesPage /></ProtectedRoute>} />
        <Route path="/catalog" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RecordsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notas"
          element={
            <ProtectedRoute>
              <NotesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/relatorios/:area"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/relatorios" element={<Navigate to="/relatorios/tbjc" replace />} />
        <Route path="/embarques/:area" element={<ProtectedRoute><ShipmentsPage /></ProtectedRoute>} />
        <Route path="/embarques" element={<Navigate to="/embarques/tbjc" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
