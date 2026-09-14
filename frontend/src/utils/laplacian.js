/**
 * Center-Constrained Laplacian Variance & Micro-Text Edge Density Analyzer
 * for Evidentiary Focus Viewfinder & Statutory Verification (Indian Evidence Act / BSA).
 *
 * Prevents premature triggering on human faces, room backgrounds, and smooth gradients
 * by enforcing a dual-gate criterion:
 * 1. Variance of discrete 3x3 Laplacian: Var(∇²I) >= 120.0
 * 2. Micro-Edge Text Density: count(|∇²I| > 35) / total_roi_pixels >= 0.025
 */

export function calculateLaplacianVariance(canvas, roi = null) {
  if (!canvas) {
    return {
      variance: 0,
      edgeDensity: 0,
      score: 0,
      isReady: false,
      isAdmissible: false,
      status: 'NO_IMAGE',
      label: 'No Camera Feed',
      color: '#718096'
    };
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      variance: 0,
      edgeDensity: 0,
      score: 0,
      isReady: false,
      isAdmissible: false,
      status: 'ERROR',
      label: 'Canvas Error',
      color: '#718096'
    };
  }

  const width = canvas.width;
  const height = canvas.height;
  if (width === 0 || height === 0) {
    return {
      variance: 0,
      edgeDensity: 0,
      score: 0,
      isReady: false,
      isAdmissible: false,
      status: 'NO_IMAGE',
      label: 'Empty Frame',
      color: '#718096'
    };
  }

  // 1. Center-Constrained Region of Interest (ROI)
  // Evaluates strictly within target bounding box (default: center 60% of canvas)
  let startX, startY, sampleW, sampleH;

  if (roi && typeof roi === 'object') {
    if (roi.width <= 1.0 && roi.height <= 1.0) {
      // Normalized coordinates (0.0 to 1.0)
      startX = Math.floor(width * (roi.x ?? 0.2));
      startY = Math.floor(height * (roi.y ?? 0.2));
      sampleW = Math.floor(width * (roi.width ?? 0.6));
      sampleH = Math.floor(height * (roi.height ?? 0.6));
    } else {
      // Absolute pixel coordinates
      startX = Math.max(0, Math.floor(roi.x ?? width * 0.2));
      startY = Math.max(0, Math.floor(roi.y ?? height * 0.2));
      sampleW = Math.min(width - startX, Math.floor(roi.width ?? width * 0.6));
      sampleH = Math.min(height - startY, Math.floor(roi.height ?? height * 0.6));
    }
  } else {
    // Default: Center 60% bounding box (x: 20%, y: 20%, w: 60%, h: 60%)
    sampleW = Math.max(10, Math.floor(width * 0.6));
    sampleH = Math.max(10, Math.floor(height * 0.6));
    startX = Math.floor((width - sampleW) / 2);
    startY = Math.floor((height - sampleH) / 2);
  }

  // Bound check
  startX = Math.max(0, Math.min(startX, width - 1));
  startY = Math.max(0, Math.min(startY, height - 1));
  sampleW = Math.max(4, Math.min(sampleW, width - startX));
  sampleH = Math.max(4, Math.min(sampleH, height - startY));

  let imgData;
  try {
    imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
  } catch (err) {
    console.warn('Laplacian getImageData failed:', err);
    return {
      variance: 0,
      edgeDensity: 0,
      score: 0,
      isReady: false,
      isAdmissible: false,
      status: 'ERROR',
      label: 'Frame Read Error',
      color: '#718096'
    };
  }

  const data = imgData.data;

  // 2. Convert ROI pixels to luminance grayscale: 0.299R + 0.587G + 0.114B
  const gray = new Float32Array(sampleW * sampleH);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // 3. Discrete 3x3 Laplacian Convolution Kernel:
  // [  0,  1,  0 ]
  // [  1, -4,  1 ]
  // [  0,  1,  0 ]
  const validW = sampleW - 2;
  const validH = sampleH - 2;
  const N = validW * validH;

  if (N <= 0) {
    return {
      variance: 0,
      edgeDensity: 0,
      score: 0,
      isReady: false,
      isAdmissible: false,
      status: 'ERROR',
      label: 'Empty Matrix',
      color: '#718096'
    };
  }

  const laplacian = new Float32Array(N);
  let sum = 0;
  let edgeCount = 0;
  let idx = 0;

  for (let y = 1; y < sampleH - 1; y++) {
    const rowOffset = y * sampleW;
    const topRowOffset = (y - 1) * sampleW;
    const bottomRowOffset = (y + 1) * sampleW;

    for (let x = 1; x < sampleW - 1; x++) {
      const c = gray[rowOffset + x];
      const top = gray[topRowOffset + x];
      const bottom = gray[bottomRowOffset + x];
      const left = gray[rowOffset + (x - 1)];
      const right = gray[rowOffset + (x + 1)];

      const val = top + bottom + left + right - 4 * c;
      laplacian[idx] = val;
      sum += val;

      // Count edge pixels exceeding gradient threshold (|∇²I| > 35)
      if (Math.abs(val) > 35) {
        edgeCount++;
      }
      idx++;
    }
  }

  // 4. Calculate variance σ²(∇²I) over the ROI
  const mean = sum / N;
  let varianceSum = 0;
  for (let i = 0; i < N; i++) {
    const diff = laplacian[i] - mean;
    varianceSum += diff * diff;
  }

  const variance = Math.round((varianceSum / N) * 10) / 10;
  const edgeDensity = Math.round((edgeCount / N) * 10000) / 10000;

  // 5. Dual-Gate Focus & Micro-Text Verification Gate:
  // isReady = true ONLY if variance >= 120.0 AND edgeDensity >= 0.025
  const isReady = variance >= 120.0 && edgeDensity >= 0.025;

  let status = 'READY';
  let label = 'TEXT DETECTED (READY)';
  let color = '#2F855A'; // Emerald

  if (variance < 45) {
    status = 'BLURRED';
    label = 'BLUR DETECTED (INADMISSIBLE)';
    color = '#C53030'; // Crimson
  } else if (variance < 120.0) {
    status = 'MARGINAL';
    label = 'LOW SHARPNESS / FOCUSING';
    color = '#DD6B20'; // Amber
  } else if (edgeDensity < 0.025) {
    status = 'NO_TEXT';
    label = 'ALIGN PACKAGING TEXT IN BOX';
    color = '#DD6B20'; // Amber
  }

  return {
    variance,
    edgeDensity,
    edgeCount,
    totalRoiPixels: N,
    isReady,
    score: variance, // Backward compatibility
    status,
    label,
    color,
    isAdmissible: isReady
  };
}
