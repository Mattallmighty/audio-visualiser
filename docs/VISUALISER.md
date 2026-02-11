# 🎨 Audio Visualiser

> **New Feature!** Real-time audio visualization right in your LedFx interface.

---

## What is this?

The **Audio Visualiser** adds beautiful, music-reactive visuals to your LedFx experience. Watch your audio come to life with stunning effects that respond in real-time to your music, microphone, or system audio.

Think of it as a light show for your screen - the same way LedFx controls your LED strips, the visualiser creates mesmerizing on-screen effects synchronized to your audio.

---

## Why would I want this?

### 🎭 **Live Performance**
Perfect for DJs and performers who want visual feedback while mixing. See exactly what your audience's LEDs are experiencing.

### 📹 **Streaming & Recording**
Add professional-looking visualizations to your streams, videos, or presentations. Works seamlessly with OBS and other capture software.

### 🎵 **Music Enjoyment**
Turn your monitor into a dynamic light show. Great for parties, relaxation, or just enjoying music with enhanced visuals.

### 🛠️ **Effect Design**
Preview how different audio patterns affect visual elements before applying them to your LED setup.

---

## How do I use it?

### **Option 1: Background Mode** (Default)
The visualiser appears subtly behind your LedFx interface as you work:

1. Open LedFx
2. Look for the **Visualiser** tile in your interface
3. Click to enable/configure
4. Continue using LedFx normally - the visuals animate behind your UI

Perfect for: Everyday use, keeping an eye on audio while configuring effects.

---

### **Option 2: Fullscreen Display**
Dedicate your screen (or a second monitor) to the visualiser:

1. Click the **fullscreen icon** in the visualiser controls
2. Browser enters fullscreen mode
3. Press `F11` or `Esc` to exit

Perfect for: Parties, performances, projecting on a wall.

---

### **Option 3: OBS Browser Source**
Capture the visualiser in your stream/recording:

1. In OBS, add a **Browser Source**
2. URL: `http://localhost:3000/#/visualiser?display=true&visual=butterchurn`
3. Set resolution (e.g., 1920×1080)
4. Done! The visualiser appears in your scene

Perfect for: Live streams, YouTube videos, presentations.

#### Advanced OBS Setup
Customize the visual and settings via URL parameters:

```
http://localhost:3000/#/visualiser?display=true&visual=butterchurn&currentPresetIndex=42&cycleInterval=30&blendTime=3
```

**What this does:**
- `display=true` - Hides UI controls (clean fullscreen)
- `visual=butterchurn` - Loads Butterchurn visualizer (Milkdrop presets)
- `currentPresetIndex=42` - Starts with preset #43
- `cycleInterval=30` - Changes preset every 30 seconds
- `blendTime=3` - Smooth 3-second transitions between presets

You can also add `&controls=false` to hide preset info overlays for the cleanest possible display.

See **Configuration** section below for all available parameters.

---

## Available Visualizers

Choose from multiple visualization styles:

### 🌈 **Butterchurn** (Milkdrop)
The classic Winamp/Milkdrop experience with 395 presets:
- Swirling patterns, geometric shapes, psychedelic effects
- Preset cycling with smooth transitions
- Shuffle mode for variety
- **Most popular choice!**

### 🌊 **Fluid Simulation**
Realistic fluid dynamics:
- Smoke-like trails following audio
- Adjustable density and dissipation
- Mesmerizing organic motion

### 🌌 **Astrofox**
Space-themed visuals:
- Starfields and nebulae
- Particle effects synchronized to bass
- Perfect for ambient/electronic music

### 🌅 **Aurora Borealis**
Northern lights effect:
- Flowing ribbons of color
- Responds to audio frequencies
- Calming and beautiful

### 💠 **Frequency Rings**
Modern geometric design:
- Concentric rings representing frequency bands
- Bass (red), mids (green), treble (blue)
- Clean and minimal aesthetic

### 🔷 **Hex Grid**
Futuristic hexagon grid:
- Audio-reactive scaling and color
- Sci-fi interface vibe
- Great for electronic/techno music

### 🌀 **Spiral Galaxy**
Rotating spiral patterns:
- Multiple arms responding to audio
- Color gradients based on frequency
- Hypnotic rotation

### ⛰️ **Wave Mountain**
3D terrain visualization:
- Mountain peaks moving with audio
- First-person perspective
- Immersive depth effect

### 🏔️ **Neon Terrain**
Retro 80s wireframe landscape:
- Outrun/synthwave aesthetic
- Neon colors (pink, cyan, purple)
- Perfect for synthwave/retrowave music

---

## Configuration

### Basic Settings

**Visual Type**
Choose your visualizer (Butterchurn, Fluid, Astrofox, etc.)

**Audio Source**
- Microphone
- System audio (loopback)
- File upload

**Volume/Sensitivity**
Adjust how strongly audio affects the visuals

---

### Butterchurn Settings

**Preset Selection**
- **Manual**: Choose specific presets by name or number (1-395)
- **Cycle**: Auto-rotate through presets
- **Shuffle**: Randomize preset order

**Cycle Interval**
How long each preset displays (10-120 seconds)

**Blend Time**
Transition duration between presets (0-10 seconds)

**Favorites**
Mark presets you love for easy access

---

### Advanced Settings

**Show Overlays**
Display preset info, FPS counter, audio stats on screen

**Post-Processing Effects**
- Bloom (glow effect)
- Vignette (darkened corners)
- Noise (film grain)

**Performance**
- Resolution scaling (reduce for better FPS)
- Target framerate (30/60 FPS)

---

## URL Parameters (Advanced)

Customize the visualiser via URL for OBS, bookmarks, or shortcuts:

