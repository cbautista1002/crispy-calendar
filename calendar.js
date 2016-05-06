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


// ----------------------------------------------------------------------------
// Function called on load of html page
// ----------------------------------------------------------------------------
function initialize() {

  setDate();
  getEvents();

}


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

  $('#date-placeholder').html(`${day}, ${month} ${date}`);
}


function getEvents(){

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


function processEvents(eventsObj){
  var idCounter = 0;
  $.each(eventsObj.items, function(index, event){
    if((event.start_time === '12:00AM') && (event.end_time === '11:59PM')){
      ALL_DAY_EVENTS.push(event);
      event.id = idCounter;
    }
    else{
      event.startI = TIME_MAPPING[event.start_time];
      event.endI = TIME_MAPPING[event.end_time];
      event.id = idCounter;
      ID_TO_NEIGHBORS[event.id] = [event.id];
      ALL_TIMED_EVENTS.push(event);
    }
    idCounter++;
  });
  calculateOverlaps();
}


function calculateOverlaps(){

  $.each(ALL_TIMED_EVENTS, function(eventIndex, event){
    console.log(event);
    for(var i = event.startI; i < event.endI; i++){
      if(!TIME_SLOT_USAGE[i]){
        TIME_SLOT_USAGE[i] = [event];
      }
      else{
        // for(var j = 0; j < TIME_SLOT_USAGE[i].length; j++){
        //   e = TIME_SLOT_USAGE[i][j];
        //   if($.inArray(event.id, ID_TO_NEIGHBORS[e.id]) == -1){
        //     ID_TO_NEIGHBORS[e.id].push(event.id);
        //   }
        // }
        TIME_SLOT_USAGE[i].push(event);
      }
      for(var j = 0; j < TIME_SLOT_USAGE[i].length; j++){
        e = TIME_SLOT_USAGE[i][j];
        console.log(e);
        if($.inArray(event.id, ID_TO_NEIGHBORS[e.id]) == -1){
          ID_TO_NEIGHBORS[e.id].push(event.id);
          ID_TO_NEIGHBORS[event.id].push(e.id);
          console.log('pushed');
        }
      }
    }

  });
  console.log(TIME_SLOT_USAGE);
  console.log(ID_TO_NEIGHBORS);
}


function renderEvents(){
  renderAllDayEvents();
  renderTimedEvents();
}


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
              <div class="col-sm-12 topRowClass">
                <div class="all-day-event borderClass paddingClass">
                  ${event.title}
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


function renderTimedEvents(){

  let timeCode = '';

  // keep track of drawn boxes for shifts
  let usedColumns = [];

  // offset per id if needed
  let idOffsets = {};

  $.each(TIMES_SLOTS, function(index, timeSlot){

    let hour = '';
    let halfHour = '';
    let hourBorder = '';
    let halfhourBorder = '';
    let halfHourLBorder = '';

    // On the hour
    if(index % 2 === 0){
      hour = timeSlot.substring(0, timeSlot.length-2);
      hourBorder = 'hour-border';
    }
    // On the half hour
    else{
      halfHour = timeSlot.substring(0, timeSlot.length-2);
      halfhourBorder = 'half-hour-border';
      halfHourLBorder = 'half-hour-light-border';
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
        <div class="col-sm-10 ${halfHourLBorder}">
          <div class="row event-detail-row">
    `;

    // if 1 event then col=10
    // if 2 event then col=10/2'
    var num = TIME_MAPPING[timeSlot];
    var parallel = 0;
    var offset = 0;

    // for this timeslot, lets find future overlaps that impact this timeslots width
    if(TIME_SLOT_USAGE[num]){
      parallel = 0;
      $.each(TIME_SLOT_USAGE[num], function(i, e){
        if(ID_TO_NEIGHBORS[e.id].length > parallel){
          parallel = ID_TO_NEIGHBORS[e.id].length;
          // usedColumns.push(e.id);
        }
        // console.log(timeSlot, parallel);
      });
    }

    // check if an offset is needed
    // console.log(ID_TO_NEIGHBORS);
    if(TIME_SLOT_USAGE[num]){
      console.log('--------timeslot:', num, ' ---- ', usedColumns);
      offset = 0;
      $.each(TIME_SLOT_USAGE[num], function(i, e){
        for(var k = 0; k < ID_TO_NEIGHBORS[e.id].length; k++){
          aNeighborsId = ID_TO_NEIGHBORS[e.id][k];
          console.log('my id', e.id);
          console.log('neighbors list', ID_TO_NEIGHBORS[e.id]);
          console.log('aNeighborsId', aNeighborsId);

          if( ($.inArray(aNeighborsId, usedColumns) > -1)  && (aNeighborsId != e.id) ) {
            console.log('**********here**********');
            if(parallel != ID_TO_NEIGHBORS[e.id].length){
              console.log('**********here2222**********');
              offset = 12/parallel;
              console.log('offset', offset);
            }
            if($.inArray(e.id, usedColumns) > -1){
              console.log('**********here33333**********');
              offset = 12/parallel;
              console.log('offset', offset);
            }
            // if still drawing the same one then offset is 0
            let numCells = e.endI - e.startI;
            count = usedColumns.reduce(function(n, val) {
              return n + (val === e.id);
            }, 0);
            console.log('check:', numCells, count);
            if(numCells >= count){
              offset = 0;
            }
            console.log('--- offset:', offset);
            // console.log('--- idOffsets[e.id]:', idOffsets[e.id]);
          }

        }
        // console.log(timeSlot, parallel);
      });
    }

    var numColsForEvents = 12/parallel;

    // $.each(ALL_TIMED_EVENTS, function(index, event){
    //   if((event.startI <= num) && (event.endI > num)){
    //     test += event.title;
    //   }
    // });

    $.each(TIME_SLOT_USAGE[num], function(i, e){
      if(e.id in idOffsets){
        if(TIME_SLOT_USAGE[num].length == 1){
          offset = 12/ID_TO_NEIGHBORS[e.id].length * idOffsets[e.id];
        }
      }
      idOffsets[e.id] = i;
      let titleToShow = `${timeSlot}-<br>${e.title}<br>${e.location}`;
      let topRowClass = 'topRowClass';
      let paddingClass = 'paddingClass';
      let borderClass = 'borderClass';
      if($.inArray(e.id, usedColumns) > -1){
        titleToShow = '';
        topRowClass = '';
        paddingClass = '';
      }
      timeCode += `
        <div class="col-sm-${numColsForEvents} col-sm-offset-${offset} event-detail-col ${topRowClass}">
          <div class="${paddingClass} ${borderClass}">${titleToShow}</div>
        </div>
      `;
      usedColumns.push(e.id);
    });

    timeCode += `
          </div>
        </div>
      </div>
    `;
  });

  $('#events-col').html(timeCode);

}