/*
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
  */


 
//FULL HEURISTIC MODEL FOR (hello, goodbye, yes, no, thank you, i'm sorry, How are you)

import { useRef, useEffect, useState } from "react";
import * as cam from "@mediapipe/camera_utils";
import * as Hands from "@mediapipe/hands";
import * as drawingUtils from "@mediapipe/drawing_utils";

// Helper: distance between two points
const distance = (a, b) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);

// Helper: average Y of finger tips (used to detect open/closed hand)
const avgY = (landmarks, ids) =>
  ids.reduce((sum, id) => sum + landmarks[id].y, 0) / ids.length;

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
            lineWidth: 2,
          });
          drawingUtils.drawLandmarks(canvasCtx, landmarks, {
            color: "#FF0000",
            lineWidth: 1,
          });
        }

        const lm = results.multiHandLandmarks[0];

        // Basic metrics
        const thumbTip = lm[4];
        const indexTip = lm[8];
        const middleTip = lm[12];
        const ringTip = lm[16];
        const pinkyTip = lm[20];
        const palmBase = lm[0];

        const openPalm =
          avgY(lm, [8, 12, 16, 20]) < palmBase.y - 0.05; // fingers above palm
        const closedFist =
          avgY(lm, [8, 12, 16, 20]) > palmBase.y - 0.01; // fingers near palm

        let detected = "";

        // ---- Gesture Rules ----
        if (openPalm && thumbTip.x < palmBase.x - 0.05) {
          detected = "Hello"; // hand extended and left (Open hand, fingers spread, thumb to the left of palm)
        } else if (openPalm && thumbTip.x > palmBase.x + 0.05) {
          detected = "Goodbye"; // hand extended and right (Open hand, fingers spread, thumb to the right of palm)
        } else if (closedFist && thumbTip.y < indexTip.y) {
          detected = "Thank you"; // fist with thumb over fingers
        } else if (closedFist && thumbTip.y > indexTip.y) {
          detected = "I'm sorry"; // fist but thumb tucked in
        } else if (
          openPalm &&
          distance(indexTip, thumbTip) < 0.07 &&
          distance(middleTip, thumbTip) < 0.1
        ) {
          detected = "How are you"; // fingers near each other (Palm open, thumb + index close together)
        } else if (thumbTip.y < indexTip.y && thumbTip.y < middleTip.y) {
          detected = "Yes"; // thumbs up
        } else if (thumbTip.y > indexTip.y && thumbTip.y > middleTip.y) {
          detected = "No"; // thumbs down
        }

        if (detected && detected !== gesture) {
          setGesture(detected);
          onDetect && onDetect(detected);
        } else if (!detected) {
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
  }, [onDetect, gesture]);

  return (
    <div style={{ position: "relative", width: 640, height: 480 }}>
      <video ref={videoRef} style={{ display: "none" }}></video>
      <canvas ref={canvasRef} width={640} height={480} />
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          backgroundColor: "rgba(0,0,0,0.6)",
          color: "white",
          padding: "6px 12px",
          borderRadius: "8px",
          fontSize: "1.1rem",
        }}
      >
        {gesture ? `🖐️ Detected: ${gesture}` : "Detecting..."}
      </div>
    </div>
  );
}