### Core Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `visual` | string | `butterchurn` | Visualizer type |
| `display` | boolean | `true` | Hide controls (OBS mode) |
| `controls` | boolean | `false` | Show/hide UI overlays (alias: `showControls`) |

### Butterchurn Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `currentPresetIndex` | number | `42` | Load preset #43 (0-based) |
| `currentPresetName` | string | `flexi - spiral` | Load by name |
| `cycleInterval` | number | `30` | Seconds per preset |
| `blendTime` | number | `3` | Transition duration |
| `shufflePresets` | boolean | `true` | Randomize order |

### Other Visualizer Parameters

Each visualizer has unique settings (see UI for available options):
- `fluidDensity=0.98`
- `astrofoxParticleCount=1000`
- `auroraIntensity=0.8`

### Example URLs

**OBS: Butterchurn with preset #100, 45-second cycles**
```
http://localhost:3000/#/visualiser?display=true&visual=butterchurn&currentPresetIndex=99&cycleInterval=45&blendTime=5
```

**OBS: Butterchurn, ultra clean (no UI, no overlays)**
```
http://localhost:3000/#/visualiser?display=true&controls=false&visual=butterchurn&currentPresetIndex=42
```

**OBS: Fluid simulation, high density**
```
http://localhost:3000/#/visualiser?display=true&visual=fluid&fluidDensity=0.99
```

**Bookmark: Favorite preset in background mode**
```
http://localhost:3000/#/visualiser?visual=butterchurn&currentPresetIndex=42
```

---

## Tips & Tricks

### 💡 **Performance**
- Lower resolution scaling if visuals lag
- Close unnecessary browser tabs
- Use hardware acceleration (check browser settings)
- 30 FPS is often sufficient and saves CPU/GPU

### 🎨 **Preset Hunting**
- Enable shuffle mode and let presets cycle
- When you see one you love, note the number/name
- Create a list of your top 20 presets
- Use URL parameters to jump directly to favorites

### 🖥️ **Multi-Monitor Setup**
- Open LedFx on your main monitor
- Open visualiser URL in a new window on second monitor
- Press F11 for fullscreen on the second monitor
- Edit effects on main monitor while watching on second

### 📹 **OBS Scene Ideas**
- Full-screen visualiser as background layer
- LedFx UI on top with chroma key (green screen)
- Split screen: Half visualiser, half webcam
- Picture-in-picture: Small visualiser in corner

### 🔊 **Audio Sync**
If visuals lag behind audio:
1. Check browser audio/video sync settings
2. Reduce visual quality/resolution
3. Close other apps using audio
4. Restart LedFx and your browser

---

## Troubleshooting

### **Visualiser not showing?**
- Check if audio source is selected and active
- Verify microphone permissions in browser
- Try refreshing the page
- Check browser console for errors (F12)

### **Low FPS / Laggy**
- Reduce resolution scaling in settings
- Lower target FPS to 30
- Disable post-processing effects
- Close other GPU-intensive applications
- Update graphics drivers

### **OBS capture is black**
- Make sure URL includes `display=true` parameter
- Check OBS browser source size matches your resolution
- Try toggling "Shutdown source when not visible" OFF
- Refresh the browser source (right-click → Refresh)

### **Audio not reactive**
- Verify audio source is playing
- Increase sensitivity/volume slider
- Check system audio mixer (ensure not muted)
- For loopback: Ensure loopback device is configured

### **Presets won't change**
- Verify cycle interval isn't too long (30s is good)
- Check if shuffle is enabled (may seem random)
- Try manually advancing with preset controls
- Refresh page and reselect Butterchurn

### **URL parameters not working**
- Ensure parameters come after `?` in the URL
- Use `&` to separate multiple parameters
- Check spelling (case-sensitive: `visual=butterchurn`)
- For integrated mode: Parameters go after `#/visualiser?`

---

## Keyboard Shortcuts

While visualiser is active:

| Key | Action |
|-----|--------|
| **Space** | Play / Pause |
| **N** | Next preset (Butterchurn) |
| **P** | Previous preset (Butterchurn) |
| **R** | Random preset (Butterchurn) |
| **H** | Toggle overlays |
| **F11** | Fullscreen (browser default) |
| **Esc** | Exit fullscreen |

---

## Frequently Asked Questions

### **Does this affect my LED strips?**
No! The visualiser is purely on-screen. Your LED effects run independently. Think of it as a visual preview that shares the same audio source.

### **Can I use it without LEDs?**
Absolutely! You don't need any LED hardware. The visualiser works standalone as a pure audio visualization tool.

### **Will this slow down LedFx?**
Minimal impact. The visualiser runs in your browser, separate from the LedFx backend. If you notice performance issues, use background mode or reduce visual quality.

### **Can I create my own presets?**
Butterchurn presets: Not yet, but 395 presets are available!
Other visualizers: Configuration options available in the UI.

### **Does it work offline?**
Yes! Everything runs locally. No internet required after initial load.

### **Can I use multiple visualisers at once?**
Not simultaneously, but you can open multiple browser windows with different visualizers and switch between them.

### **How do I save my favorite setup?**
Bookmark the URL with your preferred parameters. Example:
```
http://localhost:3000/#/visualiser?visual=butterchurn&currentPresetIndex=42&cycleInterval=30
```

---

## What's Next?

🎉 **Have fun!** Explore different visualizers, find your favorite presets, and enjoy your music in a whole new way.

💡 **Share your setups!** Found an amazing preset or configuration? Share the URL with the community.

🐛 **Report issues:** If something doesn't work, let us know! We're constantly improving the experience.

---

*Made with ❤️ for the LedFx community*
