import React from 'react';
import { ReactMic } from 'react-mic';
import axios from 'axios';
import Audio from './Audio'
 
export default class Recorder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      record: false,
      blob: undefined
    }
    this.onStop = this.onStop.bind(this);
  }
 
  startRecording = () => {
    this.setState({ record: true });
  }
 
  stopRecording = () => {
    this.setState({ record: false });
  }
 
  onStop(recordedBlob) {
    this.setState({ blob: recordedBlob})
    let data = new FormData()
    data.append('Recording.webm', recordedBlob.blob)
    
    for(let value of data.values()){
      console.log("VALUE", value)
    }

    let config = {
      header : {
        'Content-Type' : 'multipart/form-data'
      }
    }

    axios.post("https://twiliophoneburner.herokuapp.com/recording", data, config);
  }
 
  render() {

    return (
      <div className="text-center">
        <h1> Record New Voicemail Message </h1>
        <ReactMic
          record={this.state.record}
          className="sound-wave"
          onStop={this.onStop}
          onData={this.onData}
          strokeColor="#000000"
          backgroundColor="teal" />
        <div className="d-flex justify-content-center"><button onClick={this.startRecording} type="button">Start</button>
        <button onClick={()=>{if(this.state.record){this.stopRecording()}}} type="button">Stop</button>
        </div>
        <Audio {...this.state} />
      </div>
    );
  }
}
