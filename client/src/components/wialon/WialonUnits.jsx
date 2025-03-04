import React, {useState, useEffect} from "react";

const WialonUnitInfo = () => {
  const [unitInfo, setUnitInfo] = useState([]);
  const [loginStatus, setLoginStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState(null);
  const token = import.meta.env.VITE_WIALON_TOKEN;

  useEffect(() => {
    const sess = window.wialon.core.Session.getInstance();

    if (!token) {
      setLoginStatus("Token not found in environment variables.");
      return;
    }

    sess.initSession("https://hst-api.wialon.com");

    sess.loginToken(token, "", (code) => {
      if (code) {
        setLoginStatus(`Login failed: ${window.wialon.core.Errors.getErrorText(code)}`);
      } else {
        setLoginStatus("Logged in successfully!");
        fetchAllUnits(sess);
      }
    });
  }, [token]);

  const fetchAllUnits = (sess) => {
    const flags =
      window.wialon.item.Item.dataFlag.base | window.wialon.item.Unit.dataFlag.lastMessage;

    sess.loadLibrary("itemIcon");
    sess.updateDataFlags([{type: "type", data: "avl_unit", flags, mode: 0}], (code) => {
      if (code) {
        setUnitInfo([]);
        return;
      }

      const units = sess.getItems("avl_unit") || [];
      const unitDetails = units.map((unit) => ({id: unit.getId(), name: unit.getName()}));
      setUnitInfo(unitDetails);
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelectUnit = (e) => {
    const unitId = parseInt(e.target.value);
    const sess = window.wialon.core.Session.getInstance();
    fetchUnitInfo(sess, unitId);
  };

  const fetchUnitInfo = (sess, unitId) => {
    const unit = sess.getItems("avl_unit").find((u) => u.getId() === unitId);
    if (unit) {
      setSelectedUnit(formatUnitDetails(unit));
    } else {
      setSelectedUnit("Unit not found.");
    }
  };

  const formatUnitDetails = (unit) => {
    let details = `<b>${unit.getName()}</b>`;
    const icon = unit.getIconUrl(32);
    if (icon) {
      details = `<img src="${icon}" alt="unit icon" /> ${details}`;
    }

    const pos = unit.getPosition();
    if (pos) {
      const time = window.wialon.util.DateTime.formatTime(pos.t);
      details += `<br/><b>Last message</b>: ${time}<br/><b>Position</b>: ${pos.x}, ${pos.y}<br/><b>Speed</b>: ${pos.s}`;
      window.wialon.util.Gis.getLocations([{lon: pos.x, lat: pos.y}], (code, address) => {
        if (!code) {
          setSelectedUnit(`${details}<br/><b>Location</b>: ${address}`);
        }
      });
    } else {
      details += "<br/><b>Location</b>: Unknown";
    }
    return details;
  };

  const filteredUnits = unitInfo.filter(
    (unit) =>
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.id.toString().includes(searchTerm)
  );

  return (
    <div>
      <h1>Wialon Unit Information</h1>
      <h3>Status: {loginStatus}</h3>

      <div>
        <h3>Search and Select a Unit:</h3>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search units by name or ID"
          list="units"
        />
        <datalist id="units">
          {filteredUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name} (ID: {unit.id})
            </option>
          ))}
        </datalist>
        <button onClick={handleSelectUnit} value={searchTerm}>
          Select
        </button>
      </div>

      {selectedUnit && <div dangerouslySetInnerHTML={{__html: selectedUnit}} />}
    </div>
  );
};

export default WialonUnitInfo;
