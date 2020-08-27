import React, { useContext, useEffect } from "react";
import { Carousel } from "react-bootstrap";
import axios from "axios";
import Rating from "./Rating";
import { store } from "../Store";
import { Device } from 'twilio-client';

export default function Contacts(props) {
  const globalState = useContext(store);
  const { state, dispatch } = globalState;
  const { calling, contacts, conferenceId, index } = state;

  const [slideIndex, setSlideIndex] = React.useState(index);

  useEffect(()=>{
    setSlideIndex(index)
  }, [index])

  function next() {
    dispatch({ type: "NEXT" });
  }

  function previous() {
    dispatch({ type: "PREVIOUS" });
  }

  const nextIcon = (
    <span
      aria-hidden="true"
      className="carousel-control-next-icon"
      onClick={next}
    />
  );

  const prevIcon = (
    <span
      aria-hidden="true"
      className="carousel-control-prev-icon"
      onClick={previous}
    />
  );

  // const makeCall = async (phoneNum) => {
  //   dispatch({ type: "MAKE_CALL" })
  //   Device.connect({ number: phoneNum });
  // };

  // const hangUp = () => {
  //   dispatch({ type: "HANG_UP" });
  //   Device.disconnectAll();
  //   if(index !== contacts.length - 1){
  //     dispatch({ type: "NEXT" });
  //     dispatch({ type: "MAKE_CALL"})
  //     makeCall(contacts[index + 1].phoneNumber);
  //   }
  // };

  const callButton = (idx) => {
    return calling ? (
      <button
        className="ml-2 mb-1 btn bg-danger linkButton ml-5"
        onClick={props.hangUp}
      >
        <i className="fa fa-phone" aria-hidden="true"></i>
      </button>
    ) : (
      <button
        className="ml-2 mb-1 btn bg-light linkButton ml-5"
        onClick={() => props.makeCall(contacts[idx].phoneNumber, contacts[idx].message)}
      >
        <i className="fa fa-phone" aria-hidden="true"></i>
      </button>
    );
  };

  const Contacts = contacts.map((contact, i) => {
    if (i === index) {
      return (
        <Carousel.Item
          className="d-flex justify-content-center align-content-center"
          key={i}
        >
          <div className="card mt-5">
            <div className="card-header d-flex align-content-center justify-content-center">
              <div className="col-sm-4 d-sm-block"></div>
              <div>
                <h1 style={{ whiteSpace: "nowrap" }}>{contact.name}</h1>
                <Rating className="align-self-center" />
              </div>
              <div className="d-flex justify-content-center"></div>
              <div className="col-sm-4 d-sm-block"></div>
            </div>
            <div className="card-body d-flex">
              <ul>
                <li>
                  {contact.phoneNumber}
                  {callButton(i)}
                </li>
                <li>
                  {contact.emailAddress}
                  <button className="ml-2 btn bg-light linkButton ml-5">
                    <i className="fa fa-envelope" aria-hidden="true"></i>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </Carousel.Item>
      );
    }
  });

  return (
    <Carousel
      className="h-100 p-5"
      activeIndex={slideIndex}
      indicators={true}
      nextIcon={nextIcon}
      prevIcon={prevIcon}
    >
      {Contacts}
    </Carousel>
  );
}
