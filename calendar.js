var ALL_DAY_EVENTS = [];
var ALL_TIMED_EVENTS = [];
var TIMES_SLOTS = [
  "9:00AM",  "9:30AM",
  "10:00AM", "10:30AM",
  "11:00AM", "11:30AM",
  "12:00PM", "12:30PM",
  "1:00PM",  "1:30PM",
  "2:00PM",  "2:30PM",
  "3:00PM",  "3:30PM",
  "4:00PM",  "4:30PM",
  "5:00PM",  "5:30PM",
  "6:00PM",  "6:30PM",
  "7:00PM",  "7:30PM",
  "8:00PM",  "8:30PM"
];
var TIME_MAPPING = {
  "9:00AM":  0,
  "9:30AM":  1,
  "10:00AM": 2,
  "10:30AM": 3,
  "11:00AM": 4,
  "11:30AM": 5,
  "12:00PM": 6,
  "12:30PM": 7,
  "1:00PM":  8,
  "1:30PM":  9,
  "2:00PM":  10,
  "2:30PM":  11,
  "3:00PM":  12,
  "3:30PM":  13,
  "4:00PM":  14,
  "4:30PM":  15,
  "5:00PM":  16,
  "5:30PM":  17,
  "6:00PM":  18,
  "6:30PM":  19,
  "7:00PM":  20,
  "7:30PM":  21,
  "8:00PM":  22,
  "8:30PM":  23
}
var OVERLAP_INFO = {};
var TIME_SLOT_USAGE = Array(24).fill(null);
var ID_TO_NEIGHBORS = {};


// ------------------------------------------------------
// Function called on load of html page
// ------------------------------------------------------
function initialize() {
  setDate();
  loadEvents();
}


// ------------------------------------------------------
// Calculate and display the day, month and date
// ------------------------------------------------------
function setDate(){
  weekdays = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
  ]
  months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER"
  ]

  let curDate = new Date();
  let day = weekdays[curDate.getDay()];
  let month = months[curDate.getMonth()];
  let date = curDate.getDate();

  $('#day-date').html(`${day}, ${month} ${date}`);
}


// ------------------------------------------------------
// Load the events from the server
// ------------------------------------------------------
function loadEvents(){

  $.ajax({
    type: 'get',
    url:  '/events.json',

    success: function(data){
      processEvents(data);
      renderEvents();
    },

    error: function(data, text_status, error_thrown){
      console.error('ERROR: ', data, '\n', text_status, '\n', error_thrown);
    }

  });

}


// ------------------------------------------------------
// Look through the events and save them into data containers
// ------------------------------------------------------
function processEvents(eventsObj){

  var idCounter = 0;

  $.each(eventsObj.items, function(index, event){

    // For all day events
    if((event.start_time === '12:00AM') && (event.end_time === '11:59PM')){
      ALL_DAY_EVENTS.push(event);
      event.id = idCounter;
    }

    // For timed events (not all day)
    else{
      event.startI = TIME_MAPPING[event.start_time];
      event.endI = TIME_MAPPING[event.end_time];
      event.id = idCounter;
      ID_TO_NEIGHBORS[event.id] = [];
      ALL_TIMED_EVENTS.push(event);
    }

    idCounter++;

  });

  findNeighbors();

}


// ------------------------------------------------------
// Figure out what neighbors each event has for then
// being able to properly display the columns
// ------------------------------------------------------
function findNeighbors(){

  // Initialize each position with an empty array value
  for(var i = 0; i < TIME_SLOT_USAGE.length; i++){
    TIME_SLOT_USAGE[i] = Array();
  }

  $.each(ALL_TIMED_EVENTS, function(outerI, outerE){

    // Fill in the time slot usage
    for(var i = outerE.startI; i < outerE.endI; i++){
      TIME_SLOT_USAGE[i].push(outerE);
    }

    // Now look for neighbors
    $.each(ALL_TIMED_EVENTS, function(innerI, innerE){

      if(outerE.id == innerE.id){
        return;
      }

      if(((innerE.startI >= outerE.startI) && (innerE.startI < outerE.endI)) ||
         ((outerE.startI >= innerE.startI) && (outerE.startI < innerE.endI)) ){
        ID_TO_NEIGHBORS[outerE.id].push(innerE.id);
        // console.log(`${outerE.title}(${outerE.id}) ${innerE.title}(${innerE.id})`);
      }

    });
  });

  // Update with indirect neighbors
  $.each(ID_TO_NEIGHBORS, function(eventId, nborList){
    let union = [];
    $.each(nborList, function(index, nborId){
      let a = new Set(nborList);
      let b = new Set(ID_TO_NEIGHBORS[nborId]);
      union = new Set([...a, ...b]);
      union = Array.from(union);
      let iToRemove = union.indexOf(parseInt(eventId));
      if (iToRemove > -1) {
        union.splice(iToRemove, 1);
      }
    });
    ID_TO_NEIGHBORS[eventId] = union;
  });

}


// ------------------------------------------------------
// Show all of the events
// ------------------------------------------------------
function renderEvents(){
  renderAllDayEvents();
  renderTimedEvents();
}


