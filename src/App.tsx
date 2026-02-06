import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import KYC from "./pages/KYC";

const App = () => {
  return (
    <>
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          {/* Public KYC route - no auth protection */}
          <Route path="/" element={<KYC />} />
          <Route path="/kyc" element={<KYC />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
