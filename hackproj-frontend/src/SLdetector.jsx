import { useRef, useEffect, useState } from "react";
import * as cam from "@mediapipe/camera_utils";
import * as Hands from "@mediapipe/hands";
import * as drawingUtils from "@mediapipe/drawing_utils";

export default function SLdetector({ onDetect }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gesture, setGesture] = useState("");

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");

    const hands = new Hands.Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          drawingUtils.drawConnectors(canvasCtx, landmarks, Hands.HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 3,
          });
          drawingUtils.drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
        }

        // TODO: Replace this simple logic with real gesture classification
        const x = results.multiHandLandmarks[0][8].x; // Index finger tip
        const y = results.multiHandLandmarks[0][8].y;

        // Example: if hand is near top-left corner, assume "Hello"
        if (x < 0.4 && y < 0.4) {
          setGesture("Hello");
          onDetect && onDetect("Hello");
        } else {
          setGesture("");
        }
      }
      canvasCtx.restore();
    });

    const camera = new cam.Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      camera.stop();
      hands.close();
    };
  }, [onDetect]);

  return (
    <div style={{ position: "relative", width: 640, height: 480 }}>
      <video ref={videoRef} style={{ display: "none" }}></video>
      <canvas ref={canvasRef} width={640} height={480} />
      <div style={{
        position: "absolute", top: 10, left: 10,
        backgroundColor: "rgba(0,0,0,0.6)", color: "white", padding: "5px 10px", borderRadius: "8px"
      }}>
        {gesture ? `🖐️ Detected: ${gesture}` : "Detecting..."}
      </div>
    </div>
  );
}