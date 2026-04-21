# 🏜️ Oasis Node

An air-gapped, privacy-first local AI ecosystem. Oasis Node integrates a highly customized React dashboard with a FastAPI Python backend, enabling zero-latency local inference of a fine-tuned Qwen 2.5 LLM on consumer hardware.

## 🚀 Key Features
* **100% Offline & Private:** No external API calls. All inference and data storage happen locally on the machine.
* **Persistent AI Memory:** Custom SQLite integration to store, retrieve, and inject conversational history into the LLM context window.
* **Dynamic UI/UX:** High-contrast bespoke UI featuring custom CSS 3D math for an interactive tracking avatar, completely bypassing CDN dependencies.
* **Optimized Inference:** Powered by `Unsloth` for fast 4-bit quantized generation with hard-coded stop tokens to prevent hallucination loops.

## 🛠️ Tech Stack
* **Frontend:** React.js, Tailwind CSS, Lucide Icons.
* **Backend:** FastAPI, Python, SQLite.
* **AI/ML Engine:** Unsloth, Hugging Face Transformers, PyTorch, Qwen 2.5 (1.5B Instruct).

## ⚙️ Local Setup
(Add your quick setup commands here like `npm run dev` and `uvicorn main:app` later)
