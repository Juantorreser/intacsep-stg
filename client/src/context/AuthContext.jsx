import {createContext, useState, useEffect, useContext, useRef, useCallback} from "react";
import {useNavigate} from "react-router-dom";
import PropTypes from "prop-types";

const AuthContext = createContext(undefined);

const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const navigate = useNavigate();
  const [showInactivityPopup, setShowInactivityPopup] = useState(false);
  const inactivityTimeoutRef = useRef(null);
  const [timeoutMinutes, setTimeoutMinutes] = useState(5);

  useEffect(() => {
    const fetchTimeout = async () => {
      try {
        const res = await fetch(`${baseUrl}/inactividad/me`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data?.value) {
          setTimeoutMinutes(data.value);
        }
      } catch (err) {
        console.error("Failed to fetch inactivity timeout", err);
      }
    };

    if (user) fetchTimeout();
  }, [user, baseUrl]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = setTimeout(() => {
      setShowInactivityPopup(true);
    }, timeoutMinutes * 60 * 1000);
  }, [timeoutMinutes]);

  useEffect(() => {
    if (user) {
      resetInactivityTimer();

      const activityEvents = ["mousemove", "keydown", "click"];
      const handler = () => resetInactivityTimer();
      activityEvents.forEach((event) => window.addEventListener(event, handler));

      return () => {
        activityEvents.forEach((event) => window.removeEventListener(event, handler));
        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
      };
    }
  }, [user, resetInactivityTimer]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${baseUrl}/logout`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
      });
      setUser(null);
      navigate("/");
    } catch (e) {
      console.error("Error during logout:", e);
      setUser(null);
      navigate("/");
    }
  }, [baseUrl, navigate]);

  const handleRedirectToLogin = () => {
    setShowInactivityPopup(false);
    logout();
  };

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/refresh_token`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }
      return await response.json();
    } catch (e) {
      console.error("Error refreshing token:", e);
      logout();
      return null;
    }
  }, [baseUrl, logout]);

  const verifyToken = useCallback(async () => {
    try {
      let response = await fetch(`${baseUrl}/protected`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
      });

      if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          response = await fetch(`${baseUrl}/protected`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
          });
        } else {
          return null;
        }
      }

      if (!response.ok) return null;
      
      const data = await response.json();
      return data.user;
    } catch (e) {
      console.error("Error verifying token:", e);
      navigate("/login");
      return null;
    }
  }, [baseUrl, navigate, refreshToken]);

  const login = useCallback(async (email, password) => {
    const errorMsg = document.getElementById("errorMsg");
    if (errorMsg) errorMsg.classList.add("visually-hidden");
    try {
      const response = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password}),
        credentials: "include",
      });

      if (!response.ok) {
        if (errorMsg) errorMsg.classList.remove("visually-hidden");
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }
      if (errorMsg) errorMsg.classList.add("visually-hidden");
      const data = await response.json();
      setUser(data.user);
      navigate("/bitacoras");
    } catch (e) {
      console.error("Error during login:", e);
    }
  }, [baseUrl, navigate]);

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
