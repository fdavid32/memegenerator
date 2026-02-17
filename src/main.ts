import { db, id } from './db';
import { TEMPLATES, generateId } from './meme-editor';

type TextLayer = { id: string; name: string; text: string; x: number; y: number };

const uploadZone = document.getElementById('uploadZone')!;
const imageInput = document.getElementById('imageInput') as HTMLInputElement;
const errorMessage = document.getElementById('errorMessage')!;
const workspace = document.getElementById('workspace')!;
const memeCanvas = document.getElementById('memeCanvas') as HTMLCanvasElement;
const fontSizeInput = document.getElementById('fontSize') as HTMLInputElement;
const fontSizeValue = document.getElementById('fontSizeValue')!;
const textColorInput = document.getElementById('textColor') as HTMLInputElement;
const textColorValue = document.getElementById('textColorValue')!;
const downloadBtn = document.getElementById('downloadBtn')!;
const postBtn = document.getElementById('postBtn')!;
const changeImageBtn = document.getElementById('changeImageBtn')!;
const addTextLayerBtn = document.getElementById('addTextLayerBtn')!;
const deleteTextLayerBtn = document.getElementById('deleteTextLayerBtn')!;
const textLayerList = document.getElementById('textLayerList')!;
const layerTextInput = document.getElementById('layerText') as HTMLTextAreaElement;
const pickerSection = document.getElementById('pickerSection')!;
const templateGrid = document.getElementById('templateGrid')!;
const viewCreate = document.getElementById('viewCreate')!;
const viewFeed = document.getElementById('viewFeed')!;
const feedContainer = document.getElementById('feedContainer')!;
const authStatus = document.getElementById('authStatus')!;
const signInBtn = document.getElementById('signInBtn')!;
const signOutBtn = document.getElementById('signOutBtn')!;

const ctx = memeCanvas.getContext('2d')!;
let currentImage: HTMLImageElement | null = null;
let textLayers: TextLayer[] = [];
let selectedLayerId: string | null = null;
let draggingLayerId: string | null = null;
let dragOffset = { x: 0, y: 0 };
let currentUser: { id: string } | null = null;

function showError(msg: string) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove('hidden');
}

function hideError() {
  errorMessage.classList.add('hidden');
}

function showWorkspace() {
  pickerSection.classList.add('hidden');
  workspace.classList.add('active');
}

function showPicker() {
  pickerSection.classList.remove('hidden');
  workspace.classList.remove('active');
  currentImage = null;
  imageInput.value = '';
  downloadBtn.setAttribute('disabled', '');
  postBtn.setAttribute('disabled', '');
  textLayers = [];
  selectedLayerId = null;
  draggingLayerId = null;
  syncLayerEditor();
  renderLayerList();
}

function getSelectedLayer(): TextLayer | null {
  return textLayers.find((l) => l.id === selectedLayerId) ?? null;
}

function ensureInitialLayers() {
  const padding = 30;
  const fontSize = parseInt(fontSizeInput.value, 10);
  const baseYBottom = Math.max(padding, memeCanvas.height - padding - fontSize);
  textLayers = [
    { id: generateId(), name: 'Text 1', text: '', x: memeCanvas.width / 2, y: padding },
    { id: generateId(), name: 'Text 2', text: '', x: memeCanvas.width / 2, y: baseYBottom },
  ];
  selectedLayerId = textLayers[0]?.id ?? null;
  syncLayerEditor();
  renderLayerList();
}

function syncLayerEditor() {
  const layer = getSelectedLayer();
  if (!layer) {
    layerTextInput.value = '';
    layerTextInput.disabled = true;
    deleteTextLayerBtn.setAttribute('disabled', '');
    return;
  }
  layerTextInput.disabled = false;
  layerTextInput.value = layer.text;
  deleteTextLayerBtn.toggleAttribute('disabled', textLayers.length === 0);
}

