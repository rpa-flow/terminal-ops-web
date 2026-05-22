import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { RecordsPage } from "./pages/RecordsPage";
import { PurchaseOrderRulesPage } from "./pages/PurchaseOrderRulesPage";
import { CatalogPage } from "./pages/CatalogPage";

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
