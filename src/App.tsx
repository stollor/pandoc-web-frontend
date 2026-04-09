import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { useEffect } from "react";
import { useConverterStore } from "@/store/useConverterStore";

export default function App() {
  const initWasm = useConverterStore((state) => state.initWasm);

  useEffect(() => {
    initWasm();
  }, [initWasm]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
