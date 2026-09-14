import cv2
import json
from paddleocr import PaddleOCR
from engines.paddle_service import PaddleOCRService

def test_local_image(image_path):
    print(f"Loading PaddleOCR...")
    ocr = PaddleOCR(use_angle_cls=True, lang='en')

    
    print(f"Reading image: {image_path}")
    img = cv2.imread(image_path)
    
    if img is None:
        print("Error: Could not read image file. Check the file path.")
        return

    print("Executing OCR (this may take a few seconds)...")
    results = ocr.ocr(img, cls=True)
    
    raw_lines = []
    if results and results[0]:
        for line in results[0]:
            text = line[1][0]
            raw_lines.append(text)
            
    print("\n--- RAW TEXT EXTRACTED ---")
    print("\n".join(raw_lines))
    
    print("\n--- STRUCTURED JSON OUTPUT ---")
    json_data = PaddleOCRService.parse_statutory_text(raw_lines)
    print(json.dumps(json_data, indent=2))

if __name__ == "__main__":
    # Ensure you have a photo named biscuit.jpg in the backend folder
    test_local_image("biscuit.jpg")