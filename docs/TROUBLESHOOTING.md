# ManaVoice AI — Operational Troubleshooting & Diagnostics Guide

This document catalogs known runtime issues, environmental quirks, and verified resolution protocols encountered during development, local testing, and production deployment of ManaVoice AI.

---

## 1. Windows AppLocker / WDAC Security Policies (`_arpack.pyd` DLL Block)

### Symptom:
```text
ImportError: DLL load failed while importing _arpack: Access is denied.
PermissionError: [WinError 5] Access is denied: '...\site-packages\scipy\sparse\linalg\_eigen\arpack\_arpack.cp314-win_amd64.pyd'
```

### Root Cause:
Enterprise or educational Windows installations frequently enforce Windows Defender Application Control (WDAC) or AppLocker policies that prevent Python from dynamically loading non-whitelisted C++ DLLs in the user profile directory. When `transformers` imports optional evaluation utilities that touch `sklearn.metrics`, SciPy triggers this block.

### Resolution:
ManaVoice AI implements an early-import virtual module stub in `app/core/bypass.py`:
```python
import sys, types, importlib.machinery

if "sklearn" not in sys.modules:
    m = types.ModuleType("sklearn")
    m.__spec__ = importlib.machinery.ModuleSpec("sklearn", None)
    sys.modules["sklearn"] = m
    mm = types.ModuleType("sklearn.metrics")
    mm.__spec__ = importlib.machinery.ModuleSpec("sklearn.metrics", None)
    mm.roc_curve = lambda *a, **k: None
    sys.modules["sklearn.metrics"] = mm
```
This satisfies the optional `transformers` check without loading unapproved third-party native DLLs.

---

## 2. OpenBLAS Memory Allocation Errors on Windows

### Symptom:
```text
OpenBLAS error: Memory allocation still failed after 10 retries
BLAS : Program is Terminated. Because you tried to allocate too many memory regions.
```

### Root Cause:
NumPy and SciPy packages compiled with OpenBLAS attempt to spawn an independent thread pool for each worker thread under high concurrency. On Windows systems with tight virtual memory commit limits, this causes memory fragmentation.

### Resolution:
Set the thread limit to 1 before launching any Python process:

```powershell
$env:OPENBLAS_NUM_THREADS="1"
```
In Linux / Docker:
```bash
export OPENBLAS_NUM_THREADS=1
```
This is also programmatically enforced in `app/core/bypass.py` and `app/core/config.py`.

---

## 3. System Drive (C:) Out of Disk Space

### Symptom:
```text
OSError: [Errno 28] No space left on device
DiskSpaceExhaustedError: Drive C: free space (298 MB) is below safe minimum (2000 MB).
```

### Root Cause:
Video processing, dataset ingestion, and neural model caching generate large binary artifacts that can quickly fill a small OS system drive.

### Resolution:
ManaVoice AI automatically diverts all media storage, dataset downloads, model checkpoints, and temporary frame scratch spaces to high-capacity secondary drives (e.g., `D:/ManaVoice_Data/`).
Check your active path in `backend/.env`:
```env
STORAGE_DIR=D:/ManaVoice_Data
```
If using a different mount point on Linux, point `STORAGE_DIR` to a partition with at least 50GB of free space.

---

## 4. PyTorch Half-Precision (FP16) CPU Errors

### Symptom:
```text
RuntimeError: "slow_conv2d_cpu" not implemented for 'Half'
```

### Root Cause:
Pretrained Hugging Face checkpoints (such as Whisper Turbo) may load weights in `torch.float16` by default. When executing on CPU, PyTorch convolution kernels do not support FP16 operations.

### Resolution:
In `app/services/asr_service.py`, device checking guarantees that CPU inference explicitly casts models and tensors to `torch.float32`:
```python
if self.device.type == "cpu":
    self._model = self._model.float()
```

---

## 5. VITS Tokenizer Crashes on Silence / Punctuation-Only Text

### Symptom:
```text
RuntimeError: start (0) + length (0) exceeds dimension size (0)
IndexError: Dimension out of range (expected to be in range of [-1, 0], but got 1)
```

### Root Cause:
When an ASR segment contains purely punctuation (e.g., `"..."` or `","` during an acoustic pause), the VITS tokenizer removes all tokens, creating an empty input tensor ($0 \times 0$) that crashes the neural vocoder.

### Resolution:
In `app/services/tts_service.py`, `generate_speech` verifies alphanumeric content before tokenization:
```python
if not any(c.isalnum() for c in (text or "").strip()):
    # Return 0.5s of clean synthetic silence WAV bytes directly
    return storage_key, 0.5, 16000, file_size
```

---

## 6. FFmpeg / FFprobe PATH Resolution

### Symptom:
```text
FileNotFoundError: [WinError 2] The system cannot find the file specified: 'ffprobe'
```

### Resolution:
Verify FFmpeg installation and verify both `ffmpeg` and `ffprobe` respond in the active terminal:
```powershell
ffmpeg -version
ffprobe -version
```
If not found, download the official release from `gyan.dev` (Windows) or install via package manager:
```bash
sudo apt-get install ffmpeg
```
Add the `bin/` directory containing `ffmpeg.exe` and `ffprobe.exe` to your system environment variables.
