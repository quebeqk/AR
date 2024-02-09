import React from "react";
import Webcam from "react-webcam";

const WebcamCapture = () => {
  const webcamRef = React.useRef(null);

  return <Webcam audio={false} ref={webcamRef} />;
};

export default WebcamCapture;
