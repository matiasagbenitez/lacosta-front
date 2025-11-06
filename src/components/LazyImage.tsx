import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  rootMargin?: string; // Margen para empezar a cargar antes de que sea visible (ej: "100px")
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  style = {},
  placeholder,
  onError,
  rootMargin = '100px', // Carga 100px antes de que la imagen sea visible
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Verificar si el navegador soporta lazy loading nativo
    const supportsLazyLoading = 'loading' in HTMLImageElement.prototype;
    const supportsIntersectionObserver = 'IntersectionObserver' in window;

    // Si el navegador soporta lazy loading nativo, cargar inmediatamente
    // (el navegador se encargará del lazy loading)
    if (supportsLazyLoading) {
      setShouldLoad(true);
      return;
    }

    // Fallback: usar Intersection Observer para navegadores antiguos
    if (!supportsIntersectionObserver) {
      // Si no hay soporte para Intersection Observer, cargar todas las imágenes
      setShouldLoad(true);
      return;
    }

    // Usar Intersection Observer
    const currentRef = imgRef.current;
    if (!currentRef) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            if (observerRef.current && currentRef) {
              observerRef.current.unobserve(currentRef);
            }
          }
        });
      },
      {
        rootMargin: rootMargin,
        threshold: 0.01,
      }
    );

    observerRef.current.observe(currentRef);

    // Cleanup
    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef);
      }
    };
  }, [rootMargin]);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoaded(false);
    if (onError) {
      onError(e);
    }
  };

  // Placeholder por defecto
  const defaultPlaceholder = (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6c757d',
        fontSize: '14px',
      }}
    >
      <span>⏳</span>
    </div>
  );

  return (
    <div
      ref={imgRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      {/* Mostrar placeholder mientras no se ha iniciado la carga o mientras carga */}
      {(!shouldLoad || !isLoaded) && !hasError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            zIndex: 1,
          }}
        >
          {placeholder || defaultPlaceholder}
        </div>
      )}

      {/* Mostrar imagen cuando deba cargarse */}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          loading="lazy" // Soporte nativo para navegadores modernos
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            ...style,
          }}
          className={className}
        />
      )}

      {/* Mostrar error si falla la carga */}
      {hasError && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6c757d',
          }}
        >
          📷 Sin imagen
        </div>
      )}
    </div>
  );
};

export default LazyImage;

