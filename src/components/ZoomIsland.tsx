import { useRef, useCallback } from "react";

interface Props {
  src: string;
  alt: string;
  focalX?: number;
  focalY?: number;
}

const ZOOM_SCALE = 2;

export default function ZoomIsland({
  src,
  alt,
  focalX = 50,
  focalY = 50,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const img = imgRef.current;
      const container = containerRef.current;
      if (!img || !container) return;

      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      img.style.transformOrigin = `${x}% ${y}%`;
    },
    []
  );

  const handleMouseEnter = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    img.style.transformOrigin = `${focalX}% ${focalY}%`;
    img.style.transform = `scale(${ZOOM_SCALE})`;
  }, [focalX, focalY]);

  const handleMouseLeave = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    img.style.transform = "scale(1)";
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden flex items-center justify-center cursor-zoom-in"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-300 will-change-transform"
      />
    </div>
  );
}
