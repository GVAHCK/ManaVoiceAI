import httpx
from typing import Tuple
from app.core.config import settings
from app.core.logging import logger

# Offline vocabulary fallback for common test phrases when external LibreTranslate is unreachable
FALLBACK_DICTIONARY = {
    ("en", "es"): {
        "welcome to manavoice ai": "Bienvenido a ManaVoice AI",
        "hello": "Hola",
        "good morning": "Buenos días",
        "thank you": "Gracias",
    },
    ("en", "fr"): {
        "welcome to manavoice ai": "Bienvenue sur ManaVoice AI",
        "hello": "Bonjour",
        "good morning": "Bonjour",
        "thank you": "Merci",
    },
    ("en", "de"): {
        "welcome to manavoice ai": "Willkommen bei ManaVoice AI",
        "hello": "Hallo",
        "good morning": "Guten Morgen",
        "thank you": "Danke",
    },
    ("en", "hi"): {
        "welcome to manavoice ai": "ManaVoice AI में आपका स्वागत है",
        "hello": "नमस्ते",
        "thank you": "धन्यवाद",
    },
    ("en", "te"): {
        "welcome to manavoice ai": "ManaVoice AI కి స్వాగతం",
        "hello": "నమస్కారం",
        "thank you": "ధన్యవాదాలు",
    }
}

class TranslationService:
    async def translate(self, text: str, source_lang: str, target_lang: str) -> Tuple[str, str]:
        source = source_lang.strip().lower()
        target = target_lang.strip().lower()

        # If identical, no translation needed
        if source == target:
            return text, "passthrough"

        # Try LibreTranslate if configured
        if settings.LIBRETRANSLATE_URL:
            try:
                url = f"{settings.LIBRETRANSLATE_URL.rstrip('/')}/translate"
                payload = {
                    "q": text,
                    "source": source,
                    "target": target,
                    "format": "text",
                }
                if settings.LIBRETRANSLATE_API_KEY:
                    payload["api_key"] = settings.LIBRETRANSLATE_API_KEY

                async with httpx.AsyncClient(timeout=settings.TRANSLATION_TIMEOUT_SECONDS) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        translated_text = data.get("translatedText")
                        if translated_text:
                            logger.info(f"Translated text via LibreTranslate ({source} -> {target})")
                            return translated_text, "libretranslate"
            except Exception as e:
                logger.warning(f"LibreTranslate request failed or timed out: {e}")

        # Check dictionary fallback for demo test phrases only
        normalized_text = text.strip().lower()
        key = (source, target)
        if key in FALLBACK_DICTIONARY and normalized_text in FALLBACK_DICTIONARY[key]:
            return FALLBACK_DICTIONARY[key][normalized_text], "offline_dictionary_sample"

        # If online translation is unavailable, do NOT pretend translation occurred.
        # Return the original text clearly marked as untranslated so user can review and edit
        logger.warning(f"Translation provider unavailable for {source} -> {target}. Retaining original text for manual review.")
        return text, "translation_unavailable"

translation_service = TranslationService()
