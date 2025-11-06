import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Product, ProductFormData } from "../types/Product";
import { productApi } from "../services/api";
import ProductModal from "./ProductModal";
import ConfirmModal from "./ConfirmModal";
import ImagePreviewModal from "./ImagePreviewModal";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados principales
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Estados de carga y errores
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Estados de modales
  const [showProductModal, setShowProductModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [imagePreviewProduct, setImagePreviewProduct] =
    useState<Product | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, selectedBrand, selectedCategory]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productsResponse, brandsData, categoriesData] = await Promise.all([
        productApi.getAll(),
        productApi.getBrands(),
        productApi.getCategories(),
      ]);

      setProducts(productsResponse.products);
      setBrands(brandsData);
      setCategories(categoriesData);
    } catch (err: any) {
      const errorMessage = err.message || "Error al cargar los datos";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Filtro por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          (product.name && product.name.toLowerCase().includes(search)) ||
          (product.ean && product.ean.toLowerCase().includes(search)) ||
          (product.brand && product.brand.toLowerCase().includes(search)) ||
          (product.description && product.description.toLowerCase().includes(search))
        );
    }

    // Filtro por marca
    if (selectedBrand !== "all") {
      filtered = filtered.filter((product) => product.brand === selectedBrand);
    }

    // Filtro por categoría
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    setFilteredProducts(filtered);
  };

  const handleCreateProduct = async (productData: ProductFormData) => {
    setActionLoading(true);
    try {
      const newProduct = await productApi.create(productData);
      setProducts((prev) => [...prev, newProduct]);
      toast.success("✅ Producto creado exitosamente");

      // Actualizar marcas y categorías si es necesario
      if (!brands.includes(newProduct.brand)) {
        setBrands((prev) => [...prev, newProduct.brand].sort());
      }
      if (newProduct.category && !categories.includes(newProduct.category)) {
        setCategories((prev) => [...prev, newProduct.category!].sort());
      }
    } catch (err: any) {
      toast.error(err.message || "Error al crear el producto");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProduct = async (productData: ProductFormData) => {
    if (!editingProduct) return;

    setActionLoading(true);
    try {
      const updatedProduct = await productApi.update(
        editingProduct.id,
        productData
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? updatedProduct : p))
      );
      toast.success("✅ Producto actualizado exitosamente");

      // Actualizar marcas y categorías si es necesario
      if (!brands.includes(updatedProduct.brand)) {
        setBrands((prev) => [...prev, updatedProduct.brand].sort());
      }
      if (
        updatedProduct.category &&
        !categories.includes(updatedProduct.category)
      ) {
        setCategories((prev) => [...prev, updatedProduct.category!].sort());
      }
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar el producto");
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;

    setActionLoading(true);
    try {
      await productApi.delete(deletingProduct.id);
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      setShowConfirmModal(false);
      setDeletingProduct(null);
      toast.success("✅ Producto eliminado exitosamente");
    } catch (err: any) {
      const errorMessage = err.message || "Error al eliminar el producto";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    setShowConfirmModal(true);
  };

  const openImageModal = (product: Product) => {
    setImagePreviewProduct(product);
    setShowImageModal(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBrand("all");
    setSelectedCategory("all");
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        withCredentials: true,
      });
      // Limpiar autorización de admin
      sessionStorage.removeItem('admin_authorized');
      toast.success('Sesión cerrada exitosamente');
      navigate("/login", { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Cargando productos...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-dark text-white">
              <Row className="align-items-center">
                <Col>
                  <div className="d-flex align-items-end gap-4">
                    <img src="/logo.png" alt="Logo" className="img-fluid" style={{ width: "100px" }} />
                    <h2 className="mb-0" style={{ fontSize: "24px" }}>Gestión de Productos</h2>
                  </div>
                </Col>
                <Col xs="auto" className="d-flex gap-2">
                  <Button variant="light" onClick={openCreateModal}>
                    ➕ Nuevo Producto
                  </Button>
                  <Button variant="info" onClick={() => navigate("/listado")}>
                    📋 Ver Listado
                  </Button>
                  <Button variant="outline-light" onClick={handleLogout}>
                    🚪 Salir
                  </Button>
                </Col>
              </Row>
            </Card.Header>

            <Card.Body>
              {error && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}

              {/* Filtros */}
              <Row className="mb-4">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>🔍 Buscar</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Buscar por nombre, EAN, marca..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label>🏷️ Marca</Form.Label>
                    <Form.Select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                    >
                      <option value="all">Todas las marcas</option>
                      {brands.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label>📂 Categoría</Form.Label>
                    <Form.Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">Todas las categorías</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={2} className="d-flex align-items-end">
                  <Button
                    variant="outline-secondary"
                    onClick={clearFilters}
                    className="w-100"
                  >
                    🗑️ Limpiar
                  </Button>
                </Col>
              </Row>

              {/* Información de resultados */}
              <Row className="mb-3">
                <Col>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">
                      Mostrando {filteredProducts.length} de {products.length}{" "}
                      productos
                    </span>
                    {(searchTerm ||
                      selectedBrand !== "all" ||
                      selectedCategory !== "all") && (
                      <Badge bg="info">Filtros aplicados</Badge>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Tabla de productos */}
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="table-dark">
                    <tr>
                      <th>EAN</th>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Marca</th>
                      <th>Categoría</th>
                      <th>Tipo</th>
                      <th>Variedad</th>
                      <th>Imagen</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-4">
                          {products.length === 0
                            ? "📦 No hay productos registrados"
                            : "🔍 No se encontraron productos con los filtros aplicados"}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr
                          key={product.id}
                          onDoubleClick={() => openEditModal(product)}
                        >
                          <td>
                            <code>{product.ean}</code>
                          </td>
                          <td>
                            <strong>{product.name}</strong>

                            <div className="text-muted small">
                              {product.original_name}
                            </div>
                          </td>
                          <td>
                            {product.description
                              ? product.description.length > 30
                                ? `${product.description.substring(0, 30)}...`
                                : product.description
                              : "-"}
                          </td>
                          <td>{product.brand}</td>
                          <td>{product.category || "-"}</td>
                          <td>{product.type || "-"}</td>
                          <td>{product.variety || "-"}</td>
                          <td>
                            <Button
                              variant={
                                product.image_filename ? "success" : "secondary"
                              }
                              size="sm"
                              disabled={!product.image_filename}
                              onClick={() =>
                                product.image_filename &&
                                openImageModal(product)
                              }
                              title={
                                product.image_filename
                                  ? "Ver imagen"
                                  : "Sin imagen"
                              }
                              style={{ minWidth: "60px" }}
                            >
                              {product.image_filename ? "📷" : "📷"}
                            </Button>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-dark"
                                size="sm"
                                onClick={() => openEditModal(product)}
                                title="Editar"
                              >
                                ✏️
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => openDeleteModal(product)}
                                title="Eliminar"
                              >
                                🗑️
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de producto */}
      <ProductModal
        show={showProductModal}
        onHide={() => setShowProductModal(false)}
        onSave={editingProduct ? handleUpdateProduct : handleCreateProduct}
        product={editingProduct}
        isLoading={actionLoading}
      />

      {/* Modal de confirmación */}
      <ConfirmModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={handleDeleteProduct}
        title="Eliminar Producto"
        message={`¿Estás seguro de que deseas eliminar el producto "${deletingProduct?.name || deletingProduct?.original_name}"? Esta acción no se puede deshacer.`}
        variant="danger"
        confirmText="Eliminar"
        isLoading={actionLoading}
      />

      {/* Modal de vista previa de imagen */}
      <ImagePreviewModal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        imageName={imagePreviewProduct?.image_filename || ""}
        imageUrl={imagePreviewProduct?.image_url || null}
        productName={imagePreviewProduct?.name || "Producto"}
      />
    </Container>
  );
};

export default ProductManagement;

