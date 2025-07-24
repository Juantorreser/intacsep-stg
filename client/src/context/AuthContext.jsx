import {createContext, useState, useEffect, useContext, useRef} from "react";
import {useNavigate} from "react-router-dom";
import PropTypes from "prop-types";

const AuthContext = createContext(undefined);

const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const navigate = useNavigate();
  const [showInactivityPopup, setShowInactivityPopup] = useState(false);
  const inactivityTimeoutRef = useRef(null);
  const [timeoutMinutes, setTimeoutMinutes] = useState(5); // Default to 5 if not fetched

  useEffect(() => {
    const fetchTimeout = async () => {
      try {
        const res = await fetch(`${baseUrl}/inactividad`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data?.[0]?.value) {
          setTimeoutMinutes(data[0].value);
        }
      } catch (err) {
        console.error("Failed to fetch inactivity timeout", err);
      }
    };

    if (user) fetchTimeout();
  }, [user]);

  const resetInactivityTimer = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = setTimeout(() => {
      console.log("User inactive");
      setShowInactivityPopup(true);
    }, timeoutMinutes * 60 * 1000); // Convert minutes to ms
  };

  useEffect(() => {
    if (user) {
      resetInactivityTimer(); // Set initial timer

      const activityEvents = ["mousemove", "keydown", "click"];
      activityEvents.forEach((event) => window.addEventListener(event, resetInactivityTimer));

      return () => {
        activityEvents.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
        clearTimeout(inactivityTimeoutRef.current);
      };
    }
  }, [user, timeoutMinutes]);

  // Remove handleUserActivity as it is not used

  const handleRedirectToLogin = () => {
    setShowInactivityPopup(false);
    logout();
  };

  // useEffect(() => {
  //   handleUserActivity(); // Initialize the inactivity timer

  //   window.addEventListener("mousemove", handleUserActivity);
  //   window.addEventListener("keypress", handleUserActivity);
  //   return () => {
  //     window.removeEventListener("mousemove", handleUserActivity);
  //     window.removeEventListener("keypress", handleUserActivity);
  //     if (inactivityTimeoutRef.current) {
  //       clearTimeout(inactivityTimeoutRef.current);
  //     }
  //   };
  // }, [user, seconds]);

  const verifyToken = async () => {
    try {
      // console.log("VERIFIED");

      const response = await fetch(`${baseUrl}/protected`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
      });

      if (response.status === 401) {
        // Attempt to refresh token if unauthorized
        await refreshToken();
        return; // Do not set user here; refreshToken will handle it
      }

      const data = await response.json();
      // setUser(data.user);
      return data.user;
    } catch (e) {
      console.error("Error verifying token:", e);
      // setUser(null); // Set user to null if there's an error
      navigate("/login");
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch(`${baseUrl}/refresh_token`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      await response.json();
      await verifyToken(); // Verify the token again after refreshing
    } catch (e) {
      console.error("Error refreshing token:", e);
      logout(); // Optionally, navigate to login or home
    }
  };
  const login = async (email, password) => {
    const errorMsg = document.getElementById("errorMsg");
    errorMsg.classList.add("visually-hidden");
    try {
      const response = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password}),
        credentials: "include",
      });

      if (!response.ok) {
        // Read the response JSON to get the error message
        console.log("ERROR");
        errorMsg.classList.remove("visually-hidden");
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }
      errorMsg.classList.add("visually-hidden");
      const data = await response.json();
      setUser(data.user);
      navigate("/dashboard"); // Always redirect to dashboard after login
    } catch (e) {
      console.error("Error during login:", e);
      // Show an appropriate error message to the user
    }
  };

  const logout = async () => {
    try {
      const response = await fetch(`${baseUrl}/logout`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setUser(null); // Clear user state upon logout
      navigate("/"); // Navigate to the home or login page
    } catch (e) {
      console.error("Error during logout:", e);
      setUser(null); // Clear user state upon logout
      navigate("/"); // Navigate to the home or login page
    }
  };

  return (
    <AuthContext.Provider value={{user, login, logout, verifyToken, refreshToken, setUser}}>
      {children}
      {showInactivityPopup && (
        <div className="inactivity-popup">
          <div className="content">
            <i className="fa fa-info-circle"></i>
            <h1>Sesión Expirada</h1>
            <p>Su sesión ha expirado debido al tiempo de inactividad.</p>
            <p>Favor de iniciar sesión nuevamente</p>
            <button onClick={handleRedirectToLogin}>Iniciar Sesión</button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export {AuthContext, AuthProvider};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
