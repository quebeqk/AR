import React, { useState, useEffect, useRef } from "react";
import * as posenet from "@tensorflow-models/posenet";
import Webcam from "react-webcam";

const BodyMeasurementApp = () => {
  const [pose, setPose] = useState(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const runPoseNet = async () => {
      const net = await posenet.load();
      setInterval(() => {
        detect(net);
      }, 100);
    };

    const detect = async (net) => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        const pose = await net.estimateSinglePose(video, {
          flipHorizontal: false,
        });
        // console.log("Pose:", pose);
        setPose(pose);
        drawPose(pose);
      }
    };

    runPoseNet();
  }, []);

  const drawPose = (pose) => {
    const video = webcamRef.current.video;
    const videoW = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;
    webcamRef.current.video.width = videoW;
    webcamRef.current.video.height = videoHeight;
    if (pose) {
      // Calculate distances between body parts
      const leftShoulder = pose.keypoints.find(
        (kp) => kp.part === "leftShoulder"
      );
      const rightShoulder = pose.keypoints.find(
        (kp) => kp.part === "rightShoulder"
      );
      const shoulderDistance =
        (Math.abs(leftShoulder.position.x - rightShoulder.position.x) /
          videoW) *
        100; // Convert to cm

      const leftWrist = pose.keypoints.find((kp) => kp.part === "leftWrist");
      const rightWrist = pose.keypoints.find((kp) => kp.part === "rightWrist");
      const wristDistance =
        (Math.abs(leftWrist.position.x - rightWrist.position.x) / videoW) * 100; // Convert to cm

      // Display distances on the browser
      const bodySizeElement = document.getElementById("bodySize");
      if (bodySizeElement) {
        bodySizeElement.innerText = `Shoulder Distance: ${shoulderDistance.toFixed(
          2
        )}cm, Wrist Distance: ${wristDistance.toFixed(2)}cm`;
      }

      // Draw keypoints and skeleton on the canvas
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawKeypoints(pose.keypoints, ctx);
      drawSkeleton(
        pose.keypoints,
        posenet.getAdjacentKeyPoints(pose.keypoints, 0.5),
        ctx
      );
    }
  };

  const drawKeypoints = (keypoints, ctx) => {
    for (let i = 0; i < keypoints.length; i++) {
      const keypoint = keypoints[i];
      if (keypoint.score > 0.5) {
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      }
    }
  };

  const drawSkeleton = (keypoints, adjacentKeyPoints, ctx) => {
    for (let i = 0; i < adjacentKeyPoints.length; i++) {
      const keypointIndices = adjacentKeyPoints[i];
      const fromKeypoint = keypoints[keypointIndices[0]];
      const toKeypoint = keypoints[keypointIndices[1]];

      // Add a check to ensure fromKeypoint and toKeypoint are defined
      if (fromKeypoint && toKeypoint) {
        ctx.beginPath();
        ctx.moveTo(fromKeypoint.position.x, fromKeypoint.position.y);
        ctx.lineTo(toKeypoint.position.x, toKeypoint.position.y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#00ff00";
        ctx.stroke();
      }
    }
  };

  const calculateDistance = (point1, point2) => {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
  };

  return (
    <div>
      <div>
        <Webcam ref={webcamRef} />
        <canvas ref={canvasRef} />
        <div id="bodySize"></div>
      </div>
    </div>
  );
};

export default BodyMeasurementApp;
