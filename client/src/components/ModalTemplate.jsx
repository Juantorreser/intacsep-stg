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
  submitDisabled = false,
  hideFooter = false,
  wide = false,
}) => {
  if (!show) return null;

  return (
    <section className="customModal">
      <div className="pm-backdrop" onClick={onClose}></div>
      <div className={`pm-container${wide ? " pm-container--wide" : ""}`}>
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
                <button type="submit" className={submitClass} disabled={submitDisabled}>
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
