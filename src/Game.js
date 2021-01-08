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
  const shipRow = Object.values(props.ships).map((ship) => 
    <Ship isAlly={ship.isAlly} state={ship.getState()} key={ship.getId()} />
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
  constructor(isAlly, laneNumber) {
    this.alive = true;
    this.state = 'idle';
    this.lane = laneNumber;
    this.isAlly = isAlly;

    const idPrefix = isAlly ? 'ally' : 'enemy';
    this.id = idPrefix + laneNumber.toString();
  }

  getState() {
    return this.state;
  }

  getId() {
    return this.id;
  }

  getLane() {
    return this.lane;
  }

  print() {
    console.log('\tid:', this.getId());
    console.log('\tisAlly:', this.isAlly);
    console.log('\tlane:', this.getLane());
    console.log('\tstate:', this.getState());
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

    // track ship objects, keyed by ship ID
    let initialAllyShips = {};
    let initialEnemyShips = {};
    for (const lane of allLanes.values()) {
      // add an ally ship
      let newAlly = new ShipObject(true, lane);  // TODO: can use const?
      initialAllyShips[newAlly.getId()] = newAlly;

      // add an enemy ship
      let newEnemy = new ShipObject(false, lane);  // TODO: can use const?
      initialEnemyShips[newEnemy.getId()] = newEnemy;
    }

    // track ID number of each ship in a given state, for convenience and efficiency elsewhere. Updated by advanceShipState
    const initialAllyShipStates = {
        firingShips: [],
        chargingShips: [],
        idleShips: Array.from(Object.keys(initialAllyShips))  // keyed by ID
    };

    const initialEnemyShipStates = {
        firingShips: [],
        chargingShips: [],
        idleShips: Array.from(Object.keys(initialEnemyShips))  // keyed by ID
    };
    
    this.state = {
      input: 'testt',
      allyShips: initialAllyShips,
      enemyShips: initialEnemyShips,
      allyShipStates: initialAllyShipStates,
      enemyShipStates: initialEnemyShipStates
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.tick = this.tick.bind(this);
    this.advanceShipState = this.advanceShipState.bind(this);
    this.fireAllChargingShips = this.fireAllChargingShips.bind(this);
  }
  
  advanceShipState(shipId) {
    // param: shipId: id of the ship object to be updated
    // calls the ship object's advanceState and updates both the Game's ship object and lane state lists

    // get allegiance-specific variables
    let ship;
    let laneStateArray;
    let shipObjects;

    if (shipId.includes('ally')) {  // if it's an ally ship
      ship = this.state.allyShips[shipId];
      laneStateArray = 'allyShipStates';
      shipObjects = 'allyShips';
    } else {  // it's an enemy ship
      ship = this.state.enemyShips[shipId];
      laneStateArray = 'enemyShipStates';
      shipObjects = 'enemyShips';
    }

    // get convenience variables
    const shipState = ship.getState();

    /*
    ======================== 
    Update ship object state array 
    ======================== 
    */
    let newShipObjects = {...this.state[shipObjects]};
    newShipObjects[shipId].advanceState();
    this.setState({ [shipObjects]: newShipObjects });

    /*
    ======================== 
    Update lane state arrays 
    ======================== 
    */
    // find which lane state arrays to update
    let newStateGroup;
    let oldStateGroup;

    if (shipState === 'idle') {
      oldStateGroup = 'idleShips';
      newStateGroup = 'chargingShips';
    } else if (shipState === 'charging') {
      oldStateGroup = 'chargingShips';
      newStateGroup = 'firingShips';
    } else {
      oldStateGroup = 'firingShips';
      newStateGroup = 'idleShips';
    }

    // now we know which lane state array to remove from, so get the index of this ship
    const removalIndex = this.state[laneStateArray][oldStateGroup].indexOf(shipId);

    // make copies of lane state arrays
    let newStateGroupArray = this.state[laneStateArray][newStateGroup];
    let oldStateGroupArray = this.state[laneStateArray][oldStateGroup];

    // make the state advance changes to the copy arrays
    newStateGroupArray.push(shipId);
    oldStateGroupArray.splice(removalIndex, 1);

    // set the Game state by replacing lane state arrays with the updated copies
    this.setState({ [[laneStateArray][newStateGroup]]: newStateGroupArray });
    this.setState({ [[laneStateArray][oldStateGroup]]: oldStateGroupArray });
  }

  fireAllChargingShips() {
    // advances states of all charging ships to firing and processes consequences of laser strikes

    if (this.state.allyShipStates.chargingShips.length > 0) {  // if there are any charging ships

      // advance state of all ally charging ships to firing
      for (const shipId of this.state.allyShipStates.chargingShips.values()) {
        
        // advance state to firing
        this.advanceShipState(shipId);

        // to process a laser fire, make a setTimeout with c/b to...
          // (props are just the whole ships, so the image will change automatically)
          // check if there is a vowel or consonant in that lane
          // if cons, it was blocked. Change laser state to idle
          // if vowel, it hits. Tell the opposite ship that it got hit (in Game, play explosion and change Game.ships[targetShip].isAlive to false. In Ship, show incoming beam then display an empty div)

          // change state back to idle
          this.advanceShipState(shipId);
      }
    }


    // TODO: also do this for all charging enemy ships    
  }

  tick() {
    console.log('******ticking');
    // test
    this.sfx.explosion.play().catch(()=>{console.log('*****ERROR: audio play() promise rejected. Click into the text box--or else this is localhost');});

    this.fireAllChargingShips();

    this.setState((state) => {

      // advance the state of 1 random idle laser per side to charging
      // get random indices for lane states arrays
      const randomIdleAllyIndex = randomInt(0, state.allyShipStates.idleShips.length);
      const randomIdleEnemyIndex = randomInt(0, state.enemyShipStates.idleShips.length);

      // use those indices to get a random idle ship's ID
      const randomIdleAllyId = state.allyShipStates.idleShips[randomIdleAllyIndex];
      const randomIdleEnemyId = state.enemyShipStates.idleShips[randomIdleEnemyIndex];

      // advance the states from idle to charging
      this.advanceShipState(randomIdleAllyId);
      this.advanceShipState(randomIdleEnemyId);
    }, ()=>{console.log(' > finished setState! Best to call advanceShipState here');});
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
