# Documentation Index

## � User Documentation

### **[VISUALISER.md](VISUALISER.md)** ⭐ Start here if you're a LedFx user!
**Complete guide to using the visualiser feature**
- What it is and why you'd want it
- How to use it (background, fullscreen, OBS)
- All 9 visualizers explained
- Configuration guide
- URL parameters for advanced setups
- Tips, tricks, and troubleshooting
- Keyboard shortcuts and FAQ

---

## 📖 Developer Reference

Core documentation for understanding and working with the audio visualizer:

### **[ARCHITECTURE.md](ARCHITECTURE.md)**
**Overview of everything** - Start here for the big picture
- Integration context (Audio-visualizer → Frontend → Backend → LedFxCC)
- Complete project structure (7 organized folders)
- 55 visualizers breakdown (3 sources: 10+17+28)
- Zustand store overview (5 slices)
- Key architectural principles

### **[COMMUNICATION.md](COMMUNICATION.md)**
**Frontend ↔ Visualizer communication evolution**
- 5 generations: None → Props → window.api → Zustand subscribe → useVstore
- Each generation documented with problems, solutions, code examples
- Complete comparison table (9 metrics)
- The "a-ha moment" insight 💖

### **[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)**
**How to integrate with LedFx-Frontend**
- react-dynamic-module loading pattern
- Direct store access via useVstore
- Complete API reference (state + actions)
- **URL query parameters** (schema-driven, OBS-friendly)
- Best practices and debugging tips

### **[GENERATORS.md](GENERATORS.md)**
**All 3 auto-generation systems**
- System 1: Schema-first (10 visualizers from Zod schemas)
- System 2: Backend effects (17 from GitHub API)
- System 3: WebGL registry (28 from JSON metadata)
- Build integration and impact statistics
- How to add new visualizers (3 methods)

### **[ZUSTAND_STORE.md](ZUSTAND_STORE.md)**
**Store architecture and usage**
- 5 store slices with complete interfaces
- Usage patterns (basic, optimized, frontend access)
- **Query parameter initialization** (race-condition-free)
- Persistence mechanism (localStorage)
- Migration system (version-based)
- DevTools integration

### **[WEBGL_GENERATION.md](WEBGL_GENERATION.md)**
**WebGL registry generation details**
- webgl-metadata.json as single source of truth
- Adding new WebGL visualizers
- 28 visualizers across 3 categories
- Generated type safety

### **[BACKEND-SCHEMA-GENERATION.md](BACKEND-SCHEMA-GENERATION.md)**
**Backend effect schema generation**
- Fetching from LedFx GitHub repository
- Voluptuous → TypeScript conversion
- 17 effects auto-generated
- Fallback strategy for offline builds

---

## 📦 Archived Milestones

Historical documentation in [_/](_) folder:

- **REFACTORING_MILESTONE_1.md** - Initial POC refactoring
- **REFACTORING_MILESTONE_2.md** - Complete architecture overhaul  
- **FRONTEND_INTEGRATION_1.md** - Original integration docs
- **ZUSTAND_STORE_1.md** - Old store documentation (superseded)

---

## 🗺️ Navigation

**Are you a LedFx user?**  
Start with [VISUALISER.md](VISUALISER.md) - it's made for you! 🎨

**New to the project as a developer?**  
Start with [ARCHITECTURE.md](ARCHITECTURE.md) for the full picture.

**Integrating with frontend?**  
See [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) for complete guide.

**Understanding communication?**  
Check [COMMUNICATION.md](COMMUNICATION.md) for the evolution story.

**Adding visualizers?**  
Read [GENERATORS.md](GENERATORS.md) for all 3 methods.

**Working with store?**  
Browse [ZUSTAND_STORE.md](ZUSTAND_STORE.md) for patterns.

---

## 📊 Quick Stats

- **55 Visualizers** (10 schema-first + 17 backend + 28 WebGL)
- **5 Store Slices** (visualizer, UI, post-processing, configs, shader editor)
- **5 Communication Generations** (culminating in useVstore pattern)
- **3 Auto-Generation Systems** (eliminating 1,072+ manual lines)
- **Zero Manual Duplication** (everything from single sources of truth)
