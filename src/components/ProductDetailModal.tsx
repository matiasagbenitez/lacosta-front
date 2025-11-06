import React, { useEffect, useState } from "react";
import { Modal, Button, Row, Col, Form } from "react-bootstrap";
import { Product } from "../types/Product";
import toast from "react-hot-toast";

interface ProductDetailModalProps {
  show: boolean;
  onHide: () => void;
  product: Product | null;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onProductUpdate?: (updatedProduct: Product) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  show,
  onHide,
  product,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
  onProductUpdate,
}) => {
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsText, setCommentsText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(product);

  // Actualizar producto local cuando cambia el prop
  useEffect(() => {
    setCurrentProduct(product);
    if (product) {
      setCommentsText(product.comments || "");
    }
  }, [product]);

  // Manejar navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!show) return;

      if (e.key === "ArrowLeft" && hasPrevious && onPrevious) {
        onPrevious();
      } else if (e.key === "ArrowRight" && hasNext && onNext) {
        onNext();
      } else if (e.key === "Escape") {
        if (showCommentsModal) {
          setShowCommentsModal(false);
        } else {
          onHide();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    show,
    hasPrevious,
    hasNext,
    onPrevious,
    onNext,
    onHide,
    showCommentsModal,
  ]);

  if (!currentProduct) return null;

  const handleToggleAvailability = async () => {
    if (!currentProduct || !onProductUpdate) return;

    try {
      setIsUpdating(true);
      const { productApi } = await import("../services/api");
      const updatedProduct = await productApi.toggleAvailability(
        currentProduct.id
      );
      setCurrentProduct(updatedProduct);
      onProductUpdate(updatedProduct);
      toast.success(
        `Producto ${updatedProduct.available ? "disponible" : "no disponible"}`
      );
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar disponibilidad");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveComments = async () => {
    if (!currentProduct || !onProductUpdate) return;

    try {
      setIsUpdating(true);
      const { productApi } = await import("../services/api");
      const updatedProduct = await productApi.updateComments(
        currentProduct.id,
        commentsText
      );
      setCurrentProduct(updatedProduct);
      onProductUpdate(updatedProduct);
      setShowCommentsModal(false);
      toast.success("Comentarios guardados exitosamente");
    } catch (error: any) {
      toast.error(error.message || "Error al guardar comentarios");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfk7cgSW1hZ2VuIG5vIGVuY29udHJhZGE8L3RleHQ+Cjwvc3ZnPg==";
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>📦 Detalles del Producto</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ position: "relative" }}>
        <Row>
          <Col xs={12} sm={12}>
            <h4 className="mb-4 text-center fw-bold">{currentProduct.name}</h4>
          </Col>
          {/* Imagen del producto */}
          {currentProduct.image_url && (
            <Col
              xs={5}
              className="mb-4 text-center"
              style={{ position: "relative" }}
            >
              {/* Botón anterior sobre la imagen */}
              {hasPrevious && onPrevious && (
                <Button
                  variant="light"
                  className="position-absolute"
                  style={{
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    borderRadius: "50%",
                    width: "35px",
                    height: "35px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.9,
                    zIndex: 10,
                  }}
                  onClick={onPrevious}
                  title="Producto anterior (←)"
                >
                  ←
                </Button>
              )}

              {/* Botón siguiente sobre la imagen */}
              {hasNext && onNext && (
                <Button
                  variant="light"
                  className="position-absolute"
                  style={{
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    borderRadius: "50%",
                    width: "35px",
                    height: "35px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.9,
                    zIndex: 10,
                  }}
                  onClick={onNext}
                  title="Producto siguiente (→)"
                >
                  →
                </Button>
              )}

              <img
                src={currentProduct.image_url || ""}
                alt={currentProduct.name || "Producto"}
                className="img-fluid rounded shadow"
                style={{
                  maxHeight: "400px",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
                onError={handleImageError}
              />
            </Col>
          )}

          {/* Información del producto */}
          <Col xs={7}>
            <Row className="mb-1">
              <Col xs={12} sm={3}>
                <strong>EAN:</strong>
              </Col>
              <Col xs={12} sm={9}>
                <code>{currentProduct.ean || "-"}</code>
              </Col>
            </Row>

            <Row className="mb-1">
              <Col xs={12} sm={3}>
                <strong>Nombre:</strong>
              </Col>
              <Col xs={12} sm={9}>
                {currentProduct.name || "-"}
              </Col>
            </Row>

            {currentProduct.original_name && (
              <Row className="mb-1">
                <Col xs={12} sm={3}>
                  <strong>Nombre Original:</strong>
                </Col>
                <Col xs={12} sm={9}>
                  {currentProduct.original_name}
                </Col>
              </Row>
            )}

            <Row className="mb-1">
              <Col xs={12} sm={3}>
                <strong>Marca:</strong>
              </Col>
              <Col xs={12} sm={9}>
                {currentProduct.brand || "-"}
              </Col>
            </Row>

            {currentProduct.category && (
              <Row className="mb-1">
                <Col xs={12} sm={3}>
                  <strong>Categoría:</strong>
                </Col>
                <Col xs={12} sm={9}>
                  {currentProduct.category}
                </Col>
              </Row>
            )}

            {currentProduct.type && (
              <Row className="mb-1">
                <Col xs={12} sm={3}>
                  <strong>Tipo:</strong>
                </Col>
                <Col xs={12} sm={9}>
                  {currentProduct.type}
                </Col>
              </Row>
            )}

            {currentProduct.variety && (
              <Row className="mb-1">
                <Col xs={12} sm={3}>
                  <strong>Variedad:</strong>
                </Col>
                <Col xs={12} sm={9}>
                  {currentProduct.variety}
                </Col>
              </Row>
            )}

            {currentProduct.description && (
              <Row className="mb-1">
                <Col xs={12} sm={3}>
                  <strong>Descripción:</strong>
                </Col>
                <Col xs={12} sm={9}>
                  <p
                    className="mb-0 text-break small"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 10, // 👈 número de líneas
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "normal",
                    }}
                  >
                    {currentProduct.description}
                  </p>
                </Col>
              </Row>
            )}
            {/* 
            {product.page && (
              <Row className="mb-1">
                <Col xs={12} sm={3}>
                  <strong>Página:</strong>
                </Col>
                <Col xs={12} sm={9}>
                  {product.page}
                </Col>
              </Row>
            )}

            {product.url && (
              <Row className="mb-1">
                <Col xs={12} sm={3}>
                  <strong>URL:</strong>
                </Col>
                <Col xs={12} sm={9}>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-break"
                  >
                    {product.url}
                  </a>
                </Col>
              </Row>
            )} */}

            {currentProduct.image_filename && (
              <Row className="mb-1">
                <Col xs={12} sm={3}>
                  <strong>Archivo:</strong>
                </Col>
                <Col xs={12} sm={9}>
                  <code className="small">{currentProduct.image_filename}</code>
                </Col>
              </Row>
            )}

            {/* Sección de Disponibilidad */}
            <Row className="mb-2 mt-3">
              <Col xs={12} sm={3}>
                <strong>Disponible:</strong>
              </Col>
              <Col xs={12} sm={9}>
                {onProductUpdate ? (
                  <Form.Switch
                    id="availability-toggle"
                    checked={currentProduct.available ?? true}
                    onChange={handleToggleAvailability}
                    disabled={isUpdating}
                    style={{ fontSize: "1rem" }}
                  />
                ) : (
                  <span
                    className={
                      currentProduct.available ? "text-success" : "text-danger"
                    }
                  >
                    {currentProduct.available
                      ? "✅ Disponible"
                      : "❌ No Disponible"}
                  </span>
                )}
              </Col>
            </Row>

            {/* Sección de Comentarios */}
            <Row className="mb-2">
              <Col xs={12} sm={3}>
                <div className="d-flex align-items-center gap-2">
                  <strong>Comentarios:</strong>
                  {onProductUpdate && (
                    <Button
                      variant="light"
                      size="sm"
                      className="px-1 py-0"
                      onClick={() => setShowCommentsModal(true)}
                    >
                      💬
                    </Button>
                  )}
                </div>
              </Col>
              <Col xs={12} sm={9}>
                {currentProduct.comments ? (
                  <p
                    className="mb-1 text-muted small"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {currentProduct.comments}
                  </p>
                ) : (
                  <p className="mb-1 text-muted small">Sin comentarios</p>
                )}
              </Col>
            </Row>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        {currentProduct.image_url && (
          <Button
            variant="primary"
            onClick={() => window.open(currentProduct.image_url!, "_blank")}
          >
            🔗 Abrir imagen en nueva pestaña
          </Button>
        )}
      </Modal.Footer>

      {/* Modal de Comentarios */}
      <Modal
        show={showCommentsModal}
        onHide={() => setShowCommentsModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>💬 Comentarios del Producto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Comentarios / Notas:</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              placeholder="Escribe comentarios o notas sobre este producto..."
              value={commentsText}
              onChange={(e) => setCommentsText(e.target.value)}
              disabled={isUpdating}
            />
            <Form.Text className="text-muted">
              Los comentarios se guardarán y podrás editarlos en cualquier
              momento.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCommentsModal(false)}
            disabled={isUpdating}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveComments}
            disabled={isUpdating}
          >
            {isUpdating ? "Guardando..." : "💾 Guardar"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Modal>
  );
};

export default ProductDetailModal;
