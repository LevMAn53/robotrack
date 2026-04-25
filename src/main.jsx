import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Quiz from "./pages/Quiz";
import Results from "./pages/Results";
import Dashboard from "./pages/Dashboard";
import Student from "./pages/Student";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Quiz />} />
      <Route path="/results/:id" element={<Results />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/student/:id" element={<Student />} />
    </Routes>
  </BrowserRouter>
);
