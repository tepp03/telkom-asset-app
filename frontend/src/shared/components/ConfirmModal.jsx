import './ConfirmModal.css';

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {title && <h2 className="modal-title">{title}</h2>}
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn-confirm" onClick={onConfirm}>Ya</button>
          <button className="modal-btn modal-btn-cancel" onClick={onCancel}>Tidak</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
