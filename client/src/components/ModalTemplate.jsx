const ModalTemplate = ({
  show,
  title,
  onClose,
  onSubmit,
  children,
  cancelText = "Cancelar",
  submitText = "Guardar",
  cancelClass = "btn btn-danger",
  submitClass = "btn btn-success",
  hideFooter = false,
}) => {
  if (!show) return null;

  return (
    <section className="customModal">
      <div className="pm-backdrop" onClick={onClose}></div>
      <div className="pm-container">
        <div className="pm-header">
          <h2>{title}</h2>
          <button className="pm-close" onClick={onClose}>
            ×
          </button>
        </div>
        <hr />
        <div className="modal-scroll-body">
          <form className="pm-body" onSubmit={onSubmit}>
            {children}
            {!hideFooter && (
              <div className="pm-footer">
                <button type="button" className={cancelClass} onClick={onClose}>
                  {cancelText}
                </button>
                <button type="submit" className={submitClass}>
                  {submitText}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default ModalTemplate;
