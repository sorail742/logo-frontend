const fs = require('fs');

const file = 'src/app/globals.css';
let content = fs.readFileSync(file, 'utf8');

const targetSection = `  /* Cartes ultra-professionnelles avec halo lumineux ambiant sous-jacent (underglow) */
  .glow-card {
    position: relative;
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
  }
  .glow-card:hover {
    transform: translateY(-4px) scale(1.006);
    box-shadow: 0 20px 38px -12px rgba(13, 110, 95, 0.16), 0 2px 6px 0 rgba(0, 0, 0, 0.04);
  }
  .glow-card::after {
    content: "";
    position: absolute;
    inset: 22% 8% -14px 8%;
    border-radius: inherit;
    background: radial-gradient(ellipse at center bottom, rgba(13, 110, 95, 0.32), rgba(13, 110, 95, 0.08) 55%, transparent 75%);
    filter: blur(14px);
    z-index: -1;
    opacity: 0;
    transition: opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1), transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
  }
  .glow-card:hover::after {
    opacity: 1;
    transform: translateY(6px);
  }

  .glow-card-amber:hover {
    box-shadow: 0 20px 38px -12px rgba(245, 158, 11, 0.22), 0 2px 6px 0 rgba(0, 0, 0, 0.04);
  }
  .glow-card-amber::after {
    background: radial-gradient(ellipse at center bottom, rgba(245, 158, 11, 0.38), rgba(245, 158, 11, 0.10) 55%, transparent 75%);
  }

  .glow-card-indigo:hover {
    box-shadow: 0 20px 38px -12px rgba(99, 102, 241, 0.22), 0 2px 6px 0 rgba(0, 0, 0, 0.04);
  }
  .glow-card-indigo::after {
    background: radial-gradient(ellipse at center bottom, rgba(99, 102, 241, 0.38), rgba(99, 102, 241, 0.10) 55%, transparent 75%);
  }

  /* Halo lumineux de studio pour le canevas textile & mockups */
  .textile-spotlight {
    background: radial-gradient(circle at 50% 40%, rgba(13, 110, 95, 0.10) 0%, rgba(255, 255, 255, 0.02) 60%, transparent 80%);
  }

  /* Texture de studio pour aperçus haut de gamme (cachets, packaging) */
  .studio-stage {
    background-color: #fafbfc;
    background-image: radial-gradient(rgba(13, 110, 95, 0.08) 1px, transparent 1px);
    background-size: 20px 20px;
  }`;

