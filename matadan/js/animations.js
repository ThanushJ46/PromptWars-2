// animations.js

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      
      // Special handler for timeline
      if (entry.target.classList.contains('timeline-item')) {
          const lineDraw = document.querySelector('.timeline-line-draw');
          if (lineDraw) {
              const itemTop = entry.target.offsetTop;
              lineDraw.style.height = `${itemTop}px`;
          }
          
          // Trigger specific animations based on timeline content
          if (entry.target.querySelector('.evm-button')) {
              setTimeout(() => {
                  entry.target.querySelector('.evm-button').classList.add('pressed');
              }, 1500);
          }
          
          if (entry.target.querySelector('.vvpat-container')) {
              setTimeout(() => {
                  entry.target.querySelector('.vvpat-container').style.display = 'block';
                  entry.target.querySelector('.vvpat-slip').classList.add('show');
              }, 1000);
          }
          
          if (entry.target.querySelector('.confetti-trigger')) {
              showConfetti();
          }
      }
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    // Observe standard scroll elements
    document.querySelectorAll('.animate-on-scroll, .timeline-item').forEach(el => {
        observer.observe(el);
    });
});

// Confetti logic
function showConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    
    container.style.display = 'block';
    container.innerHTML = ''; // Clear previous
    
    const colors = ['#E8531A', '#1A2B6D', '#2E7D32']; // Saffron, Navy, Green
    
    for (let i = 0; i < 30; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = `${Math.random() * 2}s`;
        piece.style.animationDuration = `${2 + Math.random() * 3}s`;
        container.appendChild(piece);
    }
    
    setTimeout(() => {
        container.style.display = 'none';
    }, 6000);
}
