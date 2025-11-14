"use client";

import { useState } from "react";

interface ImageSliderProps {
  topic: string;
  count: number;
  imageUrls?: string[];
}

/**
 * ImageSlider component that displays a carousel of images
 * Uses provided image URLs or falls back to Unsplash API
 */
export function ImageSlider({ topic, count, imageUrls }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  console.log('ImageSlider - Rendering with:', { topic, count, imageUrls });

  // Use provided URLs or generate fallback URLs
  const images = imageUrls && imageUrls.length > 0
    ? imageUrls.map((url, i) => ({
        url: url,
        alt: `${topic} image ${i + 1}`,
      }))
    : Array.from({ length: count }, (_, i) => ({
        url: `https://source.unsplash.com/800x600/?${encodeURIComponent(topic)}&sig=${i}`,
        alt: `${topic} image ${i + 1}`,
      }));

  console.log('ImageSlider - Generated images array:', images);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-2 text-center">
        <h3 className="text-base font-semibold text-gray-800 capitalize">
          {topic} Gallery
        </h3>
        <p className="text-xs text-gray-600">
          {currentIndex + 1} / {images.length}
        </p>
      </div>

      {/* Slider Container */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg">
        {/* Main Image */}
        <div className="relative aspect-video w-full">
          <img
            src={images[currentIndex].url}
            alt={images[currentIndex].alt}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlays for Better Button Visibility */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/30 to-transparent pointer-events-none" />
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-md transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Previous image"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-md transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Next image"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all focus:outline-none ${
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/75 w-1.5"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

