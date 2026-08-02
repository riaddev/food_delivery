import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../features/auth/AuthContext";
import { CartProvider } from "../context/CartContext";
import Routers from "../routes/Routers";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routers />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
