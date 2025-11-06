import React from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';

interface ConfirmModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  onHide,
  onConfirm,
  title,
  message,
  variant = 'danger',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {getIcon()} {title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Alert variant={variant} className="mb-0">
          {message}
        </Alert>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={handleConfirm} disabled={isLoading}>
          {isLoading ? 'Procesando...' : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;
