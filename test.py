import cv2
import numpy as np
import mediapipe as mp
from datetime import datetime

# Initialize Mediapipe Selfie Segmentation

mp_selfie_segmentation = mp.solutions.selfie_segmentation
segmentation = mp_selfie_segmentation.SelfieSegmentation(model_selection=1)

# Load background image
bg = cv2.imread("background.jpg")  # replace with your background
bg = cv2.resize(bg, (640, 480))   # resize to desired window size

# Start webcam
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Flip the frame (mirror)
    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Get segmentation mask
    results = segmentation.process(rgb_frame)
    mask = results.segmentation_mask
    mask = (mask > 0.5).astype(np.uint8)

    # Create foreground (humans/objects)
    fg = cv2.bitwise_and(frame, frame, mask=mask)

    # Create background
    mask_inv = cv2.bitwise_not(mask)
    bg_part = cv2.bitwise_and(bg, bg, mask=mask_inv)

    # Combine foreground and background
    combined = cv2.add(fg, bg_part)

    # Add clock
    now = datetime.now().strftime("%H:%M:%S")
    # Custom location, e.g., top-left
    cv2.putText(combined, now, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 
                1.2, (0, 255, 255), 2, cv2.LINE_AA)

    # Show result
    cv2.imshow("Live Overlay", combined)

    # Exit on 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
