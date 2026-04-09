'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../../../../styles/PortfolioProjectView.module.css';

export default function PortfolioProjectPage() {
  const params = useParams();
  const vendorId = params.id;
  const projectId = params.projectId;
  
  const [project, setProject] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const fetchProjectAndVendor = async () => {
      try {
        setLoading(true);
        
        // Fetch project data
        const projectResponse = await fetch(`/api/portfolio/projects?vendorId=${vendorId}`);
        if (!projectResponse.ok) throw new Error('Failed to fetch projects');
        
        const { projects } = await projectResponse.json();
        const foundProject = projects.find(p => p.id === projectId);
        
        if (!foundProject) {
          setError('Portfolio project not found');
          return;
        }
        
        setProject(foundProject);
        
        // Fetch vendor info
        const vendorResponse = await fetch(`/api/vendors/${vendorId}`);
        if (vendorResponse.ok) {
          const vendorData = await vendorResponse.json();
          setVendor(vendorData);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError(err.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    if (vendorId && projectId) {
      fetchProjectAndVendor();
    }
  }, [vendorId, projectId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <Link href={`/vendor-profile/${vendorId}`} className={styles.backLink}>
            ← Back to vendor profile
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Project not found</h2>
          <Link href={`/vendor-profile/${vendorId}`} className={styles.backLink}>
            ← Back to vendor profile
          </Link>
        </div>
      </div>
    );
  }

  const images = project.images || [];
  const currentImage = images[currentImageIndex];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleRequestQuote = () => {
    // TODO: Implement request quote functionality
    alert('Quote request feature coming soon!');
  };

  return (
    <div className={styles.container}>
      {/* Header with back link */}
      <div className={styles.header}>
        <Link href={`/vendor-profile/${vendorId}`} className={styles.backLink}>
          ← Back to vendor profile
        </Link>
        {vendor && (
          <h1>{vendor.companyName || vendor.businessName || 'Vendor'}</h1>
        )}
      </div>

      <div className={styles.content}>
        {/* Image Gallery */}
        <div className={styles.gallerySection}>
          <div className={styles.mainImageContainer}>
            {currentImage && !imageErrors[currentImageIndex] ? (
              <>
                <img
                  src={currentImage.imageUrl}
                  alt={currentImage.caption || project.title}
                  className={styles.mainImage}
                  onError={(e) => {
                    console.warn('❌ Portfolio image failed to load:', currentImage.imageUrl);
                    setImageErrors(prev => ({ ...prev, [currentImageIndex]: true }));
                    // Fallback SVG for broken images
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23e2e8f0" width="400" height="400"/%3E%3Cg fill="%23999"%3E%3Ccircle cx="100" cy="100" r="30"/%3E%3Cpath d="M 50 250 L 150 150 L 250 250 L 350 100 L 350 350 Q 350 350 350 350 L 50 350 Z"/%3E%3C/g%3E%3C/svg%3E';
                  }}
                />
                {currentImage.imageType && (
                  <span className={`${styles.badge} ${styles[currentImage.imageType]}`}>
                    {currentImage.imageType.charAt(0).toUpperCase() + currentImage.imageType.slice(1)}
                  </span>
                )}
              </>
            ) : (
              <div className={styles.noImage}>
                <svg style={{width: '48px', height: '48px', opacity: 0.4}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Image Unavailable</p>
              </div>
            )}
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                className={`${styles.navButton} ${styles.prev}`}
                onClick={handlePrevImage}
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                className={`${styles.navButton} ${styles.next}`}
                onClick={handleNextImage}
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className={styles.imageCounter}>
              {currentImageIndex + 1} / {images.length}
            </div>
          )}

          {/* Thumbnail grid */}
          {images.length > 1 && (
            <div className={styles.thumbnailGrid}>
              {images.map((image, index) => (
                <button
                  key={index}
                  className={`${styles.thumbnail} ${index === currentImageIndex ? styles.active : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  <img 
                    src={image.imageUrl} 
                    alt={`Thumbnail ${index + 1}`}
                    onError={(e) => {
                      console.warn('❌ Thumbnail image failed to load:', image.imageUrl);
                      // Fallback SVG for broken thumbnails
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e2e8f0" width="100" height="100"/%3E%3Cg fill="%23999" opacity="0.5"%3E%3Ccircle cx="25" cy="25" r="8"/%3E%3Cpath d="M 10 70 L 30 40 L 70 70 Z"/%3E%3C/g%3E%3C/svg%3E';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className={styles.detailsSection}>
          <div className={styles.projectHeader}>
            <h2>{project.title}</h2>
            <span className={`${styles.statusBadge} ${styles[project.status]}`}>
              {project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
            </span>
          </div>

          {project.categorySlug && (
            <div className={styles.category}>
              <strong>Category:</strong> {project.categorySlug}
            </div>
          )}

          {project.description && (
            <div className={styles.description}>
              <h3>Description</h3>
              <p>{project.description}</p>
            </div>
          )}

          <div className={styles.details}>
            {project.budgetMin && project.budgetMax && (
              <div className={styles.detailItem}>
                <strong>Budget:</strong> ${project.budgetMin.toLocaleString()} - ${project.budgetMax.toLocaleString()}
              </div>
            )}

            {project.timeline && (
              <div className={styles.detailItem}>
                <strong>Timeline:</strong> {project.timeline}
              </div>
            )}

            {project.location && (
              <div className={styles.detailItem}>
                <strong>Location:</strong> {project.location}
              </div>
            )}

            {project.completionDate && (
              <div className={styles.detailItem}>
                <strong>Completed:</strong> {new Date(project.completionDate).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button 
              className={styles.quoteButton}
              onClick={handleRequestQuote}
            >
              Request Quote
            </button>
            <button 
              className={styles.shareButton}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }}
            >
              Share Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
