import React, {useState} from "react";

const WialonLogin = () => {
  const [loginStatus, setLoginStatus] = useState("");
  const [userName, setUserName] = useState("");

  // Get the token from the environment variable
  const token = import.meta.env.VITE_WIALON_TOKEN;

  const login = () => {
    const sess = window.wialon.core.Session.getInstance(); // Get instance of current session
    const user = sess.getCurrUser(); // Get current user

    if (user) {
      setLoginStatus(`You are logged in as '${user.getName()}', click logout first`);
      return;
    }

    if (!token) {
      setLoginStatus("Token not found in environment variables.");
      return;
    }

    setLoginStatus(`Trying to login with token '${token}'...`);
    sess.initSession("https://hst-api.wialon.com"); // Initialize Wialon session

    sess.loginToken(token, "", (code) => {
      if (code) {
        setLoginStatus(`Login failed: ${window.wialon.core.Errors.getErrorText(code)}`);
      } else {
        setLoginStatus("Logged in successfully!");
        const user = sess.getCurrUser();
        if (user) {
          setUserName(user.getName());
        }
      }
    });
  };

  const logout = () => {
    const sess = window.wialon.core.Session.getInstance();
    const user = sess.getCurrUser();
    if (!user) {
      setLoginStatus("You are not logged in, click 'login' first.");
      return;
    }

    sess.logout((code) => {
      if (code) {
        setLoginStatus(`Logout failed: ${window.wialon.core.Errors.getErrorText(code)}`);
      } else {
        setLoginStatus("Logged out successfully!");
        setUserName(""); // Clear the current user name
      }
    });
  };

  const getUser = () => {
    const sess = window.wialon.core.Session.getInstance();
    const user = sess.getCurrUser();
    if (!user) {
      setLoginStatus("You are not logged in, click 'login' first.");
    } else {
      setLoginStatus(`You are logged in as '${user.getName()}'`);
    }
  };

  return (
    <div>
      <h1>Wialon Login</h1>
      <button onClick={login}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={getUser}>Get User</button>
      <div>
        <h3>Status:</h3>
        <p>{loginStatus}</p>
        {userName && <p>Logged in as: {userName}</p>}
      </div>
    </div>
  );
};

export default WialonLogin;
