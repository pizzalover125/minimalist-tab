// Handle sticky notes functionality
let stickyNotes = [];
let noteIdCounter = 0;

function createStickyNote(text, color = 'yellow') {
  const noteId = `note-${++noteIdCounter}`;
  const note = {
    id: noteId,
    text: text,
    color: color,
    x: Math.random() * (window.innerWidth - 200) + 50,
    y: Math.random() * (window.innerHeight - 200) + 50,
    width: 200,
    height: 150,
    zIndex: stickyNotes.length + 1000
  };
  
  stickyNotes.push(note);
  saveStickyNotes();
  renderStickyNote(note);
  
  playBeep(600, 100, 0.3);
}

function makeNoteResizable(noteElement) {
  const resizeHandle = noteElement.querySelector('.note-resize-handle');
  let isResizing = false;
  let startX, startY, startWidth, startHeight;
  let animationFrame;
  
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(noteElement.style.width);
    startHeight = parseInt(noteElement.style.height);
    
    noteElement.style.cursor = 'nw-resize';
    e.preventDefault();
  });
  
  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    
    animationFrame = requestAnimationFrame(() => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newWidth = Math.max(150, startWidth + deltaX);
      const newHeight = Math.max(100, startHeight + deltaY);
      
      noteElement.style.width = newWidth + 'px';
      noteElement.style.height = newHeight + 'px';
    });
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      noteElement.style.cursor = 'grab';
      
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      const noteId = noteElement.id;
      const note = stickyNotes.find(n => n.id === noteId);
      if (note) {
        note.width = parseInt(noteElement.style.width);
        note.height = parseInt(noteElement.style.height);
        saveStickyNotes();
      }
    }
  });
}

function renderStickyNote(note) {
  const noteElement = document.createElement('div');
  noteElement.className = `sticky-note note-${note.color}`;
  noteElement.id = note.id;
  noteElement.style.left = note.x + 'px';
  noteElement.style.top = note.y + 'px';
  noteElement.style.width = note.width + 'px';
  noteElement.style.height = note.height + 'px';
  noteElement.style.zIndex = note.zIndex;
  
  noteElement.innerHTML = `
    <div class="note-header">
      <span class="note-drag-handle">⋮⋮</span>
      <button class="note-close" data-note-id="${note.id}">×</button>
    </div>
    <div class="note-content" contenteditable="true" data-note-id="${note.id}">${note.text}</div>
    <div class="note-resize-handle"></div>
  `;
  
  document.body.appendChild(noteElement);
  
  makeNoteDraggable(noteElement);
  makeNoteResizable(noteElement);

  const closeButton = noteElement.querySelector('.note-close');
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteStickyNote(note.id);
  });
  
  const contentElement = noteElement.querySelector('.note-content');
  contentElement.addEventListener('blur', () => {
    // Always save on blur, bypass throttling
    const note = stickyNotes.find(n => n.id === note.id);
    if (note) {
      note.text = getNoteTextWithLineBreaks(contentElement);
      saveStickyNotes();
    }
  });
  
  let autoSaveInterval = setInterval(() => {
    if (document.activeElement === contentElement) {
      updateStickyNote(note.id, getNoteTextWithLineBreaks(contentElement));
    }
  }, 1000);
  
  noteElement.autoSaveInterval = autoSaveInterval;
  
  contentElement.focus();
  
  if (note.text && note.text.trim() !== '') {
    return;
  } else {
    const range = document.createRange();
    range.selectNodeContents(contentElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function makeNoteDraggable(noteElement) {
  const header = noteElement.querySelector('.note-header');
  let isDragging = false;
  let startX, startY, initialX, initialY;
  
  header.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('note-close')) return;
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = noteElement.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
    
    noteElement.style.cursor = 'grabbing';
    noteElement.style.userSelect = 'none';
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    const newX = initialX + deltaX;
    const newY = initialY + deltaY;
    
    const maxX = window.innerWidth - noteElement.offsetWidth;
    const maxY = window.innerHeight - noteElement.offsetHeight;
    
    noteElement.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
    noteElement.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      noteElement.style.cursor = 'grab';
      noteElement.style.userSelect = '';
      
      const noteId = noteElement.id;
      const note = stickyNotes.find(n => n.id === noteId);
      if (note) {
        note.x = parseInt(noteElement.style.left);
        note.y = parseInt(noteElement.style.top);
        saveStickyNotes();
      }
    }
  });
}

function getNoteTextWithLineBreaks(element) {
  return element.textContent || element.innerText || '';
}

let lastSaveTime = 0;
const SAVE_THROTTLE_MS = 2000; 

function updateStickyNote(noteId, newText) {
  const note = stickyNotes.find(n => n.id === noteId);
  if (note) {
    note.text = newText;
    
    const now = Date.now();
    if (now - lastSaveTime > SAVE_THROTTLE_MS) {
      saveStickyNotes();
      lastSaveTime = now;
    }
  }
}

function deleteStickyNote(noteId) {
  const noteElement = document.getElementById(noteId);
  if (noteElement) {
    if (noteElement.autoSaveInterval) {
      clearInterval(noteElement.autoSaveInterval);
    }
    noteElement.remove();
  }
  
  stickyNotes = stickyNotes.filter(n => n.id !== noteId);
  saveStickyNotes();
  
  playBeep(400, 100, 0.2);
}

function saveStickyNotes() {
  saveSetting('stickyNotes', stickyNotes);
}

function loadStickyNotes() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['stickyNotes'], (result) => {
      stickyNotes = result.stickyNotes || [];
      if (stickyNotes.length > 0) {
        noteIdCounter = Math.max(...stickyNotes.map(n => parseInt(n.id.split('-')[1]) || 0));
      }
      resolve();
    });
  });
}

function renderAllStickyNotes() {
  stickyNotes.forEach(note => {
    renderStickyNote(note);
  });
}

window.addEventListener('beforeunload', () => {
  stickyNotes.forEach(note => {
    const noteElement = document.getElementById(note.id);
    if (noteElement && noteElement.autoSaveInterval) {
      clearInterval(noteElement.autoSaveInterval);
    }
  });
});