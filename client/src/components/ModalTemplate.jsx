const ModalTemplate = ({show, title, onClose, onSubmit, children}) => {
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
            <div className="pm-footer">
              <button type="button" className="btn btn-danger" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-success">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ModalTemplate;
