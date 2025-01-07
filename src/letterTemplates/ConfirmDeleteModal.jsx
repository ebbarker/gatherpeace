import React from 'react';
import { Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

export function ConfirmDeleteModal({ show, onClose, onConfirm }) {
  return (
    <Modal show={show} onHide={onClose}>
<Modal.Header>
        <Modal.Title>Confirm Delete</Modal.Title>
        <button type="button" className="custom-close-button" onClick={onClose}>
          &times;
        </button>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete your post?
      </Modal.Body>
      <Modal.Footer>
        <button className="custom-button secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="custom-button danger" onClick={onConfirm}>
          Delete
        </button>
      </Modal.Footer>
    </Modal>
  );
}
