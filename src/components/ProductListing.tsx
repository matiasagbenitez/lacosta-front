import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  InputGroup,
  Alert,
  Spinner,
  Badge,
  Button,
  Pagination,
} from "react-bootstrap";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Product } from "../types/Product";
import { productApi } from "../services/api";
import ProductDetailModal from "./ProductDetailModal";
import LazyImage from "./LazyImage";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";
const ITEMS_PER_PAGE = 100;

const ProductListing: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Leer estados iniciales de los query params
  const getInitialPage = () => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  };

  const getInitialSearch = () => searchParams.get("search") || "";
  const getInitialBrand = () => searchParams.get("brand") || "all";
  const getInitialCategory = () => searchParams.get("category") || "all";
  const getInitialAvailable = () => searchParams.get("available") || "all";

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState(getInitialSearch);
  const [selectedBrand, setSelectedBrand] = useState(getInitialBrand);
  const [selectedCategory, setSelectedCategory] = useState(getInitialCategory);
  const [selectedAvailable, setSelectedAvailable] = useState(getInitialAvailable);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Estado del modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Función para actualizar los query params
  const updateSearchParams = (updates: {
    page?: number;
    search?: string;
    brand?: string;
    category?: string;
    available?: string;
  }) => {
    const newParams = new URLSearchParams(searchParams);

    if (updates.page !== undefined) {
      if (updates.page === 1) {
        newParams.delete("page");
      } else {
        newParams.set("page", updates.page.toString());
      }
    }

    if (updates.search !== undefined) {
      if (updates.search === "") {
        newParams.delete("search");
      } else {
        newParams.set("search", updates.search);
      }
    }

    if (updates.brand !== undefined) {
      if (updates.brand === "all") {
        newParams.delete("brand");
      } else {
        newParams.set("brand", updates.brand);
      }
    }

    if (updates.category !== undefined) {
      if (updates.category === "all") {
        newParams.delete("category");
      } else {
        newParams.set("category", updates.category);
      }
    }

    if (updates.available !== undefined) {
      if (updates.available === "all") {
        newParams.delete("available");
      } else {
        newParams.set("available", updates.available);
      }
    }

    // Siempre incluir limit en los params cuando hay paginación
    newParams.set("limit", ITEMS_PER_PAGE.toString());

    setSearchParams(newParams, { replace: true });
  };

  // Flag para evitar actualizar query params en la primera carga
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs para rastrear valores anteriores de filtros
  const prevFiltersRef = React.useRef({
    searchTerm,
    selectedBrand,
    selectedCategory,
    selectedAvailable,
  });

  // Sincronizar estados con query params cuando estos cambien externamente
  useEffect(() => {
    const pageFromUrl = searchParams.get("page");
    const searchFromUrl = searchParams.get("search") || "";
    const brandFromUrl = searchParams.get("brand") || "all";
    const categoryFromUrl = searchParams.get("category") || "all";
    const availableFromUrl = searchParams.get("available") || "all";

    if (isInitialized) {
      // Solo actualizar si hay diferencias para evitar loops
      if (pageFromUrl && parseInt(pageFromUrl, 10) !== currentPage) {
        setCurrentPage(parseInt(pageFromUrl, 10));
      }
      if (searchFromUrl !== searchTerm) {
        setSearchTerm(searchFromUrl);
      }
      if (brandFromUrl !== selectedBrand) {
        setSelectedBrand(brandFromUrl);
      }
      if (categoryFromUrl !== selectedCategory) {
        setSelectedCategory(categoryFromUrl);
      }
      if (availableFromUrl !== selectedAvailable) {
        setSelectedAvailable(availableFromUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Cargar marcas y categorías una sola vez
  useEffect(() => {
    loadBrandsAndCategories();
    // Marcar como inicializado después de un pequeño delay para permitir que los estados se establezcan
    const timer = setTimeout(() => {
      setIsInitialized(true);
      // Asegurar que limit esté en los params al inicializar
      const newParams = new URLSearchParams(searchParams);
      if (currentPage !== 1) {
        newParams.set("page", currentPage.toString());
      }
      if (searchTerm) {
        newParams.set("search", searchTerm);
      }
      if (selectedBrand !== "all") {
        newParams.set("brand", selectedBrand);
      }
      if (selectedCategory !== "all") {
        newParams.set("category", selectedCategory);
      }
      if (selectedAvailable !== "all") {
        newParams.set("available", selectedAvailable);
      }
      newParams.set("limit", ITEMS_PER_PAGE.toString());
      setSearchParams(newParams, { replace: true });
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar productos cuando cambien los filtros o la página
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, selectedBrand, selectedCategory, selectedAvailable]);

  // Actualizar query params cuando cambien los estados (solo después de la inicialización)
  useEffect(() => {
    if (isInitialized) {
      updateSearchParams({
        page: currentPage,
        search: searchTerm,
        brand: selectedBrand,
        category: selectedCategory,
        available: selectedAvailable,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, selectedBrand, selectedCategory, selectedAvailable, isInitialized]);

  // Resetear a página 1 cuando cambien los filtros (solo si no es la carga inicial)
  useEffect(() => {
    if (isInitialized) {
      const filtersChanged =
        prevFiltersRef.current.searchTerm !== searchTerm ||
        prevFiltersRef.current.selectedBrand !== selectedBrand ||
        prevFiltersRef.current.selectedCategory !== selectedCategory ||
        prevFiltersRef.current.selectedAvailable !== selectedAvailable;

      if (filtersChanged && currentPage !== 1) {
        setCurrentPage(1);
      }

      // Actualizar la referencia
      prevFiltersRef.current = { searchTerm, selectedBrand, selectedCategory, selectedAvailable };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedBrand, selectedCategory, selectedAvailable, isInitialized]);

  const loadBrandsAndCategories = async () => {
    try {
      const [brandsData, categoriesData] = await Promise.all([
        productApi.getBrands(),
        productApi.getCategories(),
      ]);

      setBrands(brandsData);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error("Error al cargar marcas y categorías:", err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const filters: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };

      if (selectedBrand !== "all") {
        filters.brand = selectedBrand;
      }

      if (selectedCategory !== "all") {
        filters.category = selectedCategory;
      }

      if (selectedAvailable !== "all") {
        filters.available = selectedAvailable;
      }

      if (searchTerm) {
        filters.search = searchTerm;
      }

      const response = await productApi.getAll(filters);

      setProducts(response.products);

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages);
        setTotalProducts(response.pagination.total);
      } else {
        // Fallback si no hay paginación (no debería pasar)
        setTotalPages(1);
        setTotalProducts(response.products.length);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Error al cargar los datos";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProductDoubleClick = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const getCurrentProductIndex = (): number => {
    if (!selectedProduct) return -1;
    return products.findIndex((p) => p.id === selectedProduct.id);
  };

  const handlePreviousProduct = () => {
    const currentIndex = getCurrentProductIndex();
    if (currentIndex > 0) {
      setSelectedProduct(products[currentIndex - 1]);
    } else if (currentPage > 1) {
      // Si estamos al inicio de la página y hay página anterior, cambiar de página
      setCurrentPage(currentPage - 1);
      // El producto se establecerá cuando se cargue la nueva página
    }
  };

  const handleNextProduct = () => {
    const currentIndex = getCurrentProductIndex();
    if (currentIndex < products.length - 1) {
      setSelectedProduct(products[currentIndex + 1]);
    } else if (currentPage < totalPages) {
      // Si estamos al final de la página y hay página siguiente, cambiar de página
      setCurrentPage(currentPage + 1);
      // El producto se establecerá cuando se cargue la nueva página
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Cerrar modal si está abierto al cambiar de página
    if (showDetailModal) {
      setShowDetailModal(false);
      setSelectedProduct(null);
    }
    // Scroll al principio de la página
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Botón Primera página
    if (startPage > 1) {
      items.push(
        <Pagination.First key="first" onClick={() => handlePageChange(1)} />
      );
      items.push(
        <Pagination.Prev
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
      );
    }

    // Botones de páginas
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Botón Última página
    if (endPage < totalPages) {
      items.push(
        <Pagination.Next
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
      );
      items.push(
        <Pagination.Last
          key="last"
          onClick={() => handlePageChange(totalPages)}
        />
      );
    }

    return <Pagination size="sm" className="secondary">{items}</Pagination>;
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    // Actualizar el producto en la lista filtrada y en la lista completa
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    setSelectedProduct(updatedProduct);
  };

  const currentIndex = getCurrentProductIndex();
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < products.length - 1 && currentIndex >= 0;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfk7cgSW1hZ2VuIG5vIGVuY29udHJhZGE8L3RleHQ+Cjwvc3ZnPg==";
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBrand("all");
    setSelectedCategory("all");
    setSelectedAvailable("all");
    setCurrentPage(1);
    // Los query params se actualizarán automáticamente por el useEffect
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );
      // Limpiar autorización de admin si existe
      sessionStorage.removeItem("admin_authorized");
      toast.success("Sesión cerrada exitosamente");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
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
                    <h2 className="mb-0" style={{ fontSize: "24px" }}>
                      Listado de Productos
                    </h2>
                    <img
                      src="/logo.png"
                      alt="Logo"
                      className="img-fluid"
                      style={{ width: "100px" }}
                    />
                  </div>
                </Col>
                <Col xs="auto" className="d-flex gap-2">
                  {/* <Button variant="info" onClick={() => navigate("/")}>
                    ⚙️ Gestión
                  </Button> */}
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

                <Col md={2}>
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

                <Col md={2}>
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

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>✅ Disponibilidad</Form.Label>
                    <Form.Select
                      value={selectedAvailable}
                      onChange={(e) => setSelectedAvailable(e.target.value)}
                    >
                      <option value="all">Todas</option>
                      <option value="true">Disponibles</option>
                      <option value="false">No disponibles</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={2} className="d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={clearFilters}
                  >
                    🗑️ Limpiar
                  </button>
                </Col>
              </Row>

              {/* Información de resultados */}
              <Row className="mb-3">
                <Col>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">
                      Mostrando {products.length} de {totalProducts} productos{" "}
                      {totalPages > 1 &&
                        `(Página ${currentPage} de ${totalPages})`}
                      {(searchTerm ||
                        selectedBrand !== "all" ||
                        selectedCategory !== "all" ||
                        selectedAvailable !== "all") && (
                        <Badge bg="info" className="ms-2">Filtros aplicados</Badge>
                      )}
                    </span>
                    {/* Controles de paginación */}
                    {totalPages > 1 && <>{renderPagination()}</>}
                  </div>
                </Col>
              </Row>

              {/* Grid de productos */}
              <Row>
                {products.length === 0 ? (
                  <Col xs={12} className="text-center text-muted py-5">
                    {loading
                      ? "Cargando productos..."
                      : "🔍 No se encontraron productos con los filtros aplicados"}
                  </Col>
                ) : (
                  products.map((product) => (
                    <Col
                      key={product.id}
                      xs={12}
                      sm={6}
                      md={4}
                      lg={2}
                      xl={2}
                      className="mb-4"
                    >
                      <Card
                        className="h-100 shadow-sm"
                        style={{ cursor: "pointer" }}
                        onDoubleClick={() => handleProductDoubleClick(product)}
                      >
                        {/* Imagen del producto con lazy loading */}
                        {product.image_url ? (
                          <div
                            style={{
                              height: "200px",
                              overflow: "hidden",
                              backgroundColor: "#f8f9fa",
                            }}
                          >
                            <LazyImage
                              src={product.image_url}
                              alt={product.name || "Producto"}
                              style={{
                                maxHeight: "200px",
                                width: "100%",
                              }}
                              rootMargin="150px" // Empezar a cargar 150px antes de que sea visible
                              onError={handleImageError}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              height: "200px",
                              backgroundColor: "#f8f9fa",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#6c757d",
                            }}
                          >
                            📷 Sin imagen
                          </div>
                        )}

                        <Card.Body className="d-flex flex-column">
                          <Card.Title
                            className="h6 mb-2"
                            style={{ fontSize: "0.9rem" }}
                          >
                            {product.name || "-"}
                          </Card.Title>
                          <div className="mt-auto">
                            <small className="text-muted d-block">
                              <strong>EAN:</strong> {product.ean || "-"}
                            </small>
                            <small className="text-muted d-block">
                              <strong>Marca:</strong> {product.brand || "-"}
                            </small>
                            {product.category && (
                              <small className="text-muted d-block">
                                <strong>Categoría:</strong> {product.category}
                              </small>
                            )}
                            <Badge
                              bg={product.available ? "success" : "danger"}
                            >
                              {product.available
                                ? "Disponible"
                                : "No disponible"}
                            </Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de detalles del producto */}
      <ProductDetailModal
        show={showDetailModal}
        onHide={() => {
          setShowDetailModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        hasPrevious={hasPrevious || currentPage > 1}
        hasNext={hasNext || currentPage < totalPages}
        onPrevious={handlePreviousProduct}
        onNext={handleNextProduct}
        onProductUpdate={handleProductUpdate}
      />
    </Container>
  );
};

export default ProductListing;
