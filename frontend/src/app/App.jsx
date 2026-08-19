import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../features/auth/AuthContext";
import { CartProvider } from "../context/CartContext";
import Routers from "../routes/Routers";
import ErrorBoundary from "../components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routers />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
