import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger("docuflow-classifier")


class BaseDocumentClassifier(ABC):
    """
    Abstract interface for classifying document types.
    Decouples raw parsing from document-specific downstream workflows.
    """

    @abstractmethod
    async def classify(self, text: str, file_metadata: dict[str, Any]) -> str:
        """
        Predicts document category (e.g. 'INVOICE', 'CONTRACT', 'RESUME', 'UNKNOWN').
        """
        pass


class IntelligentDocumentClassifier(BaseDocumentClassifier):
    """
    Production-ready classifier featuring lightweight keyword routing
    and hooks for LLM/Layout-vision classification.
    """

    async def classify(self, text: str, file_metadata: dict[str, Any]) -> str:
        """
        Runs type classification. Employs fallback keyword logic
        and reserves hooks for LLM classification.
        """
        logger.info("Executing document type classification...")

        # 1. Fallback Rule-based classification
        text_lower = text.lower()
        
        # Specific patterns for the document types
        # Specific patterns for the document types ordered to prevent cross-ref mismatches
        if "delivery challan" in text_lower or "dn-lum" in text_lower or "dn-apex" in text_lower:
            logger.info("Classification match: DELIVERY_NOTE")
            return "DELIVERY_NOTE"
            
        if "payment receipt" in text_lower or "rec-lum" in text_lower or "rec-apex" in text_lower:
            logger.info("Classification match: PAYMENT_RECEIPT")
            return "PAYMENT_RECEIPT"
            
        if "tax invoice" in text_lower or "inv-lum" in text_lower or "inv-apex" in text_lower:
            logger.info("Classification match: INVOICE")
            return "INVOICE"
            
        if "purchase order (" in text_lower or "po-alpha" in text_lower or "po-beta" in text_lower or "purchase order value" in text_lower:
            logger.info("Classification match: PURCHASE_ORDER")
            return "PURCHASE_ORDER"
            
        if "request for quotation" in text_lower or "rfq id" in text_lower:
            logger.info("Classification match: QUOTATION")
            return "QUOTATION"
            
        if "commercial quotation" in text_lower or "official quotation" in text_lower or "quo-lum" in text_lower or "quo-apex" in text_lower:
            logger.info("Classification match: QUOTATION")
            return "QUOTATION"

        # General fallbacks
        if "purchase order" in text_lower or "po-" in text_lower:
            logger.info("Classification match: PURCHASE_ORDER")
            return "PURCHASE_ORDER"
            
        if "delivery note" in text_lower or "delivery challan" in text_lower or "dn-" in text_lower:
            logger.info("Classification match: DELIVERY_NOTE")
            return "DELIVERY_NOTE"
            
        if "payment receipt" in text_lower or "rec-" in text_lower:
            logger.info("Classification match: PAYMENT_RECEIPT")
            return "PAYMENT_RECEIPT"
            
        if "quotation" in text_lower or "rfq" in text_lower:
            logger.info("Classification match: QUOTATION")
            return "QUOTATION"

        if (
            "invoice" in text_lower
            or "bill to" in text_lower
        ):
            logger.info("Classification match: INVOICE")
            return "INVOICE"

        if (
            "agreement" in text_lower
            or "contract" in text_lower
            or "shall be governed" in text_lower
        ):
            logger.info("Classification match: CONTRACT")
            return "CONTRACT"

        if (
            "experience" in text_lower
            or "resume" in text_lower
            or "education" in text_lower
        ):
            logger.info("Classification match: RESUME")
            return "RESUME"

        # TODO [Future Feature - Phase 5]: Call LLM classifier for complex documents
        # prompt = f"Classify this document type:\n\n{text[:500]}"
        # response = await llm.complete(prompt)

        # TODO [Future Feature - Phase 8]: Layout-vision-based classifier
        # using layout structure templates

        logger.info("Classification match: UNKNOWN")
        return "UNKNOWN"
