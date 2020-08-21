import React from 'react';
import axios from 'axios';

export default class MessageInput extends React.Component {
    constructor(props) {
      super(props);
      this.state = {value: ''};
  
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }
  
    handleChange(event) {
      this.setState({value: event.target.value});
    }
  
    handleSubmit(event) {
      alert('A name was submitted: ' + this.state.value);
      event.preventDefault();
      axios.post("https://twiliophoneburner.herokuapp.com/message", {
          message: this.state.value
      }).then(res => console.log("Message posted", res));
    }
  
    render() {
      return (
        <form className="card w-75 bg-light d-flex justify-content-center mt-1" onSubmit={this.handleSubmit}>
          <label className="card-header text-center">
             Message For Applicant
          </label>
          <div className="row d-flex justify-content-center mb-1 pt-1"><textarea type="text" value={this.state.value} onChange={this.handleChange} style={{height: "200px", width: "500px"}}/></div>
          <div className="row d-flex justify-content-center"><button className="btn w-10 bg-success" type="submit" value="Submit">Submit</button></div>
        </form>
      );
    }
  }