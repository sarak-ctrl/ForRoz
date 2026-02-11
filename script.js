const handle = document.getElementById('handle');
const audio = document.getElementById('audio');
const status = document.getElementById('status');
const timer = document.getElementById('timer');
const polaroid = document.getElementById('polaroid');
const waveformCanvas = document.getElementById('waveform');
const ctx = waveformCanvas.getContext('2d');

let isDragging = false;
let lastAngle = 0;
let currentRotation = 0;
let lastRotationTime = Date.now();
let rotationSpeed = 0;
let playbackRate = 1.0;
let animationFrame;

// Set canvas size
waveformCanvas.width = waveformCanvas.offsetWidth;
waveformCanvas.height = waveformCanvas.offsetHeight;

// Calculate angle from center
function getAngle(centerX, centerY, pointX, pointY) {
    const dx = pointX - centerX;
    const dy = pointY - centerY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
}

// Get center of handle
function getHandleCenter() {
    const rect = handle.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

// Format time
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update timer display
function updateTimer() {
    if (audio.duration) {
        timer.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
}

// Draw waveform visualization
function drawWaveform() {
    ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    
    if (!audio.duration) return;
    
    const progress = audio.currentTime / audio.duration;
    const barCount = 50;
    const barWidth = waveformCanvas.width / barCount;
    const centerY = waveformCanvas.height / 2;
    
    ctx.fillStyle = '#FF1493';
    
    for (let i = 0; i < barCount; i++) {
        const x = i * barWidth;
        const height = Math.random() * (waveformCanvas.height * 0.4) + 10;
        const opacity = i / barCount < progress ? 1 : 0.2;
        
        ctx.globalAlpha = opacity;
        ctx.fillRect(x, centerY - height / 2, barWidth - 2, height);
    }
    
    ctx.globalAlpha = 1;
}

// Update rotation speed and audio playback
function updatePlayback() {
    const now = Date.now();
    const timeDelta = (now - lastRotationTime) / 1000;
    
    // Decay speed if not rotating
    if (timeDelta > 0.1) {
        rotationSpeed *= 0.9; // Decay factor
        
        if (Math.abs(rotationSpeed) < 0.5) {
            rotationSpeed = 0;
            audio.pause();
            if (polaroid) polaroid.classList.remove('playing');
            status.textContent = 'Keep winding to play!';
        }
    }
    
    // Update playback rate based on rotation speed
    if (rotationSpeed > 0) {
        playbackRate = Math.min(Math.max(rotationSpeed / 5, 0.5), 2);
        audio.playbackRate = playbackRate;
        
        if (audio.paused) {
            audio.play().catch(() => {});
        }
        
        if (polaroid) polaroid.classList.add('playing');
        status.textContent = rotationSpeed > 8 ? '🔥 Winding fast!' : '♪ Playing...';
    }
    
    drawWaveform();
    updateTimer();
    animationFrame = requestAnimationFrame(updatePlayback);
}

// Mouse/Touch down
function startDragging(e) {
    isDragging = true;
    handle.classList.add('grabbing');
    
    const center = getHandleCenter();
    const point = e.touches ? e.touches[0] : e;
    lastAngle = getAngle(center.x, center.y, point.clientX, point.clientY);
    
    e.preventDefault();
}

// Mouse/Touch move
function onDrag(e) {
    if (!isDragging) return;
    
    const center = getHandleCenter();
    const point = e.touches ? e.touches[0] : e;
    const currentAngle = getAngle(center.x, center.y, point.clientX, point.clientY);
    
    // Calculate angular change
    let angleDelta = currentAngle - lastAngle;
    
    // Handle angle wrap-around
    if (angleDelta > 180) angleDelta -= 360;
    if (angleDelta < -180) angleDelta += 360;
    
    // Update rotation
    currentRotation += angleDelta;
    handle.style.transform = `rotate(${currentRotation}deg)`;
    
    // Calculate speed (degrees per second)
    const now = Date.now();
    const timeDelta = (now - lastRotationTime) / 1000;
    rotationSpeed = Math.abs(angleDelta) / Math.max(timeDelta, 0.016);
    
    lastAngle = currentAngle;
    lastRotationTime = now;
    
    e.preventDefault();
}

// Mouse/Touch up
function stopDragging() {
    if (isDragging) {
        isDragging = false;
        handle.classList.remove('grabbing');
    }
}

// Event listeners - Mouse
handle.addEventListener('mousedown', startDragging);
document.addEventListener('mousemove', onDrag);
document.addEventListener('mouseup', stopDragging);

// Event listeners - Touch (for mobile)
handle.addEventListener('touchstart', startDragging);
document.addEventListener('touchmove', onDrag);
document.addEventListener('touchend', stopDragging);

// Audio ended
audio.addEventListener('ended', () => {
    if (polaroid) polaroid.classList.remove('playing');
    status.textContent = 'Finished! Wind again to replay';
});

// Start animation loop
updatePlayback();

// Initial draw
drawWaveform();