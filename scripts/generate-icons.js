#!/usr/bin/env node
// Generate extension icons for Loyal Sports Fan
// Usage: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Simple PNG encoder for solid color icons with a circle
function createPng(size, bgColor, circleColor) {
  const width = size;
  const height = size;

  // Create raw RGBA pixel data
  const pixels = Buffer.alloc(width * height * 4);
  const center = size / 2;
  const radius = size * 0.4;
  const innerRadius = size * 0.25;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius && dist >= innerRadius) {
        // Outer ring - cyan color (#64ffda)
        pixels[idx] = circleColor[0];     // R
        pixels[idx + 1] = circleColor[1]; // G
        pixels[idx + 2] = circleColor[2]; // B
        pixels[idx + 3] = 255;            // A
      } else if (dist < innerRadius) {
        // Inner circle - dark background
        pixels[idx] = bgColor[0];
        pixels[idx + 1] = bgColor[1];
        pixels[idx + 2] = bgColor[2];
        pixels[idx + 3] = 255;
      } else {
        // Transparent background
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }

  // Add filter byte (0) at the start of each row
  const filteredData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    filteredData[y * (1 + width * 4)] = 0; // Filter type: None
    pixels.copy(filteredData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  // Compress the filtered data
  const compressed = zlib.deflateSync(filteredData, { level: 9 });

  // Build PNG file
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // Bit depth
  ihdrData[9] = 6;  // Color type (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = getCrc32Table();

  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }

  return crc ^ 0xFFFFFFFF;
}

let crc32Table = null;
function getCrc32Table() {
  if (crc32Table) return crc32Table;

  crc32Table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crc32Table[i] = c;
  }
  return crc32Table;
}

// Generate icons
const sizes = [16, 48, 128];
const bgColor = [10, 25, 47];       // #0a192f - dark blue
const circleColor = [100, 255, 218]; // #64ffda - cyan

const iconsDir = path.join(__dirname, '..', 'assets', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

for (const size of sizes) {
  const png = createPng(size, bgColor, circleColor);
  const filename = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Created ${filename}`);
}

console.log('Icons generated successfully!');
