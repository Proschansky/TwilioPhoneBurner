import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Rating from '@material-ui/lab/Rating';
import Box from '@material-ui/core/Box';
import { store } from "../Store";

const labels = {
  0.5: 'Useless',
  1: 'Useless+',
  1.5: 'Poor',
  2: 'Poor+',
  2.5: 'Ok',
  3: 'Ok+',
  3.5: 'Good',
  4: 'Good+',
  4.5: 'Excellent',
  5: 'Excellent+',
};

const useStyles = makeStyles({
  root: {
    width: 200,
    display: 'flex',
    alignItems: 'center',
  },
});

export default function HoverRating() {
  const globalState = useContext(store);
  const { index, contacts } = globalState.state;
  const { rating } = contacts[index];
  const { dispatch } = globalState;
  const [hover, setHover] = React.useState(-1);
  const classes = useStyles();
  
  return (
    <div className={`${classes.root} pl-5 d-flex flex-column`}>
      <Rating
        name="hover-feedback"
        value={ rating }
        precision={0.5}
        onChange={(event, newValue) => {
          dispatch({type: 'SET_RATING', index: index, rating: newValue});
        }}
        onChangeActive={(event, newHover) => {
          setHover(newHover);
        }}
      />
      { rating !== null && <Box ml={1} mb={1}>{labels[hover !== -1 ? hover : rating]}</Box>}
    </div>
  );
}
