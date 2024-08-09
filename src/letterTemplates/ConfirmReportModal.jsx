import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

export function ConfirmReportModal({ show, onClose, onConfirm }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const handleReasonChange = (event) => {
    setSelectedReason(event.target.value);
  };

  const handleAdditionalInfoChange = (event) => {
    setAdditionalInfo(event.target.value);
  };

  const handleConfirm = () => {
    onConfirm(selectedReason, additionalInfo);
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Report a post</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="form-group">
          <label htmlFor="reportReason">Select a reason for reporting:</label>
          <select
            id="reportReason"
            className="form-control"
            value={selectedReason}
            onChange={handleReasonChange}
            required
          >
            <option value="">-- Select a reason --</option>
            <option value="Hate Speech">Hate Speech</option>
            <option value="Spam">Spam</option>
            <option value="Sexually Explicit or Violent Material">
              Sexually Explicit or Violent Material
            </option>
            <option value="Harassment">Harassment</option>
            <option value="Misinformation">Misinformation</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group mt-3">
          <label htmlFor="additionalInfo">Additional information (optional):</label>
          <textarea
            id="additionalInfo"
            className="form-control"
            rows="4"
            value={additionalInfo}
            onChange={handleAdditionalInfoChange}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="custom-button secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="custom-button danger"
          onClick={handleConfirm}
          disabled={!selectedReason}
        >
          Report
        </button>
      </Modal.Footer>
    </Modal>
  );
}
