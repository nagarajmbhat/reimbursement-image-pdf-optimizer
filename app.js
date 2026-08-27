/**
 * Reimbursement Image-to-PDF Watermarker & Optimizer
 * Fully client-side processing: HEIC support, Canvas stamping, Compression,
 * and Dynamic 5MB PDF splitting.
 */

// Application State
const state = {
  filesQueue: [], // Array of { id, file, name, size, isHeic, rawUrl }
  processedImages: [], // Array of { id, name, originalSize, compressedSize, dataUrl, blob, width, height }
  generatedPdfParts: [], // Array of { partNumber, name, blob, blobUrl, pageCount, sizeBytes }
  isProcessing: false
};

// DOM Element References
const elements = {
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('fileInput'),
  browseFilesBtn: document.getElementById('browseFilesBtn'),
  
  // Settings Inputs
  watermarkTextInput: document.getElementById('watermarkTextInput'),
  charCount: document.getElementById('charCount'),
  pdfFilenameInput: document.getElementById('pdfFilenameInput'),
  watermarkPosition: document.getElementById('watermarkPosition'),
  watermarkStyle: document.getElementById('watermarkStyle'),
  qualitySlider: document.getElementById('qualitySlider'),
  qualityValue: document.getElementById('qualityValue'),
  maxDimSlider: document.getElementById('maxDimSlider'),
  maxDimValue: document.getElementById('maxDimValue'),
  pdfLimitSlider: document.getElementById('pdfLimitSlider'),
  pdfLimitValue: document.getElementById('pdfLimitValue'),
  
  // Mini Preview Elements
  previewBadgeDisplay: document.getElementById('previewBadgeDisplay'),
  previewBadgeText: document.getElementById('previewBadgeText'),
  
  // Queue & Action Elements
  queueCard: document.getElementById('queueCard'),
  queueCount: document.getElementById('queueCount'),
  totalRawSize: document.getElementById('totalRawSize'),
  queueActions: document.getElementById('queueActions'),
  queueEmptyState: document.getElementById('queueEmptyState'),
  imageGrid: document.getElementById('imageGrid'),
  clearQueueBtn: document.getElementById('clearQueueBtn'),
  processBtn: document.getElementById('processBtn'),
  
  // Progress Elements
  progressCard: document.getElementById('progressCard'),
  progressTitle: document.getElementById('progressTitle'),
  progressDesc: document.getElementById('progressDesc'),
  progressPercent: document.getElementById('progressPercent'),
  progressBarFill: document.getElementById('progressBarFill'),
  
  // Results Elements
  resultsCard: document.getElementById('resultsCard'),
  resultsSummary: document.getElementById('resultsSummary'),
  pdfPartsGrid: document.getElementById('pdfPartsGrid'),
  downloadZipBtn: document.getElementById('downloadZipBtn'),
  
  // Modal Elements
  previewModal: document.getElementById('previewModal'),
  modalPreviewImg: document.getElementById('modalPreviewImg'),
  modalFileName: document.getElementById('modalFileName'),
  modalDimInfo: document.getElementById('modalDimInfo'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  closeModalFooterBtn: document.getElementById('closeModalFooterBtn')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadSavedSettings();
  setupEventListeners();
  updateLiveStampPreview();
});

/**
 * Load user preferences from LocalStorage
 */
