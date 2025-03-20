import React, {createContext, useContext, useEffect, useState, useRef} from "react";

const WialonContext = createContext(null);
export const useWialon = () => useContext(WialonContext);

export const WialonProvider = ({children}) => {
  const [session, setSession] = useState(null);
  const [units, setUnits] = useState([]);
  const initialized = useRef(false); // Prevent multiple fetches

  const fetchAllUnits = async (sess, retries = 3, delay = 1000) => {
    try {
      const flags =
        window.wialon.item.Item.dataFlag.base | window.wialon.item.Unit.dataFlag.lastMessage;

      sess.loadLibrary("itemIcon");

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject("Library load timeout"), 5000);
        sess.updateDataFlags([{type: "type", data: "avl_unit", flags, mode: 0}], (code) => {
          clearTimeout(timeout);
          if (code) {
            reject(window.wialon.core.Errors.getErrorText(code));
          } else {
            resolve();
          }
        });
      });

      const fetchedUnits = sess.getItems("avl_unit") || [];
      const unitDetails = fetchedUnits.map((unit) => ({id: unit.getId(), name: unit.getName()}));
      setUnits(unitDetails);
      console.log("Unidades obtenidas:", unitDetails);
    } catch (error) {
      console.error("Error al obtener unidades, reintentando...", error);
      if (retries > 0) {
        console.log(`Retrying in ${delay}ms...`);
        setTimeout(() => fetchAllUnits(sess, retries - 1, delay), delay);
      } else {
        console.log("Max retries reached, failing...");
        setUnits([]);
      }
    }
  };

  const initializeWialonSession = async (token) => {
    if (!token) {
      console.error("No Wialon token available. Please log in.");
      return;
    }

    const sess = window.wialon.core.Session.getInstance();
    sess.initSession("https://hst-api.wialon.com");

    try {
      await new Promise((resolve, reject) => {
        sess.loginToken(token, "", (code) => {
          if (code) {
            reject(window.wialon.core.Errors.getErrorText(code));
          } else {
            resolve("Logged in successfully");
          }
        });
      });

      console.log("Wialon login successful.");
      setSession(sess);
      localStorage.setItem("wialonToken", token); // Store token for persistence
      fetchAllUnits(sess);
    } catch (error) {
      console.error("Error during Wialon login:", error);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const storedToken = localStorage.getItem("wialonToken") || import.meta.env.VITE_WIALON_TOKEN;
    if (storedToken) {
      initializeWialonSession(storedToken);
    }

    return () => {
      if (session?.getSessionId()) {
        session.logout(() => console.log("Wialon session closed"));
      }
    };
  }, []);

  return <WialonContext.Provider value={{session, units}}>{children}</WialonContext.Provider>;
};