// ------------------------------------------------------
// Show only the all day events at the top of the page
// ------------------------------------------------------
function renderAllDayEvents(){

  let allDay = `
    <div class="row">
      <div class="col-sm-1"></div>
      <div class="col-sm-11">
        <div class="row">
          <div class="col-sm-1"></div>
          <div class="col-sm-1"></div>
          <div class="col-sm-10">
  `;

  $.each(ALL_DAY_EVENTS, function(index, event){
    allDay += `
            <div class="row col-wrapping-row">
              <div class="col-sm-12 all-day-row-class event-detail-row">
                <div class="all-day-event border-class padding-class overlay-text">
                  <span class="event-time-span">ALL DAY&#65293;</span>
                  <span class="event-title-span">${event.title}</span>
                  <span class="event-location-span">${event.location}</span>
                </div>
              </div>
            </div>
    `;
  });

  allDay += `
          </div>
        </div>
      </div>
    </div>
  `;

  $('#all-day-div-wrapper').html(allDay);

}


// ------------------------------------------------------
// Show all of the timed events
// ------------------------------------------------------
function renderTimedEvents(){

  let timeCode = '';

  // offset per id if needed
  let idOffsets = {};

  $.each(TIMES_SLOTS, function(index, timeSlot){

    let hour = '';
    let halfHour = '';
    let hourBorder = index % 2 == 0 ? 'hour-light-border' : '';;
    let halfhourBorder = index > 0 ? 'half-hour-border' : '';
    let longBorder = index > 0 ? 'half-hour-light-border' : '';

    // On the hour
    if(index % 2 === 0){
      hour = timeSlot.substring(0, timeSlot.length-2);
    }
    // On the half hour
    else{
      halfHour = timeSlot.substring(0, timeSlot.length-2);
    }

    let test = '';

    let pmStarter = timeSlot == '12:00PM' ? 'pm-first-event-row' : '';

    let eventRow = index < 6 ? 'am-event-row' : 'pm-event-row';

    timeCode += `
      <div class="row ${eventRow} ${hourBorder}" id="${pmStarter}">
        <div class="col-sm-1">
          <div class="time-marker-div hour-div">
            ${hour}
          </div>
        </div>
        <div class="col-sm-1 ${halfhourBorder}">
          <div class="time-marker-div half-hour-div">
            ${halfHour}
          </div>
        </div>
        <div class="col-sm-10 ${longBorder}">
          <div class="row event-detail-row">
    `;

    timeCode += calculateRowContents(timeSlot, idOffsets)

    timeCode += `
        </div>
      </div>
    </div>
    `;

  });

  $('#events-col').html(timeCode);
}


// ------------------------------------------------------
// Show the contents of each timed event row - the
// actual events
// ------------------------------------------------------
function calculateRowContents(timeSlot, idOffsets){

  var num = TIME_MAPPING[timeSlot];
  var parallel = 0;
  var rowCode = '';

  var alreadyShifted = [];
  for(var i = 0; i < TIME_SLOT_USAGE[num].length; i++){
    var offset = 0;
    // Lets draw an event, but first how many neighbors does it have?
    let eventToDraw = TIME_SLOT_USAGE[num][i];
    parallel = ID_TO_NEIGHBORS[eventToDraw.id].length + 1;
    numColsForEvents = 12/parallel;

    // Check if an offset is needed
    if(eventToDraw.id in idOffsets){
      offset = i != 0 ? '0' : numColsForEvents;
      console.log(`offset for ${eventToDraw.title} is ${offset}`);
    }
    // Only add to offset if event is not the first to be drawn for a given row
    if(i > 0){
      TIME_SLOT_USAGE[num].length
      if(!(eventToDraw.id in idOffsets)){
        idOffsets[eventToDraw.id] = i;
      }
      // Add an offset to the top row of an event if its body will be shifted
      var nextIndexForThisEvent = null;
      for(var j = 0; j < TIME_SLOT_USAGE[num+1].length; j++){
        if(TIME_SLOT_USAGE[num+1][j].id == eventToDraw.id){
          nextIndexForThisEvent = j;
        }
      }
      if(nextIndexForThisEvent > i){
        let diff = nextIndexForThisEvent - i;
        if(alreadyShifted.indexOf(i-1) == -1){
          offset = numColsForEvents * diff;
        }
        alreadyShifted.push(i);
        console.log(`nextIndexForThisEvent for ${eventToDraw.title} is ${nextIndexForThisEvent} and i=${i}`);
      }
      // Add an offset if needed to single slot events
      if((eventToDraw.endI - eventToDraw.startI == 1) &&
        (TIME_SLOT_USAGE[num+1].length == TIME_SLOT_USAGE[num].length)){
        offset = numColsForEvents;
        console.log(`offset for ${eventToDraw.title} is ${offset}`);
      }
    }

    let overflowCtrl = '';
    let withBr = '<br>';

    if(eventToDraw.endI - eventToDraw.startI == 1){
      overflowCtrl = 'overflow-ctrl';
      withBr = '';
    }

    let contentToShow = `
      <span class="event-time-span">${eventToDraw.start_time}&#65293;</span>${withBr}
      <span class="event-title-span">${eventToDraw.title}</span>${withBr}
      <span class="event-location-span">${eventToDraw.location}</span>
    `;

    let topRowClass = 'top-row-class';
    let paddingClass = 'padding-class';
    let borderClass = 'border-class';
    if(eventToDraw.startI != num){
      contentToShow = '';
      topRowClass = '';
      paddingClass = '';
    }

    rowCode += `
          <div class="col-sm-${numColsForEvents} col-sm-offset-${offset} event-detail-col ${topRowClass} ${overflowCtrl}">
            <div class="${paddingClass} ${borderClass} overlay-text overlay-text">
              ${contentToShow}
            </div>
          </div>
    `;
  }
  return rowCode;
}