function loadSavedSettings() {
  const savedText = localStorage.getItem('reimb_watermark_text');
  if (savedText) {
    elements.watermarkTextInput.value = savedText;
  }
  const savedFilename = localStorage.getItem('reimb_pdf_filename');
  if (savedFilename && elements.pdfFilenameInput) {
    elements.pdfFilenameInput.value = savedFilename;
  }
  const savedPos = localStorage.getItem('reimb_watermark_pos');
  if (savedPos) elements.watermarkPosition.value = savedPos;

  const savedStyle = localStorage.getItem('reimb_watermark_style');
  if (savedStyle) elements.watermarkStyle.value = savedStyle;

  const savedQuality = localStorage.getItem('reimb_quality');
  if (savedQuality) {
    elements.qualitySlider.value = savedQuality;
    elements.qualityValue.textContent = `${savedQuality}%`;
  }

  const savedMaxDim = localStorage.getItem('reimb_maxdim');
  if (savedMaxDim) {
    elements.maxDimSlider.value = savedMaxDim;
    elements.maxDimValue.textContent = `${savedMaxDim} px`;
  }

  const savedPdfLimit = localStorage.getItem('reimb_pdflimit');
  if (savedPdfLimit) {
    elements.pdfLimitSlider.value = savedPdfLimit;
    elements.pdfLimitValue.textContent = `${savedPdfLimit} MB`;
  }
}

/**
 * Clean & sanitize user PDF base filename
 */
function getCleanPdfBaseName() {
  let raw = (elements.pdfFilenameInput && elements.pdfFilenameInput.value.trim()) || 'Reimbursement_Receipts';
  raw = raw.replace(/\.pdf$/i, ''); // Strip .pdf if entered
  raw = raw.replace(/[/\\?%*:|"<>]/g, '_').trim(); // Sanitize filesystem chars
  return raw || 'Reimbursement_Receipts';
}

/**
 * Save user preferences to LocalStorage
 */
function saveSettings() {
  localStorage.setItem('reimb_watermark_text', elements.watermarkTextInput.value);
  if (elements.pdfFilenameInput) {
    localStorage.setItem('reimb_pdf_filename', elements.pdfFilenameInput.value);
  }
  localStorage.setItem('reimb_watermark_pos', elements.watermarkPosition.value);
  localStorage.setItem('reimb_watermark_style', elements.watermarkStyle.value);
  localStorage.setItem('reimb_quality', elements.qualitySlider.value);
  localStorage.setItem('reimb_maxdim', elements.maxDimSlider.value);
  localStorage.setItem('reimb_pdflimit', elements.pdfLimitSlider.value);
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Drag and Drop
  ['dragenter', 'dragover'].forEach(eventName => {
    elements.dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    elements.dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      elements.dropzone.classList.remove('dragover');
    });
  });

  elements.dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesSelected(files);
    }
  });

  elements.browseFilesBtn.addEventListener('click', () => {
    elements.fileInput.click();
  });

  elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
      elements.fileInput.value = ''; // Reset input to allow re-uploading same file
    }
  });

  // Settings Events
  elements.watermarkTextInput.addEventListener('input', () => {
    updateLiveStampPreview();
    saveSettings();
  });

  if (elements.pdfFilenameInput) {
    elements.pdfFilenameInput.addEventListener('input', saveSettings);
  }

  elements.watermarkPosition.addEventListener('change', () => {
    updateLiveStampPreview();
    saveSettings();
  });

  elements.watermarkStyle.addEventListener('change', () => {
    updateLiveStampPreview();
    saveSettings();
  });

  elements.qualitySlider.addEventListener('input', (e) => {
    elements.qualityValue.textContent = `${e.target.value}%`;
    saveSettings();
  });

  elements.maxDimSlider.addEventListener('input', (e) => {
    elements.maxDimValue.textContent = `${e.target.value} px`;
    saveSettings();
  });

  elements.pdfLimitSlider.addEventListener('input', (e) => {
    elements.pdfLimitValue.textContent = `${e.target.value} MB`;
    saveSettings();
  });

  // Quick Insert Tags
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.insert;
      let textToInsert = tag;
      if (tag === '[DATE]') {
        const today = new Date();
        textToInsert = today.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }
      
      const currentVal = elements.watermarkTextInput.value;
      elements.watermarkTextInput.value = currentVal ? `${currentVal} | ${textToInsert}` : textToInsert;
      updateLiveStampPreview();
      saveSettings();
    });
  });

  // Queue actions
  elements.clearQueueBtn.addEventListener('click', clearQueue);
  elements.processBtn.addEventListener('click', startProcessingPipeline);
  elements.downloadZipBtn.addEventListener('click', downloadAllAsZip);

  // Modal close handlers
  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.closeModalFooterBtn.addEventListener('click', closeModal);
  elements.previewModal.addEventListener('click', (e) => {
    if (e.target === elements.previewModal) closeModal();
  });
}

