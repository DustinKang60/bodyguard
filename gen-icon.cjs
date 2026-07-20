const sharp = require('sharp');
const svg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="white"/>
  <path d="M512 850S150 550 150 350C150 200 250 100 400 100c100 0 112 50 112 50s12-50 112-50c150 0 250 100 250 250 0 200-362 500-362 500z" fill="#FF3B30"/>
</svg>`;

sharp(Buffer.from(svg))
  .png()
  .toFile('assets/icon.png')
  .then(() => {
    return sharp(Buffer.from(svg)).png().toFile('assets/splash.png');
  })
  .then(() => console.log('Icons generated successfully'))
  .catch(console.error);
