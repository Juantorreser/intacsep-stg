import React, {createContext, useContext, useEffect, useState, useRef} from "react";

const WialonContext = createContext(null);

export const useWialon = () => useContext(WialonContext);

export const WialonProvider = ({children}) => {
  const [session, setSession] = useState(null);
  const [units, setUnits] = useState([]);
  const initialized = useRef(false); // 👈 Track if fetchAllUnits was already executed

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

  useEffect(() => {
    if (initialized.current) {
      return;
    } // 👈 Prevent multiple fetches
    initialized.current = true; // 👈 Mark as initialized

    const sess = window.wialon.core.Session.getInstance();
    const token = import.meta.env.VITE_WIALON_TOKEN;

    sess.initSession("https://hst-api.wialon.com");

    sess.loginToken(token, "", (code) => {
      if (code) {
        console.error("Wialon login failed:", window.wialon.core.Errors.getErrorText(code));
      } else {
        console.log("Wialon logged in successfully!");
        setSession(sess);
        fetchAllUnits(sess);
      }
    });

    return () => {
      if (sess.getSessionId()) {
        sess.logout(() => console.log("Wialon session closed"));
      }
    };
  }, []);

  return <WialonContext.Provider value={{session, units}}>{children}</WialonContext.Provider>;
};
