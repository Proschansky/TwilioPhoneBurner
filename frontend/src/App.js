/* eslint-disable no-unused-expressions */
import React, { useContext, useEffect, useState } from "react";
import "./App.css";
import ContactCarousel from "./Components/ContactCarousel";
import axios from "axios";
import { store } from "./Store";
import { Device } from "twilio-client";
import MessageInput from "./Components/MessageInput";

export default function App() {
  const globalState = useContext(store);
  const {
    accept,
    burning,
    calling,
    connection,
    contacts,
    incoming,
    index,
    from,
  } = globalState.state;

  const { dispatch } = globalState;

  const [nextIndex, setNextIndex] = React.useState(index + 1);
  const [lastIndex, setLastIndex] = React.useState(index - 1);

  useEffect(() => {
    if (index === nextIndex) {
      setNextIndex(index + 1);
    }
  }, [index, nextIndex]);

  // useEffect(() => {
  //   if (index === lastIndex || index > lastIndex + 1) {
  //     setNextIndex(index - 1);
  //   }
  // }, [index, lastIndex]);

  useEffect(() => {
    axios
      .get("https://twiliophoneburner.herokuapp.com/token")
      .then((resp) => {
        Device.setup(resp.data.token);
      })
      .catch(function (err) {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    Device.ready(function () {
      console.log("CONNECTED TO TWILIO");
    });

    Device.incoming(function (conn) {
      dispatch({ type: "INCOMING", from: conn.parameters.From });
      console.log("Incoming connection from " + conn.parameters.From);
      // accept the incoming connection and start two-way audio
      dispatch({ type: "ADD_CONNECTION", connection: conn });

      conn.on("cancel", () => {
        dispatch({ type: "CANCEL_INCOMING" });
      });

      conn.on("reject", () => {
        dispatch({ type: "CANCEL_INCOMING" });
      });

      conn.on("disconnect", () => {
        dispatch({ type: "CANCEL_INCOMING" });
        dispatch({ type: "HANG_UP" });
      });
    });

  }, []);


  useEffect(()=>{
    Device.on("disconnect", async (res) => {
      console.log(res);
      if (!res.sendHangup) {
        dispatch({ type: "HANG_UP" });
        dispatch({ type: "BURNING_NEXT"});
      }
      
    });
  }, [])

  useEffect(()=>{
    if(index === nextIndex && burning){
      makeCall(contacts[index].phoneNumber);
    }
  }, [index, nextIndex])

  const makeCall = async (phoneNum, message) => {
    dispatch({ type: "MAKE_CALL" });
    setNextIndex(index + 1);
    return Device.connect({ number: phoneNum, message: message });
  };

  const hangUp = (ind = index, nxt = nextIndex) => {
    Device.disconnectAll();
    dispatch({ type: "BURNING_NEXT" })
    if (contacts[nextIndex]){
      console.log("CONTACT", contacts[nextIndex].phoneNumber)
      Device.ready(function(){
        makeCall(contacts[nextIndex].phoneNumber, contacts[nextIndex].message)
      })
    } else {
      dispatch({ type: "HANG_UP"});
    }
  };

  function CallButtons() {
    if (calling) {
      return (
        <div className="col-md-6 d-flex justify-content-center">
          <button
            className="mb-1 btn linkButton bg-danger ml-1"
            onClick={() => {
              dispatch({ type: "CANCEL_INCOMING" });
              dispatch({ type: "HANG_UP" });
              Device.disconnectAll();
            }}
            style={{
              overflow: "hidden",
              width: "100px",
              height: "100px",
              fontSize: "10px",
              float: "right",
            }}
          >
            Hang Up
          </button>
        </div>
      );
    } else {
      return (
        <>
          {" "}
          <div className="col-md-3 justify-content-left">
            <button
              className="mb-1 btn linkButton bg-success mr-1"
              style={{}}
              onClick={() => {
                connection.accept();
                dispatch({ type: "MAKE_CALL" });
              }}
              style={{
                marginRight: "15px",
                overflow: "hidden",
                width: "100px",
                height: "100px",
                fontSize: "10px",
              }}
            >
              Accept
            </button>
          </div>
          <div className="col-md-3 d-flex flex-row-reverse justify-content-right">
            <button
              className="mb-1 btn linkButton bg-danger ml-1"
              onClick={() => {
                dispatch({ type: "CANCEL_INCOMING" });
                connection.reject();
              }}
              style={{
                overflow: "hidden",
                width: "100px",
                height: "100px",
                fontSize: "10px",
                float: "right",
              }}
            >
              Decline
            </button>
          </div>
        </>
      );
    }
  }

  const IncomingCall = () => {
    return (
      <div className="card bg-warning">
        <div className="card-header text-info bg-light text-center">
          <h1>{`Call coming in from ${from}`}</h1>
        </div>
        <div className="row d-flex flex-row p-5">
          <div className="col-md-3"></div>
          {CallButtons()}
          <div className="col-md-3"></div>
        </div>
      </div>
    );
  };

  const pageContent = () => {
    if (incoming) {
      return <IncomingCall />;
    }
    return <ContactCarousel makeCall={makeCall} hangUp={hangUp} />;
  };

  const flex = incoming ? "d-flex align-content-center" : null;

  return (
    <>
      <div className={`container bg-dark ${flex}`} style={{ height: "500px" }}>
        {pageContent()}
      </div>
    </>
  );
}
