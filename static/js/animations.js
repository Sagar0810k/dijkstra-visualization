/**
 * animations.js
 * Enhances the City Map Dijkstra Visualization with animations and visual effects
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("Animations.js is loaded!");

  // Create animation container for background effects
  createBackgroundEffects();
  
  // Add tooltips for better user experience
  initializeTooltips();
  
  // Add toast notification system
  initializeToastSystem();
  
  // Add animated transitions and hover effects
  enhanceUIElements();
  
  // Add node and edge hover animations
  enhanceMapInteractions();
  
  // Add page load animations
  animatePageLoad();
});

/**
 * Creates animated background effects
 */
function createBackgroundEffects() {
  const backgroundAnimation = document.createElement('div');
  backgroundAnimation.className = 'bg-animation';
  
  // Create SVG background with animated patterns
  backgroundAnimation.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1" fill="#e2e8f0" />
        </pattern>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" stroke-width="1"/>
        </pattern>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(79, 70, 229, 0.05)" />
          <stop offset="50%" stop-color="rgba(249, 115, 22, 0.05)" />
          <stop offset="100%" stop-color="rgba(79, 70, 229, 0.05)" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
      <rect width="100%" height="100%" fill="url(#grid)" />
      <rect width="100%" height="100%" fill="url(#gradient)" class="gradient-overlay" />
      
      <!-- Animated circles -->
      <circle class="floating-circle" cx="10%" cy="20%" r="50" fill="rgba(79, 70, 229, 0.03)" />
      <circle class="floating-circle delay-1" cx="85%" cy="15%" r="70" fill="rgba(249, 115, 22, 0.03)" />
      <circle class="floating-circle delay-2" cx="15%" cy="85%" r="100" fill="rgba(79, 70, 229, 0.03)" />
      <circle class="floating-circle delay-3" cx="80%" cy="80%" r="60" fill="rgba(249, 115, 22, 0.03)" />
    </svg>
  `;
  
  document.body.appendChild(backgroundAnimation);
  
  // Add CSS animation for floating circles
  const style = document.createElement('style');
  style.textContent = `
    .gradient-overlay {
      animation: gradientBG 15s ease infinite;
    }
    .floating-circle {
      animation: float 8s ease-in-out infinite;
    }
    .delay-1 {
      animation-delay: 1s;
    }
    .delay-2 {
      animation-delay: 2s;
    }
    .delay-3 {
      animation-delay: 3s;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Initializes tooltip system for enhanced user interaction
 */
function initializeTooltips() {
  // Create tooltip container
  const tooltipEl = document.createElement('div');
  tooltipEl.className = 'tooltip';
  document.body.appendChild(tooltipEl);
  
  // Add tooltips for legend items
  const legendItems = document.querySelectorAll('.legend-item');
  const tooltipContent = {
    'Node': 'Regular nodes in the city graph.',
    'Start Node': 'The starting point of your path.',
    'End Node': 'The destination of your path.',
    'Edge': 'Connections between nodes with their distance.',
    'Shortest Path': 'The optimal route between start and end nodes.'
  };
  
  legendItems.forEach(item => {
    const text = item.querySelector('span').textContent;
    
    item.addEventListener('mouseenter', (e) => {
      const rect = item.getBoundingClientRect();
      tooltipEl.textContent = tooltipContent[text] || text;
      tooltipEl.style.top = `${rect.bottom + 10}px`;
      tooltipEl.style.left = `${rect.left + rect.width/2 - 125}px`;
      tooltipEl.classList.add('visible');
    });
    
    item.addEventListener('mouseleave', () => {
      tooltipEl.classList.remove('visible');
    });
  });
  
  // Add tooltips for form elements
  addTooltipToElement('#start', 'Enter the ID of the starting node');
  addTooltipToElement('#end', 'Enter the ID of the destination node');
  addTooltipToElement('#trafficFactor', 'Adjust how much traffic affects route planning');
  addTooltipToElement('.update-traffic-btn', 'Generate new random traffic patterns');
}

/**
 * Helper function to add tooltip to an element
 */
function addTooltipToElement(selector, content) {
  const element = document.querySelector(selector);
  if (!element) return;
  
  const tooltipEl = document.querySelector('.tooltip');
  
  element.addEventListener('mouseenter', (e) => {
    const rect = element.getBoundingClientRect();
    tooltipEl.textContent = content;
    tooltipEl.style.top = `${rect.bottom + 10}px`;
    tooltipEl.style.left = `${rect.left + rect.width/2 - 125}px`;
    tooltipEl.classList.add('visible');
  });
  
  element.addEventListener('mouseleave', () => {
    tooltipEl.classList.remove('visible');
  });
}

/**
 * Initialize toast notification system
 */
function initializeToastSystem() {
  // Create toast container
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
  
  // Global function to show toast notifications
  window.showToast = function(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Create icon based on type
    let icon = '🔔';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'info') icon = 'ℹ️';
    
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after duration
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  };
  
  // Override the native alert function with toast
  const originalAlert = window.alert;
  window.alert = function(message) {
    showToast(message, 'info');
  };
  
  // Listen for form submit to show toast
  const form = document.getElementById('shortestPathForm');
  if (form) {
    form.addEventListener('submit', function() {
      setTimeout(() => {
        showToast('Calculating shortest path...', 'info');
      }, 100);
    });
  }
}

/**
 * Enhance UI elements with animations and transitions
 */
function enhanceUIElements() {
  // Add hover effects to cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px)';
      card.style.boxShadow = 'var(--shadow-lg)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  });
  
  // Add pulse effect to submit button
  const submitButton = document.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.classList.add('pulse-button');
    
    // Add click animation
    submitButton.addEventListener('click', function(e) {
      // Add ripple effect if calculation is happening
      if (!submitButton.disabled) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        submitButton.appendChild(ripple);
        
        const rect = submitButton.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size/2}px`;
        ripple.style.top = `${e.clientY - rect.top - size/2}px`;
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
      }
    });
  }
  
  // Add progress bar animation to result card
  const resultCard = document.getElementById('resultCard');
  if (resultCard) {
    const progressBar = document.createElement('div');
    progressBar.className = 'path-finding-animation';
    resultCard.appendChild(progressBar);
    
    // Create mutation observer to watch for display changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'style' && 
            resultCard.style.display === 'block') {
          // Reset and start animation
          progressBar.style.animation = 'none';
          progressBar.offsetHeight; // Trigger reflow
          progressBar.style.animation = 'progress 2s ease-out forwards';
        }
      });
    });
    
    observer.observe(resultCard, { attributes: true });
  }
  
  // Add number input animations
  const inputs = document.querySelectorAll('input[type="number"]');
  inputs.forEach(input => {
    // Add animated label
    const label = input.previousElementSibling;
    if (label && label.tagName === 'LABEL') {
      label.classList.add('floating-label');
      
      input.addEventListener('focus', () => {
        label.classList.add('focused');
      });
      
      input.addEventListener('blur', () => {
        if (!input.value) {
          label.classList.remove('focused');
        }
      });
      
      // Auto-check if input has value on page load
      if (input.value) {
        label.classList.add('focused');
      }
    }
    
    // Add increment/decrement animations
    let lastValue = input.value;
    
    input.addEventListener('input', () => {
      const newValue = input.value;
      
      if (newValue > lastValue) {
        input.classList.add('increment-animation');
        setTimeout(() => input.classList.remove('increment-animation'), 300);
      } else if (newValue < lastValue) {
        input.classList.add('decrement-animation');
        setTimeout(() => input.classList.remove('decrement-animation'), 300);
      }
      
      lastValue = newValue;
    });
  });
  
  // Add themed scrollbar
  const style = document.createElement('style');
  style.textContent = `
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    ::-webkit-scrollbar-track {
      background: var(--background);
      border-radius: 5px;
    }
    ::-webkit-scrollbar-thumb {
      background: linear-gradient(var(--primary), var(--primary-hover));
      border-radius: 5px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--primary-hover);
    }
    
    .floating-label {
      position: absolute;
      transform-origin: left top;
      transition: all 0.2s ease;
      pointer-events: none;
    }
    
    .floating-label.focused {
      transform: translateY(-20px) scale(0.8);
      color: var(--primary);
    }
    
    .pulse-button {
      animation: pulse 2s infinite;
    }
    
    .ripple {
      position: absolute;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.4);
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    }
    
    .increment-animation {
      animation: increment 0.3s ease-out;
    }
    
    .decrement-animation {
      animation: decrement 0.3s ease-out;
    }
    
    @keyframes ripple {
      to {
        transform: scale(2);
        opacity: 0;
      }
    }
    
    @keyframes increment {
      0% { background-color: rgba(16, 185, 129, 0.1); }
      100% { background-color: transparent; }
    }
    
    @keyframes decrement {
      0% { background-color: rgba(239, 68, 68, 0.1); }
      100% { background-color: transparent; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Add page load animations
 */
function animatePageLoad() {
  // Add staggered fade-in animation for cards
  const cards = document.querySelectorAll('.card');
  
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100 * index);
  });
  
  // Add animation for header
  const header = document.querySelector('header');
  if (header) {
    header.style.opacity = '0';
    header.style.transform = 'translateY(-10px)';
    header.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    
    setTimeout(() => {
      header.style.opacity = '1';
      header.style.transform = 'translateY(0)';
    }, 100);
  }
  
  // Add animation for subtitle
  const subtitle = document.querySelector('.subtitle');
  if (subtitle) {
    subtitle.style.opacity = '0';
    subtitle.style.transition = 'opacity 0.8s ease';
    
    setTimeout(() => {
      subtitle.style.opacity = '1';
    }, 300);
  }
}

