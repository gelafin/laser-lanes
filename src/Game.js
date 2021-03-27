import React from 'react';
import './master.css';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

function isVowel(char) {
  /*
  thx https://stackoverflow.com/a/5488098/14257952
  */
  return ['a', 'e', 'i', 'o', 'u'].indexOf(char.toLowerCase()) !== -1
}

function Ship(props) {
  const enemyImgUrl = 'https://live.staticflickr.com/65535/50724769872_da72a3fd7c_t.jpg';
  const allyImgUrl = 'https://live.staticflickr.com/65535/50724684336_aaa14d5649_t.jpg';

  if (!props.isAlly && props.isAlive) {  // is living enemy
    return (
      // enemy ships have lasers below them
      <div className="ship">
        <img
          src={ props.isAlly ? allyImgUrl : enemyImgUrl }
        />
        <Laser isAlly={false} laserState={props.state} />
      </div>
    );  
  } else if (props.isAlive === true) {  // is living ally
    return (
      <div className="ship">
        <Laser isAlly={true} laserState={props.state} />
        <img
          src={ props.isAlly ? allyImgUrl : enemyImgUrl }
        />
      </div>
    );
  } else {  // ship has been destroyed
    // render an empty div with the ship's size
    return (
      <div className="ship"></div>
    )
  }
}

function Laser(props) {  
  // url variables
  const allyChargingLaserUrl = 'https://live.staticflickr.com/65535/50723947808_35ba1cd9e7_o.png';
  const allyFiringLaserUrl = 'https://live.staticflickr.com/65535/50724684431_e854d32aa9_o.png';
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
    <Ship isAlly={ship.isAlly()} isAlive={ship.isAlive()} state={ship.getState()} key={ship.getId()} />
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
    this.ally = isAlly;

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

  isAlly() {
    return this.ally;
  }

  isAlive() {
    return this.alive;
  }

  destroy() {
    this.alive = false;
  }

  print() {
    console.log('\tid:', this.getId());
    console.log('\tisAlly:', this.isAlly());
    console.log('\tlane:', this.getLane());
    console.log('\tstate:', this.getState());
    console.log('\talive:', this.isAlive());
  }

  advanceState() {
    if (this.state === 'idle') {
      this.state = 'charging';
    } else if (this.state === 'charging') {
      this.state = 'firing';
    } else {
      this.state = 'idle';
    }

    return this.state;
  }

  retire() {
    this.state = 'retired';
  }
}