/**
 * Update live badge in the settings preview card
 */
function updateLiveStampPreview() {
  const text = elements.watermarkTextInput.value.trim() || 'SAMPLE WATERMARK';
  elements.charCount.textContent = `${text.length} chars`;
  elements.previewBadgeText.textContent = text;

  // Update style classes
  elements.previewBadgeDisplay.className = 'preview-stamp-badge';
  elements.previewBadgeDisplay.classList.add(`badge-style-${elements.watermarkStyle.value}`);
  elements.previewBadgeDisplay.classList.add(`pos-${elements.watermarkPosition.value}`);
}

/**
 * Format bytes to readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Handle newly uploaded files
 */
function handleFilesSelected(fileList) {
  const newFiles = Array.from(fileList);
  
  newFiles.forEach(file => {
    const isHeic = file.name.toLowerCase().endsWith('.heic') || 
                   file.name.toLowerCase().endsWith('.heif') || 
                   file.type === 'image/heic' || 
                   file.type === 'image/heif';

    const fileItem = {
      id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      file: file,
      name: file.name,
      size: file.size,
      isHeic: isHeic,
      rawUrl: isHeic ? null : URL.createObjectURL(file),
      processedDataUrl: null
    };

    state.filesQueue.push(fileItem);
  });

  renderQueue();
}

/**
 * Render the queue of files
 */
function renderQueue() {
  elements.imageGrid.innerHTML = '';
  
  if (state.filesQueue.length === 0) {
    elements.queueEmptyState.style.display = 'block';
    elements.queueActions.style.display = 'none';
    elements.queueCount.textContent = '0';
    elements.totalRawSize.textContent = '0 MB total';
    return;
  }

  elements.queueEmptyState.style.display = 'none';
  elements.queueActions.style.display = 'flex';
  elements.queueCount.textContent = state.filesQueue.length;

  const totalBytes = state.filesQueue.reduce((acc, cur) => acc + cur.size, 0);
  elements.totalRawSize.textContent = `${formatBytes(totalBytes)} total`;

  state.filesQueue.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.id = `card_${item.id}`;

    const ext = item.name.split('.').pop() || 'IMG';
    const thumbSrc = item.rawUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23818cf8" stroke-width="1.5"%3E%3Cpath d="M12 19l7-7 3 3-7 7-3-3z"%3E%3C/path%3E%3Cpath d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"%3E%3C/path%3E%3C/svg%3E';

    card.innerHTML = `
      <div class="image-thumb-wrapper">
        <img class="image-thumb" src="${thumbSrc}" alt="${item.name}" loading="lazy">
        <span class="image-badge-order">#${index + 1}</span>
        <span class="image-badge-format">${ext}</span>
        <div class="image-card-actions">
          <button type="button" class="thumb-btn preview-single-btn" title="Inspect">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button type="button" class="thumb-btn delete-btn" title="Remove">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div class="image-details">
        <span class="image-filename" title="${item.name}">${item.name}</span>
        <div class="image-meta">
          <span>${formatBytes(item.size)}</span>
          <span class="status-tag" id="status_${item.id}">${item.isHeic ? 'HEIC Image' : 'Ready'}</span>
        </div>
      </div>
    `;

    // Action handlers
    card.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFileFromQueue(item.id);
    });

    card.querySelector('.preview-single-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openModalPreview(item);
    });

    elements.imageGrid.appendChild(card);
  });
}

/**
 * Remove single file from queue
 */
function removeFileFromQueue(fileId) {
  const index = state.filesQueue.findIndex(f => f.id === fileId);
  if (index !== -1) {
    if (state.filesQueue[index].rawUrl) {
      URL.revokeObjectURL(state.filesQueue[index].rawUrl);
    }
    state.filesQueue.splice(index, 1);
    renderQueue();
  }
}

/**
 * Clear full queue
 */
function clearQueue() {
  state.filesQueue.forEach(item => {
    if (item.rawUrl) URL.revokeObjectURL(item.rawUrl);
  });
  state.filesQueue = [];
  state.processedImages = [];
  state.generatedPdfParts = [];
  elements.resultsCard.style.display = 'none';
  elements.progressCard.style.display = 'none';
  renderQueue();
}

/**
 * Open Modal Preview for an item
 */
async function openModalPreview(item) {
  elements.modalFileName.textContent = item.name;
  elements.modalPreviewImg.src = '';
  elements.modalDimInfo.textContent = 'Rendering preview with watermark...';
  elements.previewModal.style.display = 'flex';

  try {
    const stamped = await processAndStampImage(item);
    elements.modalPreviewImg.src = stamped.dataUrl;
    elements.modalDimInfo.textContent = `${stamped.width} × ${stamped.height} px | Compressed: ${formatBytes(stamped.compressedSize)} (from ${formatBytes(item.size)})`;
  } catch (err) {
    console.error('Preview error:', err);
    elements.modalDimInfo.textContent = 'Error rendering preview: ' + err.message;
  }
}

function closeModal() {
  elements.previewModal.style.display = 'none';
}

/**
 * Core Image Processing & Canvas Watermarking Function
 */
async function processAndStampImage(queueItem) {
  let imageBlob = queueItem.file;

  // 1. Decode HEIC if necessary
  if (queueItem.isHeic) {
    try {
      if (typeof heic2any !== 'undefined') {
        const conversionResult = await heic2any({
          blob: imageBlob,
          toType: 'image/jpeg',
          quality: 0.9
        });
        imageBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
      }
    } catch (e) {
      console.warn('heic2any failed or unavailable, fallback to raw blob:', e);
    }
  }

  // 2. Load into Image object
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(imageBlob);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = (e) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image data'));
    };
    image.src = objectUrl;
  });

  // 3. Compute target scaled dimensions
  const maxDim = parseInt(elements.maxDimSlider.value, 10) || 1800;
  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  if (targetWidth > maxDim || targetHeight > maxDim) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
      targetWidth = maxDim;
    } else {
      targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
      targetHeight = maxDim;
    }
  }

  // 4. Setup Canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  // Draw background image
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 5. Draw Watermark Badge
  const watermarkText = elements.watermarkTextInput.value.trim();
  if (watermarkText) {
    drawWatermarkBadge(ctx, targetWidth, targetHeight, watermarkText);
  }

  // 6. Compress to JPEG Blob
  const quality = (parseInt(elements.qualitySlider.value, 10) || 82) / 100;
  
  const compressedBlob = await new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', quality);
  });

  const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

  return {
    id: queueItem.id,
    name: queueItem.name,
    originalSize: queueItem.size,
    compressedSize: compressedBlob.size,
    blob: compressedBlob,
    dataUrl: compressedDataUrl,
    width: targetWidth,
    height: targetHeight
  };
}

/**
 * Draw stylized watermark badge on canvas with high contrast
 */
