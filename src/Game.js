import React from 'react';
import './master.css';

function Ship(props) {
  const enemyImgUrl = 'https://live.staticflickr.com/65535/50724769872_da72a3fd7c_t.jpg';
  const allyImgUrl = 'https://live.staticflickr.com/65535/50724684336_aaa14d5649_t.jpg';
  const shipKey = props.key;

  if (!props.isAlly) {  // enemy ships have lasers below them
    return (
      <div>
        <img
          reactKey={shipKey}
          src={ props.isAlly ? allyImgUrl : enemyImgUrl }
        />
        <Laser isAlly = {false} laserState={props.state} />
      </div>
    );  
  } else {
    return (
      <div>
        <Laser isAlly = {true} laserState={props.state} />
        <img
          reactKey={shipKey}
          src={ props.isAlly ? allyImgUrl : enemyImgUrl }
        />
      </div>
    );
  }
}

function Laser(props) {  
  // url variables
  const allyChargingLaserUrl = 'https://live.staticflickr.com/65535/50723947808_9809886476_t.jpg';
  const allyFiringLaserUrl = 'https://live.staticflickr.com/65535/50724684431_bffd593096_t.jpg';
  const enemyChargingLaserUrl = 'https://live.staticflickr.com/65535/50724684381_4ca6f500da_t.jpg';
  const enemyFiringLaserUrl = 'https://live.staticflickr.com/65535/50723947768_2ab5054c24_t.jpg';
  
  let laserState = props.laserState;
  const isAlly = props.isAlly;
  let imageSource;
  
  // decide which image to use
  if (laserState === 'charging') {
    if (isAlly) {
      imageSource = allyChargingLaserUrl;
    } else {
      imageSource = enemyChargingLaserUrl;
    }
  } else if (laserState === 'firing') {
    if (isAlly) {
      imageSource = allyFiringLaserUrl;
    } else {
      imageSource = enemyFiringLaserUrl;
    }
  } else {  // laserState is idle
    return (
      <div className="laser"></div>  // empty space with the appropriate width
    );
  }
  
  // laser isn't idle, so return the charging or firing image
  return (
    <img src={imageSource} className="laser" />
  );    
}

function ShipRow(props) {
  const shipKeys = props.reactKeys;
  const enemies = shipKeys.map((shipKey, index) => 
    <Ship isAlly={props.isAlly} state={} column={index} key={shipKey.toString()} />  // TODO: ************ use props.shipStates (array of states). No, can't map over two arrays
  );

  return (
      <ul className="game-row">{enemies}</ul>
  );
}

function OutputArea(props) {
    // make char array from input string
    const outputString = props.output;
    const outputChars = Array.from(outputString);

    // prepare a generator of IDs for key prop
    const idGenerator = props.reactKeys.values();
    const outputCharPs = outputChars.map((char, index) => 
      <div column={index} key={idGenerator.next()} >{char}</div>
    );
    const keys = props.outputCharKeys;
  
    return (
      <div className="output-container">
        <ul className="game-text game-row">{outputCharPs}</ul>
      </div>
    );
}

class InputArea extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.props.onInputChange(event.target.value);
  }
  
  render() {
    return (
      <form className="input-container game-text-container flex-container">
        <input
          type="text"
          value={this.props.input}
          className="input-box game-text"
          onChange={this.handleChange} />
      </form>
    );    
  }
}

class ShipObject {
  constructor() {
    this.alive = true;
    this.state = 'idle';
  }

  getState() {
    return this.state;
  }

  advanceState() {
    if (this.state === 'idle') {
      this.state = 'charging';
    } else if (this.state === 'charging') {
      this.state = 'firing';
    } else {
      this.state = 'idle';
    }
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);

    const maxColumns = 7;
    const maxRows = 5;

    this.maxColumns = maxColumns;
    this.maxRows = maxRows;

    this.state = {
      input: 'testt',
      allyShips: new Array(maxColumns).fill().map(() => {return new ShipObject()}),
      enemyShips: new Array(maxColumns).fill().map(() => {return new ShipObject()}),
    };

    this.handleInputChange = this.handleInputChange.bind(this);
  }
  
  tick() {
    console.log('ticking');
    // advances the state of 1 random laser from idle to charging, and all which are charging from charging to firing to idle
    this.setState((state) => {
      // advance states of all charging and firing ships

      // find an idle laser and advance its state from idle to charging
      for (const ship of state.allyShips) {
        if (ship.state === 'idle') {  // TODO: be more random
          ship.advanceState();
        }
      }

    });

    // checks if any firing laser has "collided" with (is in the same lane as) a letter. If no letter or a vowel, it goes through (opposite ship is destroyed, so that row's prop, obtained from an array in state, is updated). If consonant, it is blocked (nothing happens)
    // informs children of their state through props

    // (in LaserRow, render checks props for the appropriate image)
    // (in AllyRow and EnemyRow, render checks props for alive and renders blank if not alive)
  }
  
  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      3000
    );
  }
  
  componentWillUnmount() {
    clearInterval(this.timerID);
  }
  
  handleInputChange(value) {
    this.setState({input: value});
    console.log('set input to ', value);
  }
  
  render() {
    const MAX_COLUMNS = this.maxColumns;
    const MAX_ROWS = this.maxRows;

    // make keys required by React for lists of elements
    const gameRowItemKeys = new Array(MAX_COLUMNS * MAX_ROWS).fill(0).map((element, index) => index);
    const enemyKeys = gameRowItemKeys.slice(0, MAX_COLUMNS);
    const allyKeys = gameRowItemKeys.slice(MAX_COLUMNS, MAX_COLUMNS * 2);
    const outputCharKeys = gameRowItemKeys.slice(MAX_COLUMNS * 4, MAX_COLUMNS * 5);  

    let allyShipStates = new Array();
    for (const ship of this.state.allyShips) {
      allyShipStates.push(ship.getState());
    }

    let enemyShipStates = new Array();
    for (const ship of this.state.enemyShips) {
      enemyShipStates.push(ship.getState());
    }

    return (
      <div className="game-container flex-container">

        <div className="visuals-container">
          <ShipRow isAlly={false} reactKeys={enemyKeys} shipStates={enemyShipStates} />
          <OutputArea output={this.state.input} reactKeys={outputCharKeys} />
          <ShipRow isAlly={true} reactKeys={allyKeys} shipStates={allyShipStates} />
        </div>

        <div>
          <InputArea input={this.state.input} onInputChange={this.handleInputChange} />
        </div>
      </div>
    );
  }
}

export default Game;
