import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Profile from "./pages/Profile.jsx";
import Explorer from "./pages/Explorer.jsx";
import Interview from "./pages/Interview.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Profile />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/interview" element={<Interview />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
