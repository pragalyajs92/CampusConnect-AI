import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login / Signup */}
        <Route path="/" element={<Login />} />

        {/* Student */}
        <Route
          path="/student"
          element={<StudentDashboard />}
        />

        {/* Faculty */}
        <Route
          path="/faculty"
          element={<FacultyDashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;