/**
 * Enhance map interactions with node and edge animations
 */
function enhanceMapInteractions() {
  // We'll need to extend the canvas to handle these animations
  // Listen for existing canvas instance from script.js
  let animationFrame;
  let particlesArray = [];
  let isRendering = false;
  
  // Wait for canvas to be fully initialized
  const checkCanvas = setInterval(() => {
    const canvas = document.getElementById('cityMap');
    if (canvas) {
      clearInterval(checkCanvas);
      
      // Add canvas theme
      const canvasContainer = canvas.parentElement;
      if (canvasContainer) {
        canvasContainer.classList.add('city-map-theme');
      }
      
      // Add animated path particles when path is calculated
      const resultCard = document.getElementById('resultCard');
      if (resultCard) {
        // Create observer for result card
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === 'style' && 
                resultCard.style.display === 'block') {
              // Start particles animation
              initPathParticles(canvas);
            }
          });
        });
        
        observer.observe(resultCard, { attributes: true });
      }
    }
  }, 100);
  
  /**
   * Initialize path particles animation
   */
  function initPathParticles(canvas) {
    // Stop any existing animation
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      particlesArray = [];
    }
    
    // Only proceed if we have path data
    const pathResult = document.getElementById('pathResult');
    if (!pathResult || !pathResult.textContent.includes('→')) return;
    
    // Wait for the path to be drawn
    setTimeout(() => {
      // Start new particle system
      // This is a simplified version that doesn't need access to the actual path
      createPathParticles(canvas);
    }, 500);
  }
  
  /**
   * Create animated particles along the path
   */
  function createPathParticles(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // We won't actually draw particles directly on the cityMap canvas
    // Instead, create an overlay canvas
    let particleCanvas = document.getElementById('particleCanvas');
    if (!particleCanvas) {
      particleCanvas = document.createElement('canvas');
      particleCanvas.id = 'particleCanvas';
      particleCanvas.style.position = 'absolute';
      particleCanvas.style.top = '0';
      particleCanvas.style.left = '0';
      particleCanvas.style.pointerEvents = 'none';
      canvas.parentElement.appendChild(particleCanvas);
    }
    
    // Make particle canvas same size as main canvas
    particleCanvas.width = canvas.width;
    particleCanvas.height = canvas.height;
    const particleCtx = particleCanvas.getContext('2d');
    
    // Start the particle animation
    isRendering = true;
    
    // Define the particle class (simplified version that adds particles to the path edges)
    class Particle {
      constructor() {
        // Random position anywhere in the canvas
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 3;
        this.speedY = (Math.random() - 0.5) * 3;
        this.color = `hsla(${Math.random() * 60 + 20}, 100%, 50%, 0.7)`;
        this.life = 200;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        
        if (this.size > 0.2) this.size -= 0.05;
      }
      
      draw() {
        particleCtx.fillStyle = this.color;
        particleCtx.beginPath();
        particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        particleCtx.fill();
      }
    }
    
    // Create initial particles
    for (let i = 0; i < 50; i++) {
      particlesArray.push(new Particle());
    }
    
    // Animation loop for particles
    function animateParticles() {
      if (!isRendering) return;
      
      particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      
      // Update and draw all particles
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
        
        // Remove dead particles
        if (particlesArray[i].life <= 0) {
          particlesArray.splice(i, 1);
          i--;
        }
      }
      
      // Add new particles occasionally
      if (Math.random() < 0.2 && particlesArray.length < 100) {
        particlesArray.push(new Particle());
      }
      
      animationFrame = requestAnimationFrame(animateParticles);
    }
    
    // Start animation
    animateParticles();
    
    // Stop animation after a while
    setTimeout(() => {
      isRendering = false;
      cancelAnimationFrame(animationFrame);
    }, 10000);
  }
}

/**
 * Creates animated loading indicators
 */
function createLoadingIndicator(parent, text = 'Loading') {
  // Create loading container
  const loadingContainer = document.createElement('div');
  loadingContainer.className = 'loading-container';
  loadingContainer.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">${text}</div>
  `;
  
  parent.appendChild(loadingContainer);
  
  // Create and inject required CSS
  const style = document.createElement('style');
  style.textContent = `
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 10px;
    }
    
    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(var(--primary-rgb), 0.2);
      border-radius: 50%;
      border-top-color: var(--primary);
      animation: spin 1s linear infinite;
    }
    
    .loading-text {
      font-size: 16px;
      font-weight: 500;
      color: var(--foreground);
    }
  `;
  document.head.appendChild(style);
  
  // Return a function to remove the loading indicator
  return function removeLoading() {
    loadingContainer.remove();
  };
}

// Monitor traffic slider changes to provide visual feedback
document.addEventListener('DOMContentLoaded', () => {
  const trafficSlider = document.getElementById('trafficFactor');
  if (trafficSlider) {
    trafficSlider.addEventListener('input', function() {
      // Get the current value and convert it to percentage
      const value = parseFloat(this.value);
      updateSliderColor(this, value);
    });
    
    // Set initial color
    setTimeout(() => {
      updateSliderColor(trafficSlider, parseFloat(trafficSlider.value));
    }, 100);
  }
});

/**
 * Update the slider color based on value
 */
function updateSliderColor(slider, value) {
  // Get the percentage (0-100)
  const percentage = Math.round(value * 100);
  
  // Create CSS variable with the percentage
  document.documentElement.style.setProperty('--slider-value', percentage + '%');
  
  // Apply a color gradient based on the value
  const lowColor = 'rgb(16, 185, 129)';  // Green for distance only
  const midColor = 'rgb(250, 204, 21)';  // Yellow for balanced
  const highColor = 'rgb(239, 68, 68)';  // Red for traffic only
  
  let color;
  if (value <= 0.5) {
    // Mix between low and mid
    const mix = value * 2;  // Convert 0-0.5 to 0-1
    color = mixColors(lowColor, midColor, mix);
  } else {
    // Mix between mid and high
    const mix = (value - 0.5) * 2;  // Convert 0.5-1 to 0-1
    color = mixColors(midColor, highColor, mix);
  }
  
  // Create a gradient style for the slider
  const style = document.createElement('style');
  style.textContent = `
    input[type="range"]::-webkit-slider-thumb {
      border-color: ${color};
    }
    
    input[type="range"]::-moz-range-thumb {
      border-color: ${color};
    }
  `;
  
  // Remove any existing style element for the slider
  const existingStyle = document.getElementById('sliderStyle');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Add an ID to the style element for future reference
  style.id = 'sliderStyle';
  document.head.appendChild(style);
  
  // Update the slider labels
  updateSliderLabels(value);
}

/**
 * Update the slider labels based on value
 */
function updateSliderLabels(value) {
  const sliderLabels = document.querySelectorAll('.slider-labels span');
  if (sliderLabels.length === 3) {
    // Reset all labels
    sliderLabels.forEach(label => {
      label.style.fontWeight = '400';
      label.style.transform = 'scale(1)';
      label.style.color = 'var(--muted-foreground)';
    });
    
    // Highlight the appropriate label
    if (value <= 0.33) {
      sliderLabels[0].style.fontWeight = '600';
      sliderLabels[0].style.transform = 'scale(1.1)';
      sliderLabels[0].style.color = 'var(--foreground)';
    } else if (value <= 0.66) {
      sliderLabels[1].style.fontWeight = '600';
      sliderLabels[1].style.transform = 'scale(1.1)';
      sliderLabels[1].style.color = 'var(--foreground)';
    } else {
      sliderLabels[2].style.fontWeight = '600';
      sliderLabels[2].style.transform = 'scale(1.1)';
      sliderLabels[2].style.color = 'var(--foreground)';
    }
  }
}

/**
 * Mix two RGB colors
 */
function mixColors(color1, color2, mix) {
  // Parse the colors
  const rgb1 = parseRGB(color1);
  const rgb2 = parseRGB(color2);
  
  // Mix the colors
  const r = Math.round(rgb1.r * (1 - mix) + rgb2.r * mix);
  const g = Math.round(rgb1.g * (1 - mix) + rgb2.g * mix);
  const b = Math.round(rgb1.b * (1 - mix) + rgb2.b * mix);
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Parse RGB color string
 */
function parseRGB(color) {
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }
  return { r: 0, g: 0, b: 0 };
}

// Create city theme animation effect
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    addCityTheme();
  }, 1000);
});

/**
 * Add city theme animation effect
 */
function addCityTheme() {
  const canvasContainer = document.querySelector('.canvas-container');
  if (!canvasContainer) return;
  
  // Add city theme overlay
  const cityOverlay = document.createElement('div');
  cityOverlay.className = 'city-overlay';
  cityOverlay.innerHTML = `
    <div class="city-lights"></div>
    <div class="city-glow"></div>
  `;
  
  canvasContainer.appendChild(cityOverlay);
  
  // Add CSS for city theme
  const style = document.createElement('style');
  style.textContent = `
    .city-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      border-radius: var(--radius);
      overflow: hidden;
    }
    
    .city-lights {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(
        circle at 50% 50%,
        transparent 80%,
        rgba(79, 70, 229, 0.1) 100%
      );
      mix-blend-mode: screen;
    }
    
    .city-glow {
      position: absolute;
      top: -10%;
      left: -10%;
      width: 120%;
      height: 120%;
      background: radial-gradient(
        ellipse at 50% 0%,
        rgba(79, 70, 229, 0.1) 0%,
        transparent 70%
      );
      mix-blend-mode: screen;
      animation: cityGlow 10s ease-in-out infinite;
    }
    
    @keyframes cityGlow {
      0%, 100% {
        opacity: 0.5;
        transform: translateY(0);
      }
      50% {
        opacity: 0.8;
        transform: translateY(-10px);
      }
    }
  `;
  document.head.appendChild(style);
}