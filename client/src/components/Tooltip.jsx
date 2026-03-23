import {useState} from "react";

const Tooltip = ({children, text, position = "top"}) => {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && text && (
        <span className={`tooltip-bubble tooltip-${position}`}>{text}</span>
      )}
    </span>
  );
};

export default Tooltip;
