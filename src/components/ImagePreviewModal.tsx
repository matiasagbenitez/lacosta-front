import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface ImagePreviewModalProps {
  show: boolean;
  onHide: () => void;
  imageName: string;
  imageUrl?: string | null;
  productName: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  show,
  onHide,
  imageName,
  imageUrl,
  productName
}) => {
  // Usar la URL presignada si está disponible, sino usar la ruta local
  const displayUrl = imageUrl || '';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfk7cgSW1hZ2VuIG5vIGVuY29udHJhZGE8L3RleHQ+Cjwvc3ZnPg==';
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          🖼️ Vista previa - {productName}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="text-center p-4">
        <div className="mb-3">
          <img
            src={displayUrl}
            alt={productName}
            className="img-fluid rounded shadow"
            style={{ 
              maxHeight: '70vh', 
              maxWidth: '100%',
              objectFit: 'contain'
            }}
            onError={handleImageError}
          />
        </div>
        
        <div className="text-muted small">
          <strong>Archivo:</strong> {imageName}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        <Button 
          variant="primary" 
          onClick={() => window.open(displayUrl, '_blank')}
          title="Abrir imagen en nueva pestaña"
        >
          🔗 Abrir en nueva pestaña
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImagePreviewModal;
