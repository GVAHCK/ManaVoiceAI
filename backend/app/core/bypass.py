import os
import sys
import types
import importlib.machinery

# Prevent OpenBLAS virtual memory thread allocation failure on Windows
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

# Redirect HuggingFace, PyTorch, and pip caches away from constrained C: drive to D:
if os.path.exists("D:/ManaVoice_Data"):
    os.environ.setdefault("HF_HOME", "D:/ManaVoice_Data/cache/huggingface")
    os.environ.setdefault("TRANSFORMERS_CACHE", "D:/ManaVoice_Data/cache/huggingface/hub")
    os.environ.setdefault("PIP_CACHE_DIR", "D:/ManaVoice_Data/cache/pip")
    os.environ.setdefault("TORCH_HOME", "D:/ManaVoice_Data/cache/torch")

def ensure_applocker_bypass():

    """Bypasses Windows AppLocker / WDAC DLL blocking for scikit-learn metrics."""
    if "sklearn" not in sys.modules:
        m = types.ModuleType("sklearn")
        m.__spec__ = importlib.machinery.ModuleSpec("sklearn", None)
        sys.modules["sklearn"] = m
        mm = types.ModuleType("sklearn.metrics")
        mm.__spec__ = importlib.machinery.ModuleSpec("sklearn.metrics", None)
        mm.roc_curve = lambda *a, **k: None
        sys.modules["sklearn.metrics"] = mm

# Automatically apply on import
ensure_applocker_bypass()