function renderLayerList() {
  textLayerList.innerHTML = '';
  if (textLayers.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'layer-empty';
    empty.textContent = 'No text layers. Click "Add text" to create one.';
    textLayerList.appendChild(empty);
    return;
  }
  textLayers.forEach((layer, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'layer-item' + (layer.id === selectedLayerId ? ' active' : '');
    btn.setAttribute('aria-label', `Select ${layer.name}`);
    const name = document.createElement('span');
    name.className = 'layer-name';
    name.textContent = layer.name || `Text ${idx + 1}`;
    const preview = document.createElement('span');
    preview.className = 'layer-preview';
    preview.textContent = (layer.text || '').replace(/\s+/g, ' ').trim() || '(empty)';
    btn.appendChild(name);
    btn.appendChild(preview);
    btn.addEventListener('click', () => {
      selectedLayerId = layer.id;
      syncLayerEditor();
      renderLayerList();
      drawMeme();
    });
    textLayerList.appendChild(btn);
  });
}

function getCanvasCoords(e: MouseEvent) {
  const rect = memeCanvas.getBoundingClientRect();
  const scaleX = memeCanvas.width / rect.width;
  const scaleY = memeCanvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function loadImageFromUrl(src: string) {
  hideError();
  const img = new Image();
  img.onload = () => {
    currentImage = img;
    memeCanvas.width = img.width;
    memeCanvas.height = img.height;
    ensureInitialLayers();
    showWorkspace();
    downloadBtn.removeAttribute('disabled');
    postBtn.removeAttribute('disabled');
    drawMeme();
  };
  img.onerror = () => showError('Failed to load template image.');
  img.src = src;
}

TEMPLATES.forEach((src) => {
  const thumb = document.createElement('button');
  thumb.type = 'button';
  thumb.className = 'template-thumb';
  thumb.setAttribute('aria-label', 'Use template');
  const img = document.createElement('img');
  img.src = '/' + src;
  img.alt = '';
  thumb.appendChild(img);
  thumb.addEventListener('click', () => loadImageFromUrl('/' + src));
  templateGrid.appendChild(thumb);
});

function loadImage(file: File) {
  if (!file || !file.type.startsWith('image/')) {
    showError('Please select a valid image file.');
    return;
  }
  hideError();
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    currentImage = img;
    memeCanvas.width = img.width;
    memeCanvas.height = img.height;
    ensureInitialLayers();
    showWorkspace();
    downloadBtn.removeAttribute('disabled');
    postBtn.removeAttribute('disabled');
    drawMeme();
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    showError('Failed to load image. Please try another file.');
  };
  img.src = url;
}

function drawMeme() {
  if (!currentImage) return;
  ctx.clearRect(0, 0, memeCanvas.width, memeCanvas.height);
  ctx.drawImage(currentImage, 0, 0);
  const fontSize = parseInt(fontSizeInput.value, 10);
  if (!textLayers || textLayers.length === 0) return;
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = textColorInput.value;
  ctx.lineWidth = Math.max(4, Math.floor(fontSize / 8));
  ctx.lineJoin = 'round';
  ctx.textAlign = 'center';
  ctx.font = `${fontSize}px Impact, sans-serif`;
  const lineHeight = fontSize * 1.15;
  ctx.textBaseline = 'top';
  for (const layer of textLayers) {
    const text = (layer.text || '').trimEnd();
    if (!text.trim()) continue;
    const lines = text.split(/\r?\n/);
    let y = layer.y;
    for (const line of lines) {
      if (line.trim()) {
        ctx.strokeText(line, layer.x, y);
        ctx.fillText(line, layer.x, y);
      }
      y += lineHeight;
    }
  }
}

function hitTestLayer(layer: TextLayer, x: number, y: number): boolean {
  if (!layer || !layer.text) return false;
  const lines = layer.text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return false;
  const fontSize = parseInt(fontSizeInput.value, 10);
  const lineHeight = fontSize * 1.15;
  ctx.font = `${fontSize}px Impact, sans-serif`;
  ctx.textAlign = 'center';
  let maxW = 0;
  for (const line of lines) {
    maxW = Math.max(maxW, ctx.measureText(line).width);
  }
  const h = lines.length * lineHeight;
  const left = layer.x - maxW / 2;
  const right = layer.x + maxW / 2;
  const top = layer.y;
  const bottom = layer.y + h;
  return x >= left && x <= right && y >= top && y <= bottom;
}

