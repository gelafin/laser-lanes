import React from 'react';
import './master.css';

function Ship(props) {
  const enemyImgUrl = 'https://live.staticflickr.com/65535/50724769872_da72a3fd7c_t.jpg';
  const allyImgUrl = 'https://live.staticflickr.com/65535/50724684336_aaa14d5649_t.jpg';

  if (!props.isAlly) {  // enemy ships have lasers below them
    return (
      <div className="ship">
        <img
          src={ props.isAlly ? allyImgUrl : enemyImgUrl }
        />
        <Laser isAlly = {false} laserState={props.state} />
      </div>
    );  
  } else {
    return (
      <div className="ship">
        <Laser isAlly = {true} laserState={props.state} />
        <img
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
  // debugging
  if (props.ships[0].isAlly) {
    console.log('     ShipRow receives ', props.ships[0].getState());
  }

  const shipRow = props.ships.map((ship) => 
    <Ship isAlly={ship.isAlly} state={ship.getState()} key={ship.getId()} />  // need column #?
  );

  return (
      <ul className="game-row">{shipRow}</ul>
  );
}

function OutputArea(props) {
    // make char array from input string
    const outputString = props.output;
    const outputChars = Array.from(outputString);

    // prepare a generator of IDs for key prop
    const idGenerator = props.reactKeys.values();
    const outputCharPs = outputChars.map((char, index) => 
      <div column={index} key={idGenerator.next().value} >{char}</div>
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

function * infiniteShipIdGenerator() {
  let idHalf = 0;
  while(true) {
    yield 'ship' + (idHalf++).toString();
  }
}

class ShipObject {
  constructor(isAlly, id) {
    this.alive = true;
    this.state = 'idle';
    this.id = id;
    this.isAlly = isAlly;
  }

  getState() {
    return this.state;
  }

  getId() {
    return this.id;
  }

  advanceState() {
    if (this.state === 'idle') {
      console.log('is idle, will charge');
      this.state = 'charging';
    } else if (this.state === 'charging') {
      console.log('is charging, will fire');
      this.state = 'firing';
    } else {
      console.log('is firing, will idle');
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

    const shipIdGenerator = infiniteShipIdGenerator();

    this.state = {
      input: 'testt',
      allyShips: new Array(maxColumns).fill().map(() => {return new ShipObject(true, shipIdGenerator.next().value)}),
      enemyShips: new Array(maxColumns).fill().map(() => {return new ShipObject(false, shipIdGenerator.next().value)}),
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.tick = this.tick.bind(this);
  }
  
  tick() {
    console.log('******ticking');
    // advances the state of 1 random laser from idle to charging, and all which are charging from charging to firing to idle
    this.setState((state) => {
      // advance states of all charging and firing ships
      // find an idle laser and advance its state from idle to charging
      // test: continually advancing first laser state
      let newAllyShips = state.allyShips;
      newAllyShips[0].advanceState();

      return {allyShips: newAllyShips};
    }, ()=>{console.log(' > finished updating!');});

    // checks if any firing laser has "collided" with (is in the same lane as) a letter. If no letter or a vowel, it goes through (opposite ship is destroyed, so that row's prop, obtained from an array in state, is updated). If consonant, it is blocked (nothing happens)
    // informs children of their state through props

    // (in LaserRow, render checks props for the appropriate image)
    // (in AllyRow and EnemyRow, render checks props for alive and renders blank if not alive)
  }
  
  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      10000
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

    // make keys required by React for lists of elements. TODO: use something more unlimited, since player can type outside of play area. Else, just restrict typing and give up on validating words
    const outputCharKeys = new Array(MAX_COLUMNS).fill(0).map((element, index) => index);

    console.log('     rendering shiprow with ', this.state.allyShips[0].getState());
    return (
      <div className="game-container flex-container">

        <div className="visuals-container">
          <ShipRow ships={this.state.enemyShips} />
          <OutputArea output={this.state.input} reactKeys={outputCharKeys} />
          <ShipRow ships={this.state.allyShips} />
        </div>

        <div>
          <InputArea input={this.state.input} onInputChange={this.handleInputChange} />
        </div>
      </div>
    );
  }
}

export default Game;
