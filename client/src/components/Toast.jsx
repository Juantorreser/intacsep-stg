const TOAST_CONFIG = {
  success: {
    icon: "fa-circle-check",
    label: "Éxito",
    colorVar: "--toast-success",
  },
  error: {
    icon: "fa-circle-xmark",
    label: "Error",
    colorVar: "--toast-error",
  },
  warning: {
    icon: "fa-triangle-exclamation",
    label: "Advertencia",
    colorVar: "--toast-warning",
  },
  info: {
    icon: "fa-circle-info",
    label: "Info",
    colorVar: "--toast-info",
  },
};

const ToastItem = ({ toast, onRemove }) => {
  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  return (
    <div className={`toast-item toast-${toast.type}`} role="alert">
      <div className="toast-icon">
        <i className={`fa-solid ${config.icon}`}></i>
      </div>
      <div className="toast-body">
        <span className="toast-label">{config.label}</span>
        <span className="toast-message">{toast.message}</span>
      </div>
      <button className="toast-close" onClick={() => onRemove(toast.id)} aria-label="Cerrar">
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
};

const Toast = ({ toasts = [], removeToast }) => {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default Toast;