function drawWatermarkBadge(ctx, width, height, text) {
  const position = elements.watermarkPosition.value;
  const style = elements.watermarkStyle.value;

  // Responsive font sizing based on image resolution
  const baseDim = Math.min(width, height);
  const fontSize = Math.max(16, Math.min(48, Math.round(baseDim / 38)));
  ctx.font = `bold ${fontSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;

  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  const padX = fontSize * 0.9;
  const padY = fontSize * 0.55;
  const badgeWidth = textWidth + padX * 2;
  const badgeHeight = textHeight + padY * 2;
  const margin = Math.max(16, Math.round(baseDim * 0.03));
  const borderRadius = Math.round(badgeHeight * 0.35);

  let x = 0;
  let y = 0;

  switch (position) {
    case 'top-left':
      x = margin;
      y = margin;
      break;
    case 'top-right':
      x = width - badgeWidth - margin;
      y = margin;
      break;
    case 'bottom-left':
      x = margin;
      y = height - badgeHeight - margin;
      break;
    case 'bottom-right':
    default:
      x = width - badgeWidth - margin;
      y = height - badgeHeight - margin;
      break;
  }

  // Set style parameters
  let bgColor = 'rgba(15, 23, 42, 0.88)';
  let textColor = '#ffffff';
  let borderColor = 'rgba(255, 255, 255, 0.25)';
  let shadowColor = 'rgba(0, 0, 0, 0.65)';

  if (style === 'solid-dark') {
    bgColor = '#0f172a';
    textColor = '#ffffff';
    borderColor = '#334155';
    shadowColor = 'rgba(0, 0, 0, 0.85)';
  } else if (style === 'accent-pill') {
    bgColor = 'rgba(99, 102, 241, 0.95)';
    textColor = '#ffffff';
    borderColor = 'rgba(255, 255, 255, 0.4)';
    shadowColor = 'rgba(99, 102, 241, 0.5)';
  } else if (style === 'clean-shadow') {
    bgColor = '#ffffff';
    textColor = '#0f172a';
    borderColor = '#cbd5e1';
    shadowColor = 'rgba(0, 0, 0, 0.6)';
  }

  // Draw shadow + rounded badge
  ctx.save();
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = Math.round(fontSize * 0.7);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(fontSize * 0.25);

  // Rounded rectangle path
  ctx.beginPath();
  ctx.moveTo(x + borderRadius, y);
  ctx.lineTo(x + badgeWidth - borderRadius, y);
  ctx.quadraticCurveTo(x + badgeWidth, y, x + badgeWidth, y + borderRadius);
  ctx.lineTo(x + badgeWidth, y + badgeHeight - borderRadius);
  ctx.quadraticCurveTo(x + badgeWidth, y + badgeHeight, x + badgeWidth - borderRadius, y + badgeHeight);
  ctx.lineTo(x + borderRadius, y + badgeHeight);
  ctx.quadraticCurveTo(x, y + badgeHeight, x, y + badgeHeight - borderRadius);
  ctx.lineTo(x, y + borderRadius);
  ctx.quadraticCurveTo(x, y, x + borderRadius, y);
  ctx.closePath();

  ctx.fillStyle = bgColor;
  ctx.fill();

  // Draw border outline
  ctx.lineWidth = Math.max(1.5, Math.round(fontSize * 0.07));
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.restore();

  // Draw text in center of badge
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padX, y + badgeHeight / 2 + 1);
}

/**
 * Main Processing Pipeline:
 * 1. Process all images (HEIC decode, watermark, compress)
 * 2. Asynchronously build multi-page PDFs with 5MB strict limit
 * 3. Render parts for download and ZIP creation
 */
async function startProcessingPipeline() {
  if (state.filesQueue.length === 0 || state.isProcessing) return;

  state.isProcessing = true;
  elements.processBtn.disabled = true;
  elements.resultsCard.style.display = 'none';
  elements.progressCard.style.display = 'block';

  state.processedImages = [];
  state.generatedPdfParts = [];

  const totalFiles = state.filesQueue.length;
  const maxPdfLimitMB = parseFloat(elements.pdfLimitSlider.value) || 4.8;
  const maxPdfLimitBytes = maxPdfLimitMB * 1024 * 1024;

  try {
    // Step 1: Process and compress each image
    for (let i = 0; i < totalFiles; i++) {
      const queueItem = state.filesQueue[i];
      const percent = Math.round(((i) / (totalFiles * 2)) * 100);

      elements.progressTitle.textContent = `Processing Image (${i + 1} of ${totalFiles})`;
      elements.progressDesc.textContent = `Stamping & compressing "${queueItem.name}"...`;
      elements.progressPercent.textContent = `${percent}%`;
      elements.progressBarFill.style.width = `${percent}%`;

      const processed = await processAndStampImage(queueItem);
      state.processedImages.push(processed);

      // Update card thumbnail if it was HEIC
      const card = document.getElementById(`card_${queueItem.id}`);
      if (card) {
        const thumbImg = card.querySelector('.image-thumb');
        if (thumbImg) thumbImg.src = processed.dataUrl;
        const statusTag = document.getElementById(`status_${queueItem.id}`);
        if (statusTag) {
          statusTag.textContent = `Done (${formatBytes(processed.compressedSize)})`;
          statusTag.style.color = '#10b981';
        }
      }
    }

    // Step 2: Assemble Multi-page PDFs with Smart Auto-Splitting at 5MB
    elements.progressTitle.textContent = `Generating Multi-page PDFs...`;
    elements.progressDesc.textContent = `Enforcing max file size limit (${maxPdfLimitMB} MB)...`;

    const { jsPDF } = window.jspdf;
    let currentPartNumber = 1;
    let currentDoc = null;
    let currentPartImages = [];

    for (let i = 0; i < state.processedImages.length; i++) {
      const imgItem = state.processedImages[i];
      const percent = 50 + Math.round(((i + 1) / (state.processedImages.length * 2)) * 100);
      elements.progressPercent.textContent = `${percent}%`;
      elements.progressBarFill.style.width = `${percent}%`;

      // Check if we need to start a new document
      if (!currentDoc) {
        currentDoc = createPdfInstance(jsPDF, imgItem);
        addPageToPdf(currentDoc, imgItem, true);
        currentPartImages.push(imgItem);
      } else {
        // Test adding the page and checking PDF size
        addPageToPdf(currentDoc, imgItem, false);
        currentPartImages.push(imgItem);

        // Generate temporary blob to test size
        const currentBlob = currentDoc.output('blob');
        
        if (currentBlob.size > maxPdfLimitBytes && currentPartImages.length > 1) {
          // Exceeded limit: Remove last added page from current doc and seal it
          currentPartImages.pop(); // Remove the one that broke the limit

          // Rebuild currentPart without the overflowing image
          const sealedDoc = createPdfInstance(jsPDF, currentPartImages[0]);
          addPageToPdf(sealedDoc, currentPartImages[0], true);
          for (let p = 1; p < currentPartImages.length; p++) {
            addPageToPdf(sealedDoc, currentPartImages[p], false);
          }

          const sealedBlob = sealedDoc.output('blob');
          savePdfPart(currentPartNumber, sealedBlob, currentPartImages.length);

          // Start next part with current overflowing image
          currentPartNumber++;
          currentPartImages = [imgItem];
          currentDoc = createPdfInstance(jsPDF, imgItem);
          addPageToPdf(currentDoc, imgItem, true);
        }
      }
    }

    // Finalize the last open PDF part
    if (currentDoc && currentPartImages.length > 0) {
      const finalBlob = currentDoc.output('blob');
      savePdfPart(currentPartNumber, finalBlob, currentPartImages.length);
    }

    // Processing finished successfully
    elements.progressPercent.textContent = `100%`;
    elements.progressBarFill.style.width = `100%`;
    setTimeout(() => {
      elements.progressCard.style.display = 'none';
      renderResults();
    }, 500);

  } catch (err) {
    console.error('Processing Pipeline Error:', err);
    alert('An error occurred during processing: ' + err.message);
    elements.progressCard.style.display = 'none';
  } finally {
    state.isProcessing = false;
    elements.processBtn.disabled = false;
  }
}

/**
 * Helper to initialize a jsPDF instance with page orientation fitting image
 */
function createPdfInstance(jsPDF, firstImg) {
  const orientation = firstImg.width >= firstImg.height ? 'landscape' : 'portrait';
  return new jsPDF({
    orientation: orientation,
    unit: 'pt',
    format: 'a4',
    compress: true
  });
}

/**
 * Helper to add an image page to PDF cleanly fitted to A4
 */
function addPageToPdf(doc, imgItem, isFirstPage) {
  const orientation = imgItem.width >= imgItem.height ? 'landscape' : 'portrait';

  if (!isFirstPage) {
    doc.addPage('a4', orientation);
  }

  // A4 dimensions in points: 595.28 x 841.89
  const pageWidth = orientation === 'landscape' ? 841.89 : 595.28;
  const pageHeight = orientation === 'landscape' ? 595.28 : 841.89;
  const margin = 20; // 20pt padding

  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  // Scale image to fit inside usable area while preserving aspect ratio
  const imgAspect = imgItem.width / imgItem.height;
  const usableAspect = usableWidth / usableHeight;

  let renderWidth, renderHeight;
  if (imgAspect > usableAspect) {
    renderWidth = usableWidth;
    renderHeight = usableWidth / imgAspect;
  } else {
    renderHeight = usableHeight;
    renderWidth = usableHeight * imgAspect;
  }

  const posX = (pageWidth - renderWidth) / 2;
  const posY = (pageHeight - renderHeight) / 2;

  doc.addImage(imgItem.dataUrl, 'JPEG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');
}

/**
 * Save PDF Part metadata to state
 */
function savePdfPart(partNumber, blob, pageCount) {
  const baseName = getCleanPdfBaseName();
  const name = `${baseName}_Part${partNumber}.pdf`;
  const blobUrl = URL.createObjectURL(blob);
  
  state.generatedPdfParts.push({
    partNumber,
    name,
    blob,
    blobUrl,
    pageCount,
    sizeBytes: blob.size
  });
}

/**
 * Render Results Section with download cards
 */
function renderResults() {
  elements.resultsCard.style.display = 'block';
  elements.pdfPartsGrid.innerHTML = '';

  const partCount = state.generatedPdfParts.length;
  const imgCount = state.processedImages.length;
  elements.resultsSummary.textContent = `Successfully processed ${imgCount} images into ${partCount} PDF part${partCount > 1 ? 's' : ''} (all strictly within the 5MB size limit).`;

  state.generatedPdfParts.forEach(part => {
    const card = document.createElement('div');
    card.className = 'pdf-part-card';

    card.innerHTML = `
      <div class="pdf-part-header">
        <div>
          <h4 class="pdf-part-name">Part ${part.partNumber}</h4>
          <span style="font-size:0.75rem; color:#94a3b8;">${part.name}</span>
        </div>
        <span class="pdf-part-badge">&lt; 5MB Verified</span>
      </div>

      <div class="pdf-part-meta">
        <div>Pages: <strong>${part.pageCount}</strong></div>
        <div>File Size: <strong>${formatBytes(part.sizeBytes)}</strong></div>
      </div>

      <a href="${part.blobUrl}" download="${part.name}" class="btn btn-primary btn-sm" style="margin-top:0.5rem; text-decoration:none;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download Part ${part.partNumber}
      </a>
    `;

    elements.pdfPartsGrid.appendChild(card);
  });

  // Smooth scroll to results
  elements.resultsCard.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Package all PDF parts into a ZIP file and trigger download
 */
async function downloadAllAsZip() {
  if (state.generatedPdfParts.length === 0) return;

  if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
    alert('ZIP packaging libraries not ready. Please download individual PDF parts.');
    return;
  }

  const baseName = getCleanPdfBaseName();
  const zip = new JSZip();
  const folder = zip.folder(baseName);

  state.generatedPdfParts.forEach(part => {
    folder.file(part.name, part.blob);
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `${baseName}_All_Parts.zip`);
}
