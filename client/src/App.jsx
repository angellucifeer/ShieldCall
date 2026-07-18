import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Splash from "./pages/Splash/Splash";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Home from "./pages/Dashboard/Home";
import Profile from "./pages/Profile/Profile";
import CallScreen from "./pages/Calling/CallScreen";
import Settings from "./pages/Settings/Settings";
import Chat from "./pages/Chat/chat";

import useAuth from "./hooks/useAuth";
import useCall from "./hooks/useCall";

import IncomingCall from "./components/Calling/IncomingCall";
import ProtectedRoute from "./components/Common/ProtectedRoute";

function App() {
const location = useLocation();
  const { user } = useAuth();

  const {
    incomingCall,
    answer,
    decline,
  } = useCall(user);

  return (
    <>

      {location.pathname !== "/call" && (
    <IncomingCall
        call={incomingCall}
        onAnswer={answer}
        onDecline={decline}
    />
)}

      <Routes>

        <Route path="/" element={<Splash />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/call"
          element={
            <ProtectedRoute>
              <CallScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </>
  );
}

export default App;