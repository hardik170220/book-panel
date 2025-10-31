"use client"
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Carousel3D = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const images = [
    {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
      title: 'Mountain Vista',
      description: 'Majestic mountain landscape'
    },
    {
      url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
      title: 'Forest Path',
      description: 'Serene forest walkway'
    },
    {
      url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
      title: 'Desert Dreams',
      description: 'Golden hour in the desert'
    },
    {
      url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80',
      title: 'Ocean Waves',
      description: 'Peaceful coastal scene'
    },
    {
      url: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&q=80',
      title: 'Wildflower Meadow',
      description: 'Colorful spring blooms'
    }
  ];

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const goToSlide = (index) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 600);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnimating]);

  const getSlidePosition = (index) => {
    const diff = index - currentIndex;
    const total = images.length;
    const normalizedDiff = ((diff + total) % total);
    
    if (normalizedDiff === 0) return 'center';
    if (normalizedDiff === 1) return 'right';
    if (normalizedDiff === total - 1) return 'left';
    if (normalizedDiff === 2) return 'far-right';
    if (normalizedDiff === total - 2) return 'far-left';
    return 'hidden';
  };

  const getPositionStyles = (position) => {
    const baseStyles = "absolute top-1/2 left-1/2 transition-all duration-700 ease-out cursor-pointer";
    
    const positions = {
      'center': `${baseStyles} w-[280px] md:w-[450px] h-[350px] md:h-[450px] z-30 -translate-x-1/2 -translate-y-1/2 opacity-100 scale-100`,
      'left': `${baseStyles} w-[200px] md:w-[320px] h-[250px] md:h-[320px] z-20 opacity-70  carousel-rotate-left`,
      'right': `${baseStyles} w-[200px] md:w-[320px] h-[250px] md:h-[320px] z-20 opacity-70  carousel-rotate-right`,
      'far-left': `${baseStyles} w-[150px] md:w-[250px] h-[200px] md:h-[250px] z-10 opacity-40 scale-75 carousel-rotate-far-left`,
      'far-right': `${baseStyles} w-[150px] md:w-[250px] h-[200px] md:h-[250px] z-10 opacity-40 scale-75 carousel-rotate-far-right`,
      'hidden': `${baseStyles} opacity-0 scale-50 pointer-events-none`
    };
    
    return positions[position] || positions['hidden'];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-7xl">
        <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-8 md:mb-16">
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            3D Carousel Gallery
          </span>
        </h1>

        <div className="relative h-[400px] md:h-[500px]" style={{ perspective: '2000px' }}>
          {images.map((image, index) => {
            const position = getSlidePosition(index);
            
            return (
              <div key={index} className={getPositionStyles(position)} onClick={() => goToSlide(index)} style={{ transformStyle: 'preserve-3d' }}>
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl group">
                  <img src={image.url} alt={image.title} className="w-full h-full object-cover" />
                  
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent ${position === 'center' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{image.title}</h3>
                      <p className="text-gray-300 text-sm md:text-base">{image.description}</p>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center items-center gap-6 mt-12">
          <button onClick={prevSlide} disabled={isAnimating} className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 hover:scale-110">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <div className="flex gap-3">
            {images.map((_, index) => (
              <button key={index} onClick={() => goToSlide(index)} disabled={isAnimating} className={`transition-all duration-300 rounded-full ${index === currentIndex ? 'w-12 h-3 bg-gradient-to-r from-cyan-400 to-purple-400' : 'w-3 h-3 bg-white/30 hover:bg-white/50'} disabled:cursor-not-allowed`} />
            ))}
          </div>

          <button onClick={nextSlide} disabled={isAnimating} className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 hover:scale-110">
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        <p className="text-center text-white/60 mt-8 text-sm">Use arrow keys or click on images to navigate</p>
      </div>

      <style jsx>{`
        .carousel-rotate-left {
          transform: translateX(-350px) translateY(-50%) rotateY(-45deg) scale(0.9);
        }
        .carousel-rotate-right {
          transform: translateX(150px) translateY(-50%) rotateY(45deg) scale(0.9);
        }
        .carousel-rotate-far-left {
          transform: translateX(-600px) translateY(-50%) rotateY(-60deg) scale(0.75);
        }
        .carousel-rotate-far-right {
          transform: translateX(400px) translateY(-50%) rotateY(60deg) scale(0.75);
        }
        @media (min-width: 768px) {
          .carousel-rotate-left {
            transform: translateX(-550px) translateY(-50%) rotateY(-45deg) scale(0.9);
          }
          .carousel-rotate-right {
            transform: translateX(250px) translateY(-50%) rotateY(45deg) scale(0.9);
          }
          .carousel-rotate-far-left {
            transform: translateX(-900px) translateY(-50%) rotateY(-60deg) scale(0.75);
          }
          .carousel-rotate-far-right {
            transform: translateX(600px) translateY(-50%) rotateY(60deg) scale(0.75);
          }
        }
      `}</style>
    </div>
  );
};

export default Carousel3D;