function handleCanvasMouseDown(e: MouseEvent) {
  if (!currentImage) return;
  const { x, y } = getCanvasCoords(e);
  for (let i = textLayers.length - 1; i >= 0; i--) {
    const layer = textLayers[i];
    if (hitTestLayer(layer, x, y)) {
      draggingLayerId = layer.id;
      selectedLayerId = layer.id;
      dragOffset = { x: layer.x - x, y: layer.y - y };
      memeCanvas.classList.add('dragging');
      syncLayerEditor();
      renderLayerList();
      drawMeme();
      break;
    }
  }
}

function handleCanvasMouseMove(e: MouseEvent) {
  const { x, y } = getCanvasCoords(e);
  if (draggingLayerId) {
    const layer = textLayers.find((l) => l.id === draggingLayerId);
    if (!layer) return;
    layer.x = Math.max(0, Math.min(memeCanvas.width, x + dragOffset.x));
    layer.y = Math.max(0, Math.min(memeCanvas.height, y + dragOffset.y));
    drawMeme();
  } else {
    const overText = textLayers.some((l) => hitTestLayer(l, x, y));
    memeCanvas.style.cursor = overText ? 'grab' : 'default';
  }
}

function handleCanvasMouseUp() {
  if (draggingLayerId) {
    memeCanvas.classList.remove('dragging');
    draggingLayerId = null;
  }
}

memeCanvas.addEventListener('mousedown', handleCanvasMouseDown);
memeCanvas.addEventListener('mousemove', handleCanvasMouseMove);
memeCanvas.addEventListener('mouseup', handleCanvasMouseUp);
memeCanvas.addEventListener('mouseleave', handleCanvasMouseUp);

function downloadMeme() {
  if (!currentImage) return;
  const link = document.createElement('a');
  link.download = 'meme.png';
  link.href = memeCanvas.toDataURL('image/png');
  link.click();
}

async function postMeme() {
  if (!currentImage || !currentUser) {
    showError('Sign in to post memes.');
    return;
  }
  postBtn.setAttribute('disabled', '');
  postBtn.textContent = 'Posting...';
  try {
    const blob = await new Promise<Blob | null>((resolve) => {
      memeCanvas.toBlob((b) => resolve(b), 'image/png');
    });
    if (!blob) throw new Error('Failed to create image');
    const memeId = id();
    const path = `memes/${memeId}.png`;
    const file = new File([blob], 'meme.png', { type: 'image/png' });
    const { data } = await db.storage.uploadFile(path, file, { contentType: 'image/png' });
    if (!data?.id) throw new Error('Upload failed');
    await db.transact(
      db.tx.memes[memeId].update({ createdAt: Date.now() }).link({ image: data.id, creator: currentUser.id })
    );
    hideError();
    switchToView('feed');
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Failed to post meme.');
  } finally {
    postBtn.removeAttribute('disabled');
    postBtn.textContent = 'Post to Feed';
  }
}

uploadZone.addEventListener('click', () => imageInput.click());
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const file = e.dataTransfer?.files[0];
  if (file) loadImage(file);
});
imageInput.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) loadImage(file);
});
changeImageBtn.addEventListener('click', () => {
  showPicker();
  hideError();
});
addTextLayerBtn.addEventListener('click', () => {
  if (!currentImage) return;
  const idx = textLayers.length + 1;
  const layer: TextLayer = {
    id: generateId(),
    name: `Text ${idx}`,
    text: '',
    x: memeCanvas.width / 2,
    y: memeCanvas.height / 2,
  };
  textLayers.push(layer);
  selectedLayerId = layer.id;
  syncLayerEditor();
  renderLayerList();
  drawMeme();
  layerTextInput.focus();
});
deleteTextLayerBtn.addEventListener('click', () => {
  if (!selectedLayerId) return;
  const idx = textLayers.findIndex((l) => l.id === selectedLayerId);
  if (idx === -1) return;
  textLayers.splice(idx, 1);
  selectedLayerId = textLayers[Math.min(idx, textLayers.length - 1)]?.id ?? null;
  syncLayerEditor();
  renderLayerList();
  drawMeme();
});
layerTextInput.addEventListener('input', () => {
  const layer = getSelectedLayer();
  if (!layer) return;
  layer.text = layerTextInput.value;
  renderLayerList();
  drawMeme();
});
fontSizeInput.addEventListener('input', () => {
  fontSizeValue.textContent = `${fontSizeInput.value}px`;
  drawMeme();
});
textColorInput.addEventListener('input', () => {
  textColorValue.textContent = textColorInput.value;
  drawMeme();
});
downloadBtn.addEventListener('click', downloadMeme);
postBtn.addEventListener('click', postMeme);

