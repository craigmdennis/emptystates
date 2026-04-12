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

  const isFocusMode = useCallback(
    () => document.documentElement.getAttribute("data-focus-mode") === "on",
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isFocusMode()) return;
      const img = imgRef.current;
      const container = containerRef.current;
      if (!img || !container) return;

      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      img.style.transformOrigin = `${x}% ${y}%`;
    },
    [isFocusMode]
  );

  const handleMouseEnter = useCallback(() => {
    if (isFocusMode()) return;
    const img = imgRef.current;
    if (!img) return;
    img.style.transformOrigin = `${focalX}% ${focalY}%`;
    img.style.transform = `scale(${ZOOM_SCALE})`;
  }, [focalX, focalY, isFocusMode]);

  const handleMouseLeave = useCallback(() => {
    if (isFocusMode()) return;
    const img = imgRef.current;
    if (!img) return;
    img.style.transform = "scale(1)";
  }, [isFocusMode]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden flex items-start justify-center p-4 pb-0 cursor-zoom-in"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative w-full">
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="w-full h-auto object-contain rounded-t-lg transition-transform duration-300 will-change-transform"
        />
        <div className="absolute inset-0 rounded-t-lg border border-black/10 pointer-events-none" />
      </div>
    </div>
  );
}
