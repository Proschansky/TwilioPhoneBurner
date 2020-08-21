import React from "react";

export default function Audio(props) {
  if (props.blob) {
    return (
      <audio
        controls
        playsInline
        style={{ display: "block", width: "100%" }}
        ref={(audioElement) => {
          if (audioElement && props.blob) {
            audioElement.src = props.blob.blobURL;
          }
        }}
      ></audio>
    );
  }

  return null;
}