function switchToView(view: 'create' | 'feed') {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach((t) => {
    t.classList.toggle('active', (t as HTMLElement).dataset.view === view);
  });
  viewCreate.classList.toggle('hidden', view !== 'create');
  viewFeed.classList.toggle('hidden', view !== 'feed');
}

document.querySelectorAll('.nav-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const view = (tab as HTMLElement).dataset.view as 'create' | 'feed';
    switchToView(view);
  });
});

function updateAuthUI(user: { id: string } | null) {
  currentUser = user;
  if (user) {
    authStatus.textContent = 'Signed in as guest';
    authStatus.classList.add('logged-in');
    signInBtn.classList.add('hidden');
    signOutBtn.classList.remove('hidden');
  } else {
    authStatus.textContent = 'Not signed in';
    authStatus.classList.remove('logged-in');
    signInBtn.classList.remove('hidden');
    signOutBtn.classList.add('hidden');
  }
}

signInBtn.addEventListener('click', async () => {
  try {
    await db.auth.signInAsGuest();
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Sign in failed');
  }
});
signOutBtn.addEventListener('click', () => db.auth.signOut());

db.subscribeAuth((auth) => {
  updateAuthUI(auth.user ?? null);
});

type MemeEntity = {
  id: string;
  image?: { url?: string } | { url?: string }[];
  votes?: Array<{ id: string; user?: { id: string } | { id: string }[] }>;
};

function renderFeed(data: { memes?: MemeEntity[] }) {
  const memes = data?.memes ?? [];
  if (memes.length === 0) {
    feedContainer.innerHTML = '<div class="feed-empty">No memes yet. Create one and post it to the feed!</div>';
    return;
  }
  feedContainer.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'feed-grid';
  for (const meme of memes) {
    const card = document.createElement('div');
    card.className = 'feed-card';
    const img = document.createElement('img');
    const imageEntity = Array.isArray(meme.image) ? meme.image[0] : meme.image;
    img.src = imageEntity?.url ?? '';
    img.alt = 'Meme';
    img.loading = 'lazy';
    const footer = document.createElement('div');
    footer.className = 'feed-card-footer';
    const votes = meme.votes ?? [];
    const voteCount = votes.length;
    const getUserFromVote = (v: { user?: { id: string } | { id: string }[] }) => {
      const u = v.user;
      return Array.isArray(u) ? u[0] : u;
    };
    const user = currentUser;
    const userVoted = user && votes.some((v) => getUserFromVote(v)?.id === user.id);
    const voteBtn = document.createElement('button');
    voteBtn.type = 'button';
    voteBtn.className = 'feed-vote-btn' + (userVoted ? ' voted' : '');
    voteBtn.disabled = !currentUser;
    voteBtn.innerHTML = `Upvote <span>${voteCount}</span>`;
    voteBtn.addEventListener('click', async () => {
      const user = currentUser;
      if (!user) return;
      if (userVoted) {
        const voteToDelete = votes.find((v) => getUserFromVote(v)?.id === user.id);
        if (voteToDelete) {
          await db.transact(db.tx.votes[voteToDelete.id].delete());
        }
      } else {
        const voteId = id();
        await db.transact(
          db.tx.votes[voteId].update({ createdAt: Date.now() }).link({ meme: meme.id, user: user.id })
        );
      }
    });
    footer.appendChild(voteBtn);
    card.appendChild(img);
    card.appendChild(footer);
    grid.appendChild(card);
  }
  feedContainer.appendChild(grid);
}

db.subscribeQuery(
  {
    memes: {
      $: { order: { createdAt: 'desc' } },
      image: {},
      votes: { user: {} },
    },
  },
  (resp) => {
    if (resp.error) {
      feedContainer.innerHTML = `<div class="feed-empty">Error: ${resp.error.message}</div>`;
      return;
    }
    if (resp.data) {
      renderFeed(resp.data as { memes?: MemeEntity[] });
    } else {
      feedContainer.innerHTML = '<div class="feed-loading">Loading feed...</div>';
    }
  }
);