const replacementSection = `  /* Animations de lumière vivante sous les cartes (breathing neon underglow & specular sweeps) */
  @keyframes underglow-vibe {
    0%, 100% {
      opacity: 0.75;
      transform: translateY(6px) scale(0.97);
      filter: blur(14px);
    }
    50% {
      opacity: 1;
      transform: translateY(9px) scale(1.04);
      filter: blur(20px);
    }
  }

  @keyframes shimmer-sweep {
    0% {
      transform: translateX(-150%) skewX(-20deg);
    }
    100% {
      transform: translateX(250%) skewX(-20deg);
    }
  }

  @keyframes pulse-subtle {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.03);
      opacity: 0.9;
    }
  }

  /* Cartes ultra-professionnelles avec halo lumineux vivant sous-jacent (underglow) & biseau spéculaire */
  .glow-card {
    position: relative;
    box-shadow:
      0 1px 3px 0 rgba(0, 0, 0, 0.03),
      0 4px 14px -2px rgba(13, 110, 95, 0.06),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.85);
    transition:
      transform 0.32s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.32s cubic-bezier(0.16, 1, 0.3, 1),
      border-color 0.22s ease;
  }
  .glow-card:hover {
    transform: translateY(-5px) scale(1.008);
    box-shadow:
      0 24px 44px -12px rgba(13, 110, 95, 0.22),
      0 4px 12px 0 rgba(0, 0, 0, 0.04),
      inset 0 1px 0 0 rgba(255, 255, 255, 1);
  }
  .glow-card::after {
    content: "";
    position: absolute;
    inset: 20% 6% -16px 6%;
    border-radius: inherit;
    background: radial-gradient(ellipse at center bottom, rgba(13, 110, 95, 0.42), rgba(13, 110, 95, 0.12) 55%, transparent 75%);
    filter: blur(16px);
    z-index: -1;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .glow-card:hover::after {
    opacity: 1;
    animation: underglow-vibe 2.4s ease-in-out infinite alternate;
  }

  /* Variante 3D interactive avec perspective et micro-rotation */
  .glow-card-3d {
    perspective: 1000px;
    transform-style: preserve-3d;
  }
  .glow-card-3d:hover {
    transform: perspective(1000px) translateY(-6px) rotateX(1.8deg) rotateY(-1.2deg) scale(1.01);
  }

  /* Balayage de lumière spéculaire sur la surface (shimmer shine) */
  .glow-card-shimmer {
    position: relative;
    overflow: hidden;
  }
  .glow-card-shimmer::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
    transform: translateX(-150%) skewX(-20deg);
    pointer-events: none;
    z-index: 10;
  }
  .glow-card-shimmer:hover::before {
    animation: shimmer-sweep 1s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Variantes chromatiques d'underglow vibrant */
  .glow-card-amber:hover {
    box-shadow:
      0 24px 44px -12px rgba(245, 158, 11, 0.28),
      0 4px 12px 0 rgba(0, 0, 0, 0.04),
      inset 0 1px 0 0 rgba(255, 255, 255, 1);
  }
  .glow-card-amber::after {
    background: radial-gradient(ellipse at center bottom, rgba(245, 158, 11, 0.48), rgba(245, 158, 11, 0.15) 55%, transparent 75%);
  }

  .glow-card-indigo:hover {
    box-shadow:
      0 24px 44px -12px rgba(99, 102, 241, 0.28),
      0 4px 12px 0 rgba(0, 0, 0, 0.04),
      inset 0 1px 0 0 rgba(255, 255, 255, 1);
  }
  .glow-card-indigo::after {
    background: radial-gradient(ellipse at center bottom, rgba(99, 102, 241, 0.48), rgba(99, 102, 241, 0.15) 55%, transparent 75%);
  }

  .glow-card-teal:hover {
    box-shadow:
      0 24px 44px -12px rgba(20, 184, 166, 0.28),
      0 4px 12px 0 rgba(0, 0, 0, 0.04),
      inset 0 1px 0 0 rgba(255, 255, 255, 1);
  }
  .glow-card-teal::after {
    background: radial-gradient(ellipse at center bottom, rgba(20, 184, 166, 0.48), rgba(20, 184, 166, 0.15) 55%, transparent 75%);
  }

  /* Ombre de contact au sol 3D pour vêtement textile & maquettes */
  .stage-floor-shadow {
    position: absolute;
    bottom: 5%;
    left: 20%;
    right: 20%;
    height: 38px;
    background: radial-gradient(ellipse at center, rgba(15, 23, 42, 0.25) 0%, rgba(15, 23, 42, 0.08) 50%, transparent 75%);
    filter: blur(8px);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }

  /* Halo lumineux de studio pour le canevas textile & mockups */
  .textile-spotlight {
    background:
      radial-gradient(circle at 50% 25%, rgba(13, 110, 95, 0.12) 0%, rgba(13, 110, 95, 0.03) 45%, transparent 70%),
      radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.04) 0%, transparent 50%),
      linear-gradient(180deg, #fafbfc 0%, #f1f5f9 100%);
  }

  /* Texture de studio pour aperçus haut de gamme (cachets, packaging) */
  .studio-stage {
    background-color: #fafbfc;
    background-image: radial-gradient(rgba(13, 110, 95, 0.09) 1.2px, transparent 1.2px);
    background-size: 24px 24px;
  }`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = targetSection.replace(/\r\n/g, '\n');
const normReplacement = replacementSection.replace(/\r\n/g, '\n');

if (normContent.includes(normTarget)) {
  fs.writeFileSync(file, normContent.replace(normTarget, normReplacement).replace(/\n/g, '\r\n'), 'utf8');
  console.log('Successfully upgraded globals.css with living light underglow & 3D tilt!');
} else {
  console.log('Target section not found in globals.css');
}

