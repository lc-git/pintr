import { pinterCreator } from './lib/PINTR';

import { generateSvg } from './lib/svg';
import { generateSmoothSvg } from './lib/smooth-svg';

import { debounce } from './lib/utils';

import type { Coord } from './lib/PINTR';

export type configType = {
  contrast: number;
  definition: number;
  density: number;
  makeSmoothSvg: true | false;
  singleLine: true | false;
  strokeWidth: number;
  smoothingAmount: number;
  strokeColor: string;
};

const DEFAULT_IMG = '/zierA_logo.png';

let CONFIG: configType = {
  contrast: 50,
  definition: 50,
  density: 50,
  makeSmoothSvg: false,
  singleLine: true,
  strokeWidth: 1,
  smoothingAmount: 50,
  strokeColor: '#000000',
};

let GLOBAL: {
  currentImgSrc: string;
  coords: [Coord, Coord][];
  width: number;
  height: number;
} = {
  currentImgSrc: DEFAULT_IMG,
  coords: [],
  width: 512,
  height: 512,
};

async function main(imgSrc: string) {
  const canvasDrawEl: HTMLCanvasElement | null =
    document.querySelector('canvas#draw');
  if (!canvasDrawEl) {
    throw new Error();
  }
  const PINTR = await pinterCreator(imgSrc, {
    canvasDrawEl,
    onDraw({ coords }) {
      GLOBAL.coords = coords;
    },
    onLoad({ width, height }) {
      document.documentElement.style.setProperty('--sizew', `${width / 2}px`);
      document.documentElement.style.setProperty('--sizeh', `${height / 2}px`);

      GLOBAL.width = width;
      GLOBAL.height = height;
    },
    onFinish({ coords }) {
      if (!CONFIG.makeSmoothSvg) return;

      console.warn('MAKING');

      const smoothSvgData = generateSmoothSvg(coords, {
        ...CONFIG,
        size: [GLOBAL.width, GLOBAL.height],
      });

      const smoothSvgContainerEl = document.querySelector(
        '.smooth-svg-container'
      ) as HTMLElement;
      smoothSvgContainerEl.innerHTML = smoothSvgData;
    },
  });

  const srcImgEl: HTMLImageElement | null = document.querySelector('#srcImg');
  const loadingEl: HTMLElement | null = document.querySelector('.loading');

  if (srcImgEl && loadingEl) {
    srcImgEl.style.backgroundImage = `url("${imgSrc}")`;
    loadingEl.style.display = 'none';
  }
  PINTR.render(CONFIG);
}

function readFile(evt: Event) {
  evt.preventDefault();
  evt.stopPropagation();

  const target = evt.target as HTMLInputElement;

  if (!target || !target.files) return;

  const file = target.files[0] as File;

  if (file) {
    const FR = new FileReader();
    FR.addEventListener('load', function (e) {
      if (!e || !e.target) return;
      GLOBAL.currentImgSrc = String(e.target.result);
      main(String(e.target.result));
    });

    FR.readAsDataURL(file);
  }
}

function getInputNumber(selector: string): number {
  const inputEl: HTMLInputElement | null = document.querySelector(selector);
  return inputEl ? Number(inputEl.value) : 0;
}

function getInputBoolean(selector: string): true | false {
  const inputEl: HTMLInputElement | null = document.querySelector(selector);
  return inputEl ? Boolean(Number(inputEl.value)) : false;
}

function getInputColor(selector: string): string {
  const inputEl: HTMLInputElement | null = document.querySelector(selector);
  return inputEl ? inputEl.value : '#000000';
}

function startNewDrawing() {
  const density = getInputNumber('#density');
  const singleLine = getInputBoolean('#singleLine');
  const contrast = getInputNumber('#contrast');
  const definition = getInputNumber('#definition');
  const strokeWidth = getInputNumber('#strokeWidth');
  const makeSmoothSvg = getInputBoolean('#makeSmoothSvg');
  const smoothingAmount = getInputNumber('#smoothingAmount');
  const strokeColor = getInputColor('#strokeColor');

  CONFIG = {
    density,
    singleLine,
    contrast,
    definition,
    strokeWidth,
    makeSmoothSvg,
    smoothingAmount,
    strokeColor,
  };

  // 控制平滑SVG预览和参数显示
  const smoothPreview = document.querySelector('.smooth-preview') as HTMLElement;
  const smoothAmountCol = document.querySelector('.smooth-amount-col') as HTMLElement;
  const downloadSmoothSvgBtn = document.getElementById('downloadSmoothSvg') as HTMLButtonElement;
  if (makeSmoothSvg) {
    if (smoothPreview) smoothPreview.style.display = '';
    if (smoothAmountCol) smoothAmountCol.style.display = '';
    if (downloadSmoothSvgBtn) downloadSmoothSvgBtn.style.display = '';
  } else {
    if (smoothPreview) smoothPreview.style.display = 'none';
    if (smoothAmountCol) smoothAmountCol.style.display = 'none';
    if (downloadSmoothSvgBtn) downloadSmoothSvgBtn.style.display = 'none';
  }

  const smoothSvgContainerEl = document.querySelector(
    '.experimental--smoth-svg--container'
  ) as HTMLElement;
  if (smoothSvgContainerEl) smoothSvgContainerEl.style.display = 'none';

  const smooghSvgContainerWarningEl = document.querySelector(
    '.experimental--smoth-svg--container--warning'
  ) as HTMLElement;
  if (smooghSvgContainerWarningEl) smooghSvgContainerWarningEl.style.display = singleLine ? 'none' : 'block';

  main(GLOBAL.currentImgSrc);
}

let count = 0;

function onDrop(ev: DragEvent) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (!ev.dataTransfer || !ev.dataTransfer.files || !ev.dataTransfer.files[0])
    return;

  const FR = new FileReader();
  FR.addEventListener('load', function (e) {
    if (!e || !e.target || !e.target.result) {
      return;
    }

    GLOBAL.currentImgSrc = String(e.target.result);
    main(String(e.target.result));
    document.body.classList.remove('-dragging');
    count = 0;
  });

  FR.readAsDataURL(ev.dataTransfer.files[0]);
}

function onDragOver(evt: DragEvent) {
  evt.preventDefault();
  evt.stopPropagation();
}

function onDragEnter(evt: DragEvent) {
  evt.stopPropagation();
  count++;

  if (count) {
    document.body.classList.add('-dragging');
  } else {
    document.body.classList.remove('-dragging');
  }
}

function onDragLeave(evt: DragEvent) {
  evt.stopPropagation();
  count--;

  if (count) {
    document.body.classList.add('-dragging');
  } else {
    document.body.classList.remove('-dragging');
  }
}

// ADD LISTENERS
const appEl = document.querySelector('.app') as HTMLElement;
appEl.addEventListener('drop', onDrop);
appEl.addEventListener('dragover', onDragOver);
appEl.addEventListener('dragenter', onDragEnter);
appEl.addEventListener('dragleave', onDragLeave);

const inputImageFileEl = document.querySelector(
  '#inputImageFile'
) as HTMLInputElement;

inputImageFileEl.addEventListener('change', readFile);

const inputImageButtonEl = document.querySelector(
  '#inputImageButton'
) as HTMLElement;
inputImageButtonEl.addEventListener('click', () => {
  inputImageFileEl.click();
});

document.querySelectorAll('[data-start-drawing]').forEach((input) => {
  input.addEventListener('change', debounce(startNewDrawing, 32));
});

const smoothingAmountEl = document.querySelector(
  '#smoothingAmount'
) as HTMLInputElement;
smoothingAmountEl.addEventListener(
  'change',
  debounce(() => {
    CONFIG.smoothingAmount = getInputNumber('#smoothingAmount');

    const smoothSvgData = generateSmoothSvg(GLOBAL.coords, {
      ...CONFIG,
      size: [GLOBAL.width, GLOBAL.height],
    });
    const smoothSvgContainerEl = document.querySelector(
      '.smooth-svg-container'
    ) as HTMLElement;
    smoothSvgContainerEl.innerHTML = smoothSvgData;
  }, 128)
);

// 下载PNG
const downloadEl = document.querySelector('#download') as HTMLButtonElement;
downloadEl.addEventListener('click', () => {
  const link = document.createElement('a');
  const canvasDrawEl = document.querySelector('canvas#draw') as HTMLCanvasElement;
  link.download = 'ZIERA.png';
  link.href = canvasDrawEl.toDataURL();
  link.click();
});

// 下载普通SVG
const downloadSvgEl = document.querySelector('#downloadSvg') as HTMLButtonElement;
downloadSvgEl.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'ZIERA.svg';
  const svgData = generateSvg(GLOBAL.coords, {
    ...CONFIG,
    size: [GLOBAL.width, GLOBAL.height],
  });
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  link.href = svgUrl;
  link.click();
});

// 下载平滑SVG（只绑定一次）
const downloadSmoothSvgBtn = document.getElementById('downloadSmoothSvg') as HTMLButtonElement;
if (downloadSmoothSvgBtn && !downloadSmoothSvgBtn.dataset.bound) {
  downloadSmoothSvgBtn.addEventListener('click', () => {
    const smoothSvgContainer = document.querySelector('.smooth-svg-container') as HTMLElement;
    if (!smoothSvgContainer) return;
    const svgData = smoothSvgContainer.innerHTML;
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ZIERAS.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
  downloadSmoothSvgBtn.dataset.bound = 'true';
}

// 字体映射
const FONT_MAP: Record<string, string> = {
  Brutalita: 'Brutalita',
  NotoSansSC: 'Noto Sans SC',
  Inter: 'Inter',
  OpenSans: 'Open Sans',
};

// 动态添加自定义字体
function addCustomFont(fontName: string, fontUrl: string) {
  const style = document.createElement('style');
  style.innerHTML = `@font-face { font-family: '${fontName}'; src: url('${fontUrl}'); font-display: swap; }`;
  document.head.appendChild(style);
}

// 文字转图片
let isTextMode = false;
let currentFont = 'Brutalita';
let currentFontSize = 64;

function textToDataUrl(text: string, fontFamily: string, fontSize: number): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px '${fontFamily}'`;
  ctx.fillText(text, size / 2, size / 2);
  return canvas.toDataURL('image/png');
}

function switchToTextMode() {
  isTextMode = true;
  (document.getElementById('inputImageFile') as HTMLElement).style.display = 'none';
  (document.querySelector('.text-input-panel') as HTMLElement).style.display = '';
  // 立即预览默认文字
  const text = (document.getElementById('textInput') as HTMLInputElement).value || 'zierA';
  const font = (document.getElementById('fontSelect') as HTMLSelectElement).value;
  const fontSize = Number((document.getElementById('fontSizeRange') as HTMLInputElement).value) || 64;
  const dataUrl = textToDataUrl(text, font, fontSize);
  GLOBAL.currentImgSrc = dataUrl;
  main(dataUrl);
}
function switchToImageMode() {
  isTextMode = false;
  (document.getElementById('inputImageFile') as HTMLElement).style.display = '';
  (document.querySelector('.text-input-panel') as HTMLElement).style.display = 'none';
  // 立即预览当前图片
  main(GLOBAL.currentImgSrc);
}

// 监听按钮
(document.getElementById('inputTextButton') as HTMLElement).addEventListener('click', () => {
  switchToTextMode();
});
(document.getElementById('inputImageButton') as HTMLElement).addEventListener('click', () => {
  switchToImageMode();
});

// 监听文字输入、字体选择、字体上传
const textInput = document.getElementById('textInput') as HTMLInputElement;
const fontSelect = document.getElementById('fontSelect') as HTMLSelectElement;
const fontUpload = document.getElementById('fontUpload') as HTMLInputElement;

const fontSizeRange = document.getElementById('fontSizeRange') as HTMLInputElement;
const fontSizeValue = document.getElementById('fontSizeValue') as HTMLElement;

function updateTextPreview() {
  if (!isTextMode) return;
  const text = textInput.value || 'zierA';
  const font = fontSelect.value;
  const fontSize = Number(fontSizeRange.value) || 64;
  currentFont = font;
  currentFontSize = fontSize;
  fontSizeValue.textContent = String(fontSize);
  const dataUrl = textToDataUrl(text, font, fontSize);
  GLOBAL.currentImgSrc = dataUrl;
  main(dataUrl);
}

textInput.addEventListener('input', updateTextPreview);
fontSelect.addEventListener('change', updateTextPreview);
fontUpload.addEventListener('change', (e) => {
  const files = fontUpload.files;
  if (!files || files.length === 0) return;
  const file = files[0];
  const fontName = file.name.replace(/\.[^.]+$/, '');
  const reader = new FileReader();
  reader.onload = function (evt) {
    if (!evt.target || !evt.target.result) return;
    const fontUrl = URL.createObjectURL(new Blob([evt.target.result]));
    addCustomFont(fontName, fontUrl);
    // 添加到下拉框
    const option = document.createElement('option');
    option.value = fontName;
    option.text = fontName + '（自定义）';
    fontSelect.appendChild(option);
    fontSelect.value = fontName;
    updateTextPreview();
  };
  reader.readAsArrayBuffer(file);
});

fontSizeRange.addEventListener('input', updateTextPreview);

// 初始化时默认图片模式
switchToImageMode();

startNewDrawing();