function getLaneFromShipId(shipId, isAlly) {
  /*
  takes a shipId string and optional bool isAlly for efficiency; returns the int lane number
  */
  // if allegiance isn't known; get it by parsing the ID
  if (typeof isAlly !== 'boolean') {
    isAlly = shipId.includes('ally') ? true : shipId.includes('enemy') ? false : 'ERROR';

    if (isAlly === 'ERROR') {
      console.log('Error parsing ship ID:', shipId);
      return
    }
  } 

  // get allegiance prefix and split the lane number off from the ID
  const idPrefix = isAlly ? 'ally' : 'enemy';
  const lane = shipId.split(idPrefix)[1];
  return parseInt(lane);
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

    this.maxColumns = maxColumns;
    this.allLanes = Array.from(new Array(maxColumns).keys());
    this.tickMs = 8000;  // Ticks every 10 seconds. Affects how long player has to type a new word
    this.laserFireMs = Math.floor(this.tickMs / this.tickMs * 1000);  // MUST be shorter than tickMs. Affects sfx and delay to remove beam img
    this.isAtGameEnd = false;

    this.state = this.getInitialState();

    this.handleInputChange = this.handleInputChange.bind(this);
    this.tick = this.tick.bind(this);
    this.advanceShipState = this.advanceShipState.bind(this);
    this.fireAllChargingShips = this.fireAllChargingShips.bind(this);
    this.getLetterInLane = this.getLetterInLane.bind(this);
    this.projectLaserTarget = this.projectLaserTarget.bind(this);
    this.laneToId = this.laneToId.bind(this);
    this.destroyShip = this.destroyShip.bind(this);
    this.getOppositeShip = this.getOppositeShip.bind(this);
    this.fireLaser = this.fireLaser.bind(this);
    this.haltLaser = this.haltLaser.bind(this);
    this.checkEndGame = this.checkEndGame.bind(this);
    this.getInitialState = this.getInitialState.bind(this);
    this.reinitializeState = this.reinitializeState.bind(this);
    this.replayPrompt = this.replayPrompt.bind(this);
  }
  
  getInitialState() {
    /*
    returns an object with spankin-new versions of the variables used in state
    */
    // track ship objects, keyed by ship ID
    this.initialAllyShips = {};
    this.initialEnemyShips = {};
    for (const lane of this.allLanes.values()) {
      // add an ally ship
      let newAlly = new ShipObject(true, lane);  // TODO: can use const?
      this.initialAllyShips[newAlly.getId()] = newAlly;

      // add an enemy ship
      let newEnemy = new ShipObject(false, lane);  // TODO: can use const?
      this.initialEnemyShips[newEnemy.getId()] = newEnemy;
    }

    // track ID number of each ship in a given state, for convenience and efficiency elsewhere. Updated by advanceShipState
    this.initialAllyShipStates = {
        firingShips: [],
        chargingShips: [],
        idleShips: Array.from(Object.keys(this.initialAllyShips))  // keyed by ID
    };

    this.initialEnemyShipStates = {
        firingShips: [],
        chargingShips: [],
        idleShips: Array.from(Object.keys(this.initialEnemyShips))  // keyed by ID
    };

    return {
      input: 'begin',
      allyShips: this.initialAllyShips,
      enemyShips: this.initialEnemyShips,
      allyShipStates: this.initialAllyShipStates,
      enemyShipStates: this.initialEnemyShipStates
    };
  }

  reinitializeState() {
    /*
    reinitializes state variables
    */
    this.setState(this.getInitialState());
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

  getLetterInLane(lane) {
    /*
    returns the string letter in a given int lane
    */
    // validate given lane
    if (typeof lane !== 'number') {
      console.log('Error: expected lane to be type number, but got', typeof lane);
      return;
    } else if (lane >= this.allLanes.length || lane < 0) {
      console.log('Error: out of bounds lane given to getLetterInLane');
    }

    // get the letter
    const letter = this.state.input[lane];
    return letter;
  }

  getOppositeShip(lane, isAlly) {
    /*
    takes an int lane and bool isAlly; returns a reference to the other ship in its lane
    */
    const oppositeShipId = this.laneToId(lane, !isAlly);
    const oppositeGroup = isAlly ? 'enemyShips' : 'allyShips';
    const oppositeShip = this.state[oppositeGroup][oppositeShipId];

    return oppositeShip;
  }

  projectLaserTarget(lane, isAlly) {
    /*
    takes an int lane and bool isAlly; returns a string showing the first thing it collides with
    */
    // collides with consonant?
    const letter = this.getLetterInLane(lane)
    if (letter && ! isVowel(letter)) {
      return 'consonant';
    }

    // collides with other's simultaneously fired laser?
    const oppositeShip = this.getOppositeShip(lane, isAlly);
    if (oppositeShip.state === 'firing') {
      return 'otherBeam';
    }

    // collides with enemy ship?
    if (oppositeShip.isAlive()) {
      return 'otherShip';
    }

    // passes through the lane with no collision?
    return 'empty';
  }

  haltLaser(ship) {
    /*
    takes a reference to a ship object and disables its laser 
      by removing it from the pool of idle or charging lasers
    */
    // get allegiance-specific array
    let laneStateArray;
    if (ship.isAlly()) {
      laneStateArray = 'allyShipStates';
    } else {
      laneStateArray = 'enemyShipStates';
    }

    // get state-specific array
    let oldStateGroup;
    if (ship.getState() === 'idle') {
      oldStateGroup = 'idleShips';
    } else if (ship.getState() === 'charging') {
      oldStateGroup = 'chargingShips';
    } else {
      oldStateGroup = 'firingShips';
    }

    // now we know which lane state array to remove from, so get the index of this ship
    const removalIndex = this.state[laneStateArray][oldStateGroup].indexOf(ship.getId());

    // make copies of lane state arrays
    let oldStateGroupArray = this.state[laneStateArray][oldStateGroup];

    // change the copy array
    oldStateGroupArray.splice(removalIndex, 1);

    // set the Game state by replacing lane state array with the updated copy
    this.setState({ [[laneStateArray][oldStateGroup]]: oldStateGroupArray });
  }

  replayPrompt() {
    // check for end of game
    const endGameCondition = this.checkEndGame();
    if (endGameCondition) {
      // stop the main loop; game is finished
      clearInterval(this.timerID);
  
      // check for win/lose
      let resultMessage;
      if (endGameCondition === 'win') {
        resultMessage = 'Win!';
      } else if (endGameCondition === 'lose') {
        resultMessage = 'It\'s ok\, try again!';
      } else if (endGameCondition === 'tie') {
        resultMessage = 'Tie, pretty good.';
      }
      if (this.isAtGameEnd === false) {
        this.isAtGameEnd = true;

        const input = prompt(resultMessage + ' Press y to play again');

        if (input === 'y') {
          window.location = 'https://gelafin.github.io/laser-lanes/';  // temp, just reload the page to reset

          /* OPTION B reinitializing the state vars works 100%, but there are bugs afterwards. Had "isGameRestarting" returns up to tick() and returned before setState(), but the new tick() just used some of the old state anyway
          this.reinitializeState();
        
          // begin main game loop
          this.timerID = setInterval(
            () => this.tick(),
            this.tickMs
          );
          */
        }
      }
    }
  }

  destroyShip(ship) {
    /*
    takes a reference to a ship object and destroys that ship
    */
    this.sfx.explosion.play().catch(()=>{console.log('\tERROR: explosion audio play() promise rejected. Click into the text box--or else this is localhost');});

    // set .isAlive to false so ship remains as a tombstone
    ship.destroy();

    // disable its laser
    this.haltLaser(ship);
  }

  laneToId(lane, isAlly) {
    /**/
    return isAlly ? 'ally' + lane : 'enemy' + lane;
  }

  fireLaser(shipObject) {
    /*
    takes a *firing* ship object and fires the laser, hitting whatever is first in its lane
    if a ship is hit, that ship is destoyed, and the victorious ship's laser is retired (disabled)
    */
    // prepare convenience variables
    const shipId = shipObject.getId();
    const lane = shipObject.getLane();
    const isAlly = shipObject.isAlly();

    // determine laser target
    const target = this.projectLaserTarget(lane, isAlly);
    let disabledLaser = false;

    // process consequences of laser hitting the target
    if (target === 'consonant') {
      // blocked by consonant
    } else if (target === 'empty') {
      // passes through an empty lane
    } else if (target === 'otherShip' || target === 'otherBeam') {
      // destroy other ship
      const oppositeShip = this.getOppositeShip(lane, isAlly);
      this.destroyShip(oppositeShip);

      disabledLaser = true;
    }

    // play the sound effect
    this.sfx.firingLaser.play().catch(()=>{console.log('\tERROR: firingLaser audio play() promise rejected. Click into the text box--or else this is localhost');});

    // done firing the laser; delay resetting state to idle for a few seconds to let player see it was fired
    setTimeout(() => {
      if (!disabledLaser) {
        console.log('\t\tsetting it back to idle');
        this.advanceShipState(shipId);
      } else {
        console.log('\t\tretiring it from idle ships now');
        this.haltLaser(shipObject);
  
        // update the object in props for the children
        // get allegiance-specific variables
        let shipObjects;
        if (shipId.includes('ally')) {  // if it's an ally ship
          shipObjects = 'allyShips';
        } else {  // it's an enemy ship
          shipObjects = 'enemyShips';
        }
        /*
        ======================== 
        Update ship object state array 
        ======================== 
        */
        let newShipObjects = {...this.state[shipObjects]};
        newShipObjects[shipId].retire();
        this.setState({ [shipObjects]: newShipObjects });
      }
    }, this.laserFireMs);
  }

  fireAllChargingShips() {
    /* 
    advances states of all charging ships to firing and processes consequences of laser strikes
    */
    for (const lane of this.allLanes) {
      const allyId = this.laneToId(lane, true);
      const enemyId = this.laneToId(lane, false);
      const allyShip = this.state.allyShips[allyId];
      const enemyShip = this.state.enemyShips[enemyId];
      
      if (allyShip.getState() !== 'charging' && enemyShip.getState() !== 'charging') {
        continue;  // nothing to do here; neither ship is charging!
      } else if (allyShip.getState() === 'charging' && enemyShip.getState() !== 'charging') {
        // only ally is charging

        // advance state to firing
        this.advanceShipState(allyId);
        this.fireLaser(allyShip);
      } else if (enemyShip.getState() === 'charging' && allyShip.getState() !== 'charging') {
        // only enemy is charging

        // advance state to firing
        this.advanceShipState(enemyId);
        this.fireLaser(enemyShip);

      } else {
        // process both; laser collision
        this.advanceShipState(allyId);  // advance state to firing
        this.advanceShipState(enemyId);  // advance state to firing
        this.fireLaser(allyShip);
        this.fireLaser(enemyShip);
      }
    }
  }

  checkEndGame() {
    /*
    checks for win or loss; returns 'win' or 'lose' if game is over or else null
    */
    // if all allies (or enemies, can check either) have a dead opposite ship, 
    // count living allies vs living enemies and decide result
    let allyCount = 0;
    let enemyCount = 0;
    for (const lane of this.allLanes) {
      const allyId = this.laneToId(lane, true);
      const enemyId = this.laneToId(lane, false);
      const allyShip = this.state.allyShips[allyId];
      const enemyShip = this.state.enemyShips[enemyId];

      // if any lane still has two living ships, game is not over yet
      if (allyShip.isAlive() && enemyShip.isAlive()) {
        return null;
      }

      // keep a count of living allies
      if (allyShip.isAlive()) {
        allyCount++;
      }

      // keep a count of living enemies
      if (enemyShip.isAlive()) {
        enemyCount++;
      }
    }

    // the game is over. Count ships to decide winner
    if (allyCount > enemyCount) {
      return 'win';
    } else if (allyCount < enemyCount) {
      return 'lose';
    } else {
      return 'tie';
    }
  }

  tick() {
    console.log('----- ticking -----');
    
    this.fireAllChargingShips();
    
    this.replayPrompt();

    if (this.isAtGameEnd === true) {
      return;
    }

    this.setState((state) => {

      // advance the state of 1 random idle laser per side to charging
      // get random indices for lane states arrays
      const randomIdleAllyIndex = randomInt(0, state.allyShipStates.idleShips.length);
      const randomIdleEnemyIndex = randomInt(0, state.enemyShipStates.idleShips.length);

      // use those indices to get a random idle ship's ID
      const randomIdleAllyId = state.allyShipStates.idleShips[randomIdleAllyIndex];
      const randomIdleEnemyId = state.enemyShipStates.idleShips[randomIdleEnemyIndex];

      if (typeof randomIdleAllyId === 'undefined' || typeof randomIdleEnemyId === 'undefined'  ) {
        return;  // for the final tick, when the delayed destroyShip() hasn't been called yet
      }
      
      if (state.allyShips[randomIdleAllyId].isAlive() === false) {
        console.log('********** charging' + randomIdleAllyId + ' even though it\'s dead');
      } else if (state.enemyShips[randomIdleEnemyId].isAlive() === false) {
        console.log('********** charging' + randomIdleAllyId + ' even though it\'s dead');
      } else {
        console.log('***** charging' + randomIdleAllyId + ' and ' + randomIdleEnemyId);
      }

      // advance the states from idle to charging
      this.advanceShipState(randomIdleAllyId);
      this.advanceShipState(randomIdleEnemyId);

      // play charging sound effect
      this.sfx.chargingLaser.play().catch(()=>{console.log('\tERROR: chargingLaser audio play() promise rejected. Click into the text box--or else this is localhost');});

    }, ()=>{console.log(' > finished tick setState! Best to call advanceShipState here');});
  }
  
  componentDidMount() {
    // popup with start button (TODO: make it a real popup)
    alert('Laser Lanes\n\n' + 'Lasers fire automatically every ' + Math.floor(this.tickMs / 1000) + ' seconds. Lasers are blocked by consonants but pass through vowels, so please type words that will win');

    // begin main game loop
    this.timerID = setInterval(
      () => this.tick(),
      this.tickMs
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
    if (this.timerID) {
      clearInterval(this.timerID);
    }
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
