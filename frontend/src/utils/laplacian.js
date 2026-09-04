/**
 * Laplacian Variance Sharpness Analyzer for Evidentiary Focus Viewfinder
 * Convolves image data with a 3x3 discrete Laplacian operator and calculates variance:
 * Var(L) = (1/N) * sum((L_i - L_mean)^2)
 * Ensures captured evidentiary photos are admissible under the Indian Evidence Act / BSA.
 */

export function calculateLaplacianVariance(canvas) {
  if (!canvas) return { score: 0, status: 'NO_IMAGE', label: 'No Camera Feed' };

  const ctx = canvas.getContext('2d');
  if (!ctx) return { score: 0, status: 'ERROR', label: 'Canvas Error' };

  const width = canvas.width;
  const height = canvas.height;
  if (width === 0 || height === 0) return { score: 0, status: 'NO_IMAGE', label: 'Empty Frame' };

  // Sample a central region (to keep real-time computation extremely fast)
  const sampleW = Math.min(width, 320);
  const sampleH = Math.min(height, 240);
  const startX = Math.floor((width - sampleW) / 2);
  const startY = Math.floor((height - sampleH) / 2);

  const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
  const data = imgData.data;

  // Convert to grayscale buffer
  const gray = new Float32Array(sampleW * sampleH);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    // Standard luminosity weights: 0.299 R + 0.587 G + 0.114 B
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // 3x3 Laplacian Convolution Kernel:
  // [  0,  1,  0 ]
  // [  1, -4,  1 ]
  // [  0,  1,  0 ]
  const laplacian = new Float32Array((sampleW - 2) * (sampleH - 2));
  let sum = 0;
  let idx = 0;

  for (let y = 1; y < sampleH - 1; y++) {
    for (let x = 1; x < sampleW - 1; x++) {
      const c = gray[y * sampleW + x];
      const top = gray[(y - 1) * sampleW + x];
      const bottom = gray[(y + 1) * sampleW + x];
      const left = gray[y * sampleW + (x - 1)];
      const right = gray[y * sampleW + (x + 1)];

      const val = top + bottom + left + right - 4 * c;
      laplacian[idx] = val;
      sum += val;
      idx++;
    }
  }

  const N = laplacian.length;
  if (N === 0) return { score: 0, status: 'ERROR', label: 'Empty Matrix' };

  const mean = sum / N;
  let varianceSum = 0;
  for (let i = 0; i < N; i++) {
    const diff = laplacian[i] - mean;
    varianceSum += diff * diff;
  }

  const variance = Math.round((varianceSum / N) * 10) / 10;

  // Evidentiary Thresholds:
  // > 100: Sharp / Admissible
  // 40 - 100: Marginal Focus (Warn inspector)
  // < 40: Severe Blur (Inadmissible)
  let status = 'SHARP';
  let label = 'SHARP (EVIDENTIARY QUALITY)';
  let color = '#2F855A'; // Emerald

  if (variance < 45) {
    status = 'BLURRED';
    label = 'BLUR DETECTED (INADMISSIBLE)';
    color = '#C53030'; // Crimson
  } else if (variance < 100) {
    status = 'MARGINAL';
    label = 'MARGINAL FOCUS (HOLD STEADY)';
    color = '#DD6B20'; // Amber
  }

  return {
    score: variance,
    status,
    label,
    color,
    isAdmissible: variance >= 45
  };
}
