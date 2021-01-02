import React from 'react';
import './master.css';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

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
    console.log('          in ShipRow ', props.ships[0].getState());
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

  print() {
    console.log('printing ship...');
    console.log('\tid:', this.getId());
    console.log('\tstate:', this.getState());
    console.log('\tisAlly:', this.isAlly);
    console.log('\talive:', this.alive);
  }

  advanceState() {
    if (this.state === 'idle') {
      console.log('in ShipObject::advanceState(): is idle, will charge');
      this.state = 'charging';
    } else if (this.state === 'charging') {
      console.log('in ShipObject::advanceState(): is charging, will fire');
      this.state = 'firing';
    } else {
      console.log('in ShipObject::advanceState(): is firing, will idle');
      this.state = 'idle';
    }

    return this.state;
  }
}

function printObject(object) {
  console.log('\n\t', 'type: ', typeof object);
  for (const key in object) {
    console.log('\t', key, ':', object[key]);
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);

    const maxColumns = 7;
    const maxRows = 5;

    this.maxColumns = maxColumns;
    this.maxRows = maxRows;
    const allLanes = Array.from(new Array(maxColumns).keys());

    const shipIdGenerator = infiniteShipIdGenerator();

    this.state = {
      input: 'testt',
      allyShips: new Array(maxColumns).fill().map(() => {return new ShipObject(true, shipIdGenerator.next().value)}),
      enemyShips: new Array(maxColumns).fill().map(() => {return new ShipObject(false, shipIdGenerator.next().value)}),

      // track lane number of each ship in a state. Updated by advanceShipState
      allyShipStates: {
        firingShips: new Array(),
        chargingShips: new Array(),
        idleShips: Array.from(allLanes)
      },
      enemyShipStates: {
        firingShips: new Array(),
        chargingShips: new Array(),
        idleShips: Array.from(allLanes)
      }
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.tick = this.tick.bind(this);
    this.advanceShipState = this.advanceShipState.bind(this);
  }
  
  advanceShipState(ships, lane) {
    // call the ship object's advanceState and update the Game state lists of all firing, charging, and idle lasers
    const newState = ships[lane].advanceState();
    const shipStateGroup = ships[lane].isAlly ? 'allyShipStates' : 'enemyShipStates';

    // TODO: apply changes after if/else block, not inside it. Also call setState

    if (newState === 'idle') {
      const indexInFiringShips = this.state[shipStateGroup].firingShips.indexOf(lane);

      this.state[shipStateGroup].idleShips.push(lane);
      this.state[shipStateGroup].firingShips.splice(indexInFiringShips, 1);

    } else if (newState === 'charging') {
      const indexInIdleShips = this.state[shipStateGroup].idleShips.indexOf(lane);

      this.state[shipStateGroup].chargingShips.push(lane);
      this.state[shipStateGroup].idleShips.splice(indexInIdleShips, 1);
    } else {
      const indexInChargingShips = this.state[shipStateGroup].idleShips.indexOf(lane);
      
      this.state[shipStateGroup].firingShips.push(lane);
      this.state[shipStateGroup].chargingShips.splice(indexInChargingShips, 1);
    }
  }

  tick() {
    console.log('******ticking');
    // test
    this.sfx.explosion.play().catch(()=>{console.log('*****ERROR: audio play() promise rejected. Click into the text box--or else this is localhost');});

    this.setState((state) => {

      // advance states of all charging and firing ships
        // for any ships that just fired, process a laser fire
          // check if there is a vowel or consonant in that lane
          // if cons, it was blocked. Change laser state to idle
          // if vowel, it hits. Tell the opposite ship that it got hit (in Game, play explosion and change Game.ships[targetShip].isAlive to false. In Ship, show incoming beam then display an empty div)

      // advance the state of 1 random idle laser per side to charging
      // get random indices for shipStates arrays
      const randomIdleAllyIndex = randomInt(0, state.allyShipStates.idleShips.length);
      const randomIdleEnemyIndex = randomInt(0, state.enemyShipStates.idleShips.length);

      // use those indices to get a random idle ship's lane number
      const randomIdleAllyLane = state.allyShipStates.idleShips[randomIdleAllyIndex];
      const randomIdleEnemyLane = state.enemyShipStates.idleShips[randomIdleEnemyIndex];

      // make a copy of allyShips
      let newAllyShips = [...state.allyShips];

      this.advanceShipState(newAllyShips, randomIdleAllyLane);

      console.log('\tin setState(): just changed this 1 idle ally ship to charging: ');
      newAllyShips[randomIdleAllyLane].print();
      console.log('\tin lane ', randomIdleAllyLane);

      let newEnemyShips = [...state.enemyShips];
      this.advanceShipState(newEnemyShips, randomIdleEnemyLane);

      return {allyShips: newAllyShips, enemyShips: newEnemyShips};
    }, ()=>{console.log(' > finished setState!');});
  }
  
  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      10000
    );

    // load sfx (should only load these once, then play them as needed)
    this.sfx = {
      explosion: new Audio('./sfx/explosion.mp3'),
      chargingLaser: new Audio('./sfx/charging_laser.mp3'),
      firingLaser: new Audio('./sfx/firing_laser.mp3'),
    };

    // balance audio
    this.sfx.explosion.volume = 0.1;
    this.sfx.chargingLaser.volume = 0.1;
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

    // make keys required by React for lists of elements. TODO: use something more unlimited, since player can type outside of play area. Else, just restrict typing and give up on validating words
    const outputCharKeys = new Array(MAX_COLUMNS).fill(0).map((element, index) => index);

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
