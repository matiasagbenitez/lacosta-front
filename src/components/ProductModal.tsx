import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { Product, ProductFormData } from "../types/Product";
import ImagePreviewModal from "./ImagePreviewModal";
import toast from "react-hot-toast";
import { categories, types, varieties } from "../data/constants";

interface ProductModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (productData: ProductFormData) => Promise<void>;
  product?: Product | null;
  isLoading?: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({
  show,
  onHide,
  onSave,
  product,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    ean: "",
    name: "",
    brand: "",
    page: "",
    url: "",
    description: "",
    category: "",
    type: "",
    variety: "",
    image_filename: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [showImagePreview, setShowImagePreview] = useState<boolean>(false);
  const [isPasting, setIsPasting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Resetear formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (show) {
      if (product) {
        // Modo edición
        setFormData({
          ean: product.ean || "",
          name: product.name || "",
          brand: product.brand || "",
          page: product.page || "",
          url: product.url || "",
          description: product.description || "",
          category: product.category || "Vinos",
          type: product.type || "",
          variety: product.variety || "",
          image_filename: product.image_filename || "",
        });
      } else {
        // Modo creación
        setFormData({
          ean: "",
          name: "",
          brand: "",
          page: "",
          url: "",
          description: "",
          category: "",
          type: "",
          variety: "",
          image_filename: "",
        });
      }
      setErrors({});
      setSubmitError("");
    }
  }, [show, product]);

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ean || !formData.ean.trim()) {
      newErrors.ean = "EAN es requerido";
    }

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = "Nombre es requerido";
    }

    if (!formData.brand || !formData.brand.trim()) {
      newErrors.brand = "Marca es requerida";
    }

    if (formData.url && formData.url.trim()) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(formData.url)) {
        newErrors.url = "URL debe ser válida (incluir http:// o https://)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitError("");
      await onSave(formData);
      onHide();
    } catch (error: any) {
      setSubmitError(error.message || "Error al guardar el producto");
    }
  };

  const isEditMode = !!product;

  const handleImageClick = () => {
    if (formData.image_filename) {
      setShowImagePreview(true);
    }
  };

  const getImageExtension = (mimeType: string): string => {
    const extensions: { [key: string]: string } = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/bmp": "bmp",
      "image/svg+xml": "svg",
    };
    return extensions[mimeType] || "jpg";
  };

  const saveImageToPublicFolder = async (
    imageBlob: Blob,
    filename: string
  ): Promise<void> => {
    // Verificar si el navegador soporta File System Access API
    if ("showSaveFilePicker" in window) {
      try {
        // @ts-ignore - File System Access API no está en los tipos de TypeScript aún
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "Imágenes",
              accept: {
                "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"],
              },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(imageBlob);
        await writable.close();

        return;
      } catch (error: any) {
        if (error.name === "AbortError") {
          throw new Error("Guardado cancelado por el usuario");
        }
        // Si falla, usar el método de descarga como fallback
      }
    }

    // Fallback: descargar la imagen
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const link = document.createElement("a");
          link.href = reader.result as string;
          link.download = filename;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Error al leer la imagen"));
      reader.readAsDataURL(imageBlob);
    });
  };

  const handlePasteImage = async () => {
    if (!formData.ean.trim()) {
      toast.error("Debe ingresar un EAN antes de pegar la imagen");
      return;
    }

    try {
      setIsPasting(true);

      // Leer del portapapeles
      const clipboardItems = await navigator.clipboard.read();

      let imageBlob: Blob | null = null;
      let mimeType = "";

      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith("image/")) {
            imageBlob = await clipboardItem.getType(type);
            mimeType = type;
            break;
          }
        }
        if (imageBlob) break;
      }

      if (!imageBlob) {
        toast.error("No se encontró ninguna imagen en el portapapeles");
        return;
      }

      // Obtener extensión basada en el tipo MIME
      const extension = getImageExtension(mimeType);
      const filename = `${formData.ean}.${extension}`;

      // Guardar imagen
      await saveImageToPublicFolder(imageBlob, filename);

      // Actualizar el campo de imagen en el formulario
      handleInputChange("image_filename", filename);

      // Mensaje de éxito diferente según el método usado
      if ("showSaveFilePicker" in window) {
        toast.success(
          `Imagen guardada como "${filename}". Asegúrate de guardarla en la carpeta public/images/ del proyecto.`
        );
      } else {
        toast.success(
          `Imagen descargada como "${filename}". Muévela a la carpeta public/images/ para que se muestre correctamente.`,
          {
            duration: 6000,
          }
        );
      }
    } catch (error: any) {
      console.error("Error al pegar imagen:", error);
      if (error.name === "NotAllowedError") {
        toast.error(
          "Permisos de portapapeles denegados. Verifique la configuración del navegador."
        );
      } else if (error.message.includes("clipboard")) {
        toast.error(
          "Error al acceder al portapapeles. Asegúrese de que hay una imagen copiada."
        );
      } else {
        toast.error(error.message || "Error al procesar la imagen");
      }
    } finally {
      setIsPasting(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!formData.image_filename) {
      toast.error("No hay imagen para eliminar");
      return;
    }

    // Confirmar eliminación
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar la imagen "${formData.image_filename}"?`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);

      // Verificar si el navegador soporta File System Access API
      if ("showDirectoryPicker" in window) {
        try {
          // @ts-ignore - File System Access API no está en los tipos de TypeScript aún
          const directoryHandle = await window.showDirectoryPicker();
          
          // Buscar el archivo en el directorio seleccionado
          try {
            const fileHandle = await directoryHandle.getFileHandle(formData.image_filename);
            await directoryHandle.removeEntry(formData.image_filename);
            
            // Limpiar el campo de imagen
            handleInputChange("image_filename", "");
            
            toast.success(`Imagen "${formData.image_filename}" eliminada correctamente`);
            return;
          } catch (error: any) {
            if (error.name === "NotFoundError") {
              toast.error(`No se encontró la imagen "${formData.image_filename}" en el directorio seleccionado`);
            } else {
              throw error;
            }
          }
        } catch (error: any) {
          if (error.name === "AbortError") {
            toast.success("Eliminación cancelada por el usuario");
            return;
          }
          // Si falla, usar método alternativo
        }
      }

      // Método alternativo: mostrar instrucciones al usuario
      toast.error(
        `Para eliminar la imagen "${formData.image_filename}", ve manualmente a la carpeta public/images/ y elimina el archivo.`,
        {
          duration: 8000,
        }
      );
      
      // Preguntar si quiere limpiar el campo de imagen del formulario
      const clearField = window.confirm(
        "¿Quieres limpiar el campo de imagen del formulario? (La imagen seguirá en el disco hasta que la elimines manualmente)"
      );
      
      if (clearField) {
        handleInputChange("image_filename", "");
        toast.success("Campo de imagen limpiado");
      }

    } catch (error: any) {
      console.error("Error al eliminar imagen:", error);
      toast.error(error.message || "Error al eliminar la imagen");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <div>
          <h5 className="mb-1 fw-bold">{isEditMode ? product?.name : "➕ Nuevo Producto"}</h5>
          <p className="text-muted mb-0 small">{product?.original_name}</p>
        </div>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {submitError && (
            <Alert variant="danger" className="mb-3">
              {submitError}
            </Alert>
          )}

          <Row>
            <Col md={7}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>EAN *</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="text"
                        value={formData.ean}
                        onChange={(e) =>
                          handleInputChange("ean", e.target.value)
                        }
                        isInvalid={!!errors.ean}
                        placeholder="Código EAN del producto"
                      />
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(formData.ean);
                          toast.success("Código EAN copiado al portapapeles");
                        }}
                      >
                        📋
                      </Button>
                    </div>
                    <Form.Control.Feedback type="invalid">
                      {errors.ean}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Marca *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.brand}
                      onChange={(e) =>
                        handleInputChange("brand", e.target.value)
                      }
                      isInvalid={!!errors.brand}
                      placeholder="Marca del producto"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.brand}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre *</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        isInvalid={!!errors.name}
                        placeholder="Nombre del producto"
                      />
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(formData.name);
                          toast.success("Nombre copiado al portapapeles");
                        }}
                      >
                        📋
                      </Button>
                    </div>
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Categoría</Form.Label>
                    <Form.Select
                      value={formData.category || ""}
                      onChange={(e) =>
                        handleInputChange("category", e.target.value)
                      }
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tipo</Form.Label>
                    <Form.Select
                      value={formData.type || ""}
                      onChange={(e) =>
                        handleInputChange("type", e.target.value)
                      }
                    >
                      <option value="">Selecciona un tipo</option>
                      {types.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Variedad</Form.Label>
                    <Form.Select
                      value={formData.variety || ""}
                      onChange={(e) =>
                        handleInputChange("variety", e.target.value)
                      }
                    >
                      <option value="">Selecciona una variedad</option>
                      {varieties.map((variety) => (
                        <option key={variety} value={variety}>{variety}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Descripción del producto"
                />
              </Form.Group>
            </Col>
            <Col md={5}>
              <Modal.Body className="text-center p-4">
                <div className="mb-3">
                  <img
                    src={
                      formData.image_filename
                        ? `/images/${formData.image_filename}`
                        : "/images/placeholder.jpg"
                    }
                    alt={formData.image_filename || "Sin imagen"}
                    className="img-fluid rounded shadow"
                    style={{
                      maxHeight: "500px",
                      maxWidth: "100%",
                      objectFit: "contain",
                      cursor: formData.image_filename ? "pointer" : "default",
                    }}
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholder.jpg";
                    }}
                    onClick={handleImageClick}
                    title={
                      formData.image_filename ? "Clic para ver en grande" : ""
                    }
                  />
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Imagen</Form.Label>
                  <div className="d-flex gap-2 mb-2">
                    <Form.Control
                      type="text"
                      value={formData.image_filename}
                      onChange={(e) =>
                        handleInputChange("image_filename", e.target.value)
                      }
                      placeholder="nombre-imagen.jpg"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handlePasteImage}
                      disabled={isPasting || !formData.ean.trim()}
                      title={
                        !formData.ean.trim()
                          ? "Ingrese un EAN primero"
                          : "Pegar imagen del portapapeles"
                      }
                      style={{ flex: 1 }}
                    >
                      {isPasting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Pegando...
                        </>
                      ) : (
                        <>📋 Pegar Imagen</>
                      )}
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleDeleteImage}
                      disabled={isDeleting || !formData.image_filename?.trim()}
                      title={
                        !formData.image_filename?.trim()
                          ? "No hay imagen para eliminar"
                          : "Eliminar imagen"
                      }
                    >
                      {isDeleting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Eliminando...
                        </>
                      ) : (
                        <>🗑️</>
                      )}
                    </Button>
                  </div>
                </Form.Group>
              </Modal.Body>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : isEditMode ? "Actualizar" : "Crear"}
          </Button>
        </Modal.Footer>
      </Form>

      {/* Modal de vista previa de imagen */}
      <ImagePreviewModal
        show={showImagePreview}
        onHide={() => setShowImagePreview(false)}
        imageName={formData.image_filename || ""}
        productName={formData.name || "Producto"}
      />
    </Modal>
  );
};

export default ProductModal;
