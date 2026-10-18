# ManaVoice AI — Model Evaluation Protocol

**Protocol Version:** 1.0.0  
**Effective Date:** October 18, 2026  
**Scope:** ASR, Machine Translation, Neural TTS, Audio-Driven Lip-Sync, and Full Video Localization Pipeline

---

## 1. Principles & Integrity

1. **Empirical Measurement:** Evaluation scores are computed from actual model inferences compared against reference ground-truth data. Metric fabrication is strictly forbidden.
2. **Data Separation:** Test evaluation sets must never be seen during model training or hyperparameter tuning.
3. **Multi-Faceted Assessment:** Automated metrics (WER, BLEU, chrF) are combined with runtime performance measurements (RTF, latency, memory) and qualitative rubrics.

---

## 2. Component Evaluation Methodologies

### 2.1 Automatic Speech Recognition (ASR)
- **Primary Metric:** Word Error Rate (WER)
  $$\text{WER} = \frac{S + D + I}{N}$$
  *(Substitutions + Deletions + Insertions divided by Reference Words)*
- **Secondary Metric:** Character Error Rate (CER) — critical for phonetic & agglutinative Indian scripts (Hindi, Telugu, Tamil).
- **Benchmark Corpus:** FLEURS Test Split (100 samples per supported language).
- **Acceptance Thresholds:**
  - English (`en`): $\text{WER} \le 12.0\%$
  - High-Resource Languages (`es`, `fr`, `de`): $\text{WER} \le 15.0\%$
  - Indian Languages (`hi`, `te`, `ta`, `kn`, `ml`, `bn`, `mr`): $\text{CER} \le 18.0\%$

### 2.2 Machine Translation (MT)
- **Primary Metric:** sacreBLEU (n-gram precision with brevity penalty).
- **Secondary Metric:** chrF (character n-gram F-score), robust against morphological divergence in Dravidian and Indo-Aryan scripts.
- **Entity & Numeral Preservation:** Verification that names, timestamps, and numbers in the source text appear preserved in the translated segment.
- **Acceptance Thresholds:**
  - $\text{BLEU} \ge 28.0$ (High-resource pairs)
  - $\text{chrF} \ge 45.0$ (Indian language directions)

### 2.3 Text-to-Speech (TTS) & Voice Synthesis
- **Primary Runtime Metric:** Real-Time Factor (RTF):
  $$\text{RTF} = \frac{\text{Synthesis Time (seconds)}}{\text{Generated Audio Duration (seconds)}}$$
  *(Target: $\text{RTF} \le 0.5$ on GPU, $\le 1.2$ on CPU)*
- **Loudness Standards:** EBU R128 compliance with integrated target of $-16.0 \pm 1.0$ LUFS.
- **Signal Quality:** Zero clipping (peak amplitude $\le -0.5$ dBFS).

### 2.4 Lip-Sync & Face Motion
- **Primary Metric:** Synchronization Confidence Score ($S_{\text{sync}}$), measured via cross-correlation between audio energy envelopes and vertical mouth aperture displacement.
- **Face Tracking Continuity:** Percentage of frames with uninterrupted bounding box tracking ($\ge 95\%$ target).
- **Graceful Fallback Compliance:** Whenever no face is detected or lip-sync is disabled, the system MUST emit a documented fallback status rather than falsely claiming success.

---

## 3. Evaluation Execution Command

To run the automated evaluation suite against the reference benchmark dataset:
```powershell
python -m pytest backend/tests/test_evaluation.py -v
```
Or trigger via REST API:
```http
POST /api/v1/evaluations/run
```
