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
            {currentImage ? (
              <>
                <img
                  src={currentImage.imageUrl}
                  alt={currentImage.caption || project.title}
                  className={styles.mainImage}
                />
                {currentImage.imageType && (
                  <span className={`${styles.badge} ${styles[currentImage.imageType]}`}>
                    {currentImage.imageType.charAt(0).toUpperCase() + currentImage.imageType.slice(1)}
                  </span>
                )}
              </>
            ) : (
              <div className={styles.noImage}>No Image Available</div>
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
                  <img src={image.imageUrl} alt={`Thumbnail ${index + 1}`} />
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
