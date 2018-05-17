/* Welcome to Customizable Calendar. This was inspired (and some sections of
 * code were lifted in their entiriety) from the 'Basic weather and date script'
 * written by DXWarlock and posted on the Roll20 forums.
 * https://app.roll20.net/forum/post/905530/basic-weather-and-date-script

 * Weather tables for Chult are taken from 'Many Faces of Chult' from Bear
 * Digital. I have not implemented a way to switch back and forth to Monsoon...
 * Tables have been modified slightly for wording
 * http://bear-digital.com/random-faces-of-chult/

 * The script tracks the current date using a character sheet called
 * CalendarPC. If the sheet doesn't exist, it creates one. Weather is selected
 * based on a weighted table below. When the commands are issued, a new
 * weather is rolled and sent to the chat. You can edit the calendar and the
 * weather within the script.
 * Output to chat uses the default roll template.
 */

/*----------Commands----------*/
/* !currentWeather
 * Get the current date and weather and post it to chat.
 * !newDay
 * Moves the counter forward one day and outputs the date and weather to the
 * chat.
 * !newWeather
 * Roll a new weather and output to the chat. Does not advance the date.
*/

/*----------Calendar----------*/
/* Base is the average temperature in Farenheit for that month.
 * Days is the total number of days in the month. For the Faerûn calendar,
 * all months have 30 days, but I added in festivals between the months.
 * Season should match the seasons in the weather table EXACTLY.
*/
var monthID = [
  {id: 1, Base: 10, Days: 31, Name: 'Hammer', Season: 'Rainy'},
  //Midwinter festival
  {id: 2, Base: 20, Days: 30, Name: 'Alturiak', Season: 'Dry'},
  {id: 3, Base: 40, Days: 30, Name: 'Ches', Season: 'Dry'},
  //Spring Equinox is on Ches 19
  {id: 4, Base: 50, Days: 31, Name: 'Tarsakh', Season: 'Dry'},
  //Greengrass festival
  {id: 5, Base: 60, Days: 30, Name: 'Mirtul', Season: 'Dry'},
  {id: 6, Base: 70, Days: 30, Name: 'Kythorn', Season: 'Dry'},
  //Summer Solstice is on Kythorn 20
  {id: 7, Base: 80, Days: 31, Name: 'Flamerule', Season: 'Dry'},
  //Midsummer festival
  //Shieldmeet every four years, there's a leap year here
  {id: 8, Base: 70, Days: 30, Name: 'Elesia', Season: 'Rainy'},
  {id: 9, Base: 50, Days: 31, Name: 'Eleint', Season: 'Rainy'},
  //Autumn Equinox is on Eleint 21
  //Highharvesttide festival
  {id: 10, Base: 35, Days: 30, Name: 'Marpenoth', Season: 'Rainy'},
  {id: 11, Base: 25, Days: 31, Name: 'Uktar', Season: 'Rainy'},
  //Feast of the Moon festival
  {id: 12, Base: 15, Days: 30, Name: 'Nightal', Season: 'Rainy'}
  //Winter Solstice is on Nightal 20
];
//number of years after which a leap year occurs
var leapYear = 4;
//id of the month that leap day occurs on
var leapMonth = 7;
/*----------Holidays----------*/
/*List any holidays here.
*/
var holidayID = [
  {id: 1, Month: 1, Day: 31, Name: 'Midwinter Festival'},
  {id: 2, Month: 3, Day: 19, Name: 'Spring Equinox'},
  {id: 3, Month: 4, Day: 31, Name: 'Greengrass Festival'},
  {id: 4, Month: 6, Day: 20, Name: 'Summer Solstice'},
  {id: 5, Month: 7, Day: 31, Name: 'Midsummer Festival'},
  {id: 6, Month: 7, Day: 32, Name: 'Shieldmeet'},//if the month is 6 and the year is divisible by 4, add 1 to maxDay when rolling over
  {id: 7, Month: 9, Day: 21, Name: 'Autumn Equinox'},
  {id: 8, Month: 9, Day: 31, Name: 'Highharvesttide Festival'},
  {id: 9, Month: 11, Day: 31, Name: 'Feast of the Moon Festival'},
  {id: 10, Month: 12, Day: 20, Name: 'Winter Solstice'}
];

/*----------Weather Table----------*/
/* Each section is a season. The numbers are the weight. Higher numbers mean
 * that weather comes up more often. Included on the table are seasons for
 * Chult. Sections for Winter, Spring, Summer, and Fall are included, but not
 * filled out.
 * Feel free to add your own sections as well.
*/
var event = function(freq, msg) {
    return {message: msg, frequency: freq};
};
var weatherTable = {
  Dry: [
    event(12, 'Misty - A low mist hangs in the air that limits vision to a maximum of 150 ft. for everything of large size and smaller. Any such target is assumed to have total cover while anything huge or larger past this range is considered to have three-quarters cover. Any Survival(wisdom) check made to navigate through the mist has disadvantage.'),
    event(6, 'Heavy Mist - A thick almost tangible mist drowns out any vision past 15ft. for everything large and smaller, with anything huge or larger only being visible up to 30ft. away. All sight based abilities outside of the 15ft. range are at disadvantage and all creatures and objects outside of that range are assumed to have total cover. This disadvantage cannot be negated and also applies to navigation unless the DM specifically allows you to.'),
    event(25, 'Dry and Sunny - These days are rare and should be enjoyed.'),
    event(25, 'Sunny with Rain Showers - Smaller localised rain clouds fill the skies, leaving the days filled both with rain and rainbows. There will be a 1 in 3 chance of it currently being dry on the character’s position.'),
    event(20, 'Rainy - A sheet of rain falls over the land, creating a damp but slightly cosy atmosphere while walking under the massive trees of the jungle. Though the humidity rises most places within the jungle are still relatively dry due to the thick canopy catching most of the rain.'),
    event(5, 'Heavy Rain - Rain and wind tear at the trees and pour down on any poor adventurer out to test their luck. Any Wisdom(perception) checks beyond 150ft. become blurred and are at disadvantage except for anything that’s huge or larger. Any creature outside of this range that is large or smaller gains the benefits of three-quarters cover and missile weapons ranges are halved.'),
    event(2, 'Tropical Storm - The sky darkens as lighting, rain and mayhem rain down from above while the wind tears the trees away from the earth itself. Rivers swell and rage through the jungle, preventing any form of travel by boat. Any guide worth their salt knows that the best choice is to hunker down and wait out the storm, but there are always those foolish enough to think they can test mother nature. Anyone braving the storm immediately gains a level of exhaustion and must make a DC 10 Constitution saving throw at the end of the day to prevent weariness from setting in. On top of the attributes of “Heavy Rain” all characters are also at disadvantage for making Wisdom(survival) checks to navigate.'),
    event(2, 'Extremely Warm and Rainy - The heat rises to 35°C and above making movement cumbersome. Any character that decides to travel long distances during these days gets a level of exhaustion.'),
    event(2, 'Extremely Warm and Dry - The heat rises to 35°C and above making movement cumbersome. Any character that decides to travel long distances during these days gets a level of exhaustion. Characters will need to actively prevent being dehydrated throughout the day.')
  ],
  Rainy: [
    event(12, 'Misty - A low mist hangs in the air that limits vision to a maximum of 150 ft. for everything of large size and smaller. Any such target is assumed to have total cover while anything huge or larger past this range is considered to have three-quarters cover. Any Survival(wisdom) check made to navigate through the mist has disadvantage.'),
    event(6, 'Heavy Mist - A thick almost tangible mist drowns out any vision past 15ft. for everything large and smaller, with anything huge or larger only being visible up to 30ft. away. All sight based abilities outside of the 15ft. range are at disadvantage and all creatures and objects outside of that range are assumed to have total cover. This disadvantage cannot be negated and also applies to navigation unless the DM specifically allows you to.'),
    event(25, 'Dry and Sunny - These days are rare and should be enjoyed.'),
    event(25, 'Sunny with Rain Showers - Smaller localised rain clouds fill the skies, leaving the days filled both with rain and rainbows. There will be a 1 in 3 chance of it currently being dry on the character’s position.'),
    event(20, 'Rainy - A sheet of rain falls over the land, creating a damp but slightly cosy atmosphere while walking under the massive trees of the jungle. Though the humidity rises most places within the jungle are still relatively dry due to the thick canopy catching most of the rain.'),
    event(5, 'Heavy Rain - Rain and wind tear at the trees and pour down on any poor adventurer out to test their luck. Any Wisdom(perception) checks beyond 150ft. become blurred and are at disadvantage except for anything that’s huge or larger. Any creature outside of this range that is large or smaller gains the benefits of three-quarters cover and missile weapons ranges are halved.'),
    event(2, 'Tropical Storm - The sky darkens as lighting, rain and mayhem rain down from above while the wind tears the trees away from the earth itself. Rivers swell and rage through the jungle, preventing any form of travel by boat. Any guide worth their salt knows that the best choice is to hunker down and wait out the storm, but there are always those foolish enough to think they can test mother nature. Anyone braving the storm immediately gains a level of exhaustion and must make a DC 10 Constitution saving throw at the end of the day to prevent weariness from setting in. On top of the attributes of “Heavy Rain” all characters are also at disadvantage for making Wisdom(survival) checks to navigate.'),
    event(2, 'Extremely Warm and Rainy - The heat rises to 35°C and above making movement cumbersome. Any character that decides to travel long distances during these days gets a level of exhaustion.'),
    event(2, 'Extremely Warm and Dry - The heat rises to 35°C and above making movement cumbersome. Any character that decides to travel long distances during these days gets a level of exhaustion. Characters will need to actively prevent being dehydrated throughout the day.'),
    event(2, 'extreme shift')
  ],
  Extreme: [
    event(4, 'Misty - A low mist hangs in the air that limits vision to a maximum of 150 ft. for everything of large size and smaller. Any such target is assumed to have total cover while anything huge or larger past this range is considered to have three-quarters cover. Any Survival(wisdom) check made to navigate through the mist has disadvantage.'),
    event(8, 'Heavy Mist - A thick almost tangible mist drowns out any vision past 15ft. for everything large and smaller, with anything huge or larger only being visible up to 30ft. away. All sight based abilities outside of the 15ft. range are at disadvantage and all creatures and objects outside of that range are assumed to have total cover. This disadvantage cannot be negated and also applies to navigation unless the DM specifically allows you to.'),
    event(6, 'Sunny with Rain Showers - Smaller localised rain clouds fill the skies, leaving the days filled both with rain and rainbows. There will be a 1 in 3 chance of it currently being dry on the character’s position.'),
    event(30, 'Rainy - A sheet of rain falls over the land, creating a damp but slightly cosy atmosphere while walking under the massive trees of the jungle. Though the humidity rises most places within the jungle are still relatively dry due to the thick canopy catching most of the rain.'),
    event(25, 'Heavy Rain - Rain and wind tear at the trees and pour down on any poor adventurer out to test their luck. Any Wisdom(perception) checks beyond 150ft. become blurred and are at disadvantage except for anything that’s huge or larger. Any creature outside of this range that is large or smaller gains the benefits of three-quarters cover and missile weapons ranges are halved.'),
    event(10, 'Tropical Storm - The sky darkens as lighting, rain and mayhem rain down from above while the wind tears the trees away from the earth itself. Rivers swell and rage through the jungle, preventing any form of travel by boat. Any guide worth their salt knows that the best choice is to hunker down and wait out the storm, but there are always those foolish enough to think they can test mother nature. Anyone braving the storm immediately gains a level of exhaustion and must make a DC 10 Constitution saving throw at the end of the day to prevent weariness from setting in. On top of the attributes of “Heavy Rain” all characters are also at disadvantage for making Wisdom(survival) checks to navigate.'),
    event(2, 'Extremely Warm and Rainy - The heat rises to 35°C and above making movement cumbersome. Any character that decides to travel long distances during these days gets a level of exhaustion.'),
    event(15, 'extreme shift')
  ],
  Winter: [
    event(1, 'create some weather here'),
    event(1, 'weather line 2')
  ],
  Spring: [
    event(1, 'create some weather here'),
    event(1, 'weather line 2')
  ],
  Fall: [
    event(1, 'create some weather here'),
    event(1, 'weather line 2')
  ],
  Summer: [
    event(1, 'create some weather here'),
    event(1, 'weather line 2')
  ]
}

/*----------Script----------*/
// When the script is loaded, find or create CalendarPC, check to make sure the current max month and season are accurate
on('ready', function () {
  log ('/----------Welcome to Faerûn. CalendarPC is loading...----------/');
  var existingCalendar = findObjs ({
    _type: 'character',
    name: 'CalendarPC'
  })[0];
  //if the sheet doesn't exist, create it and give it all necessary attributes
  //fill the sheet with values from the monthID table
  if(!existingCalendar) {
    createObj ('character', {
      name: 'CalendarPC',
    });
    var newCalendar = findObjs ({
      _type: 'character',
      name: 'CalendarPC'
    })[0];
    var initialFill = _.find(monthID, function (obj) { return obj.id === 1;});
    createObj ('attribute', {
      name: 'Day',
      current: 1,
      max: initialFill.Days,
      characterid: newCalendar.id
    });
    createObj ('attribute', {
      name: 'Month',
      current: 1,
      max: monthID.length,
      characterid: newCalendar.id
    });
    createObj ('attribute', {
      name: 'Year',
      current: 1493,
      characterid: newCalendar.id
    });
    createObj ('attribute', {
      name: 'Season',
      current: initialFill.Season,
      max: initialFill.Name,//name of the month will go here
      characterid: newCalendar.id
    });
    createObj ('attribute', {
      name: 'Description',
      current: 'The skies are calm. It is a good day for travel.',
      characterid: newCalendar.id
    });
    createObj ('attribute', {
      name: 'Extreme',
      current: false,
      characterid: newCalendar.id
    });
    log ('CalendarPC sheet created. Character ID is: ' + newCalendar.id);
  } else {
    log ('CalendarPC sheet already exists. Character ID is: ' + existingCalendar.id);
    var monthAttribute = findObjs ({
      _type: 'attribute',
      name: 'Month',
      _characterid: existingCalendar.id
    }, {caseInsensitive: true}) [0];
    var seasonAttribute = findObjs ({
      _type: 'attribute',
      name: 'Season',
      _characterid: existingCalendar.id
    }, {caseInsensitive: true}) [0];
    var currentMonth = parseInt(monthAttribute.get('current'));
    if (currentMonth > monthID.length) {
      currentMonth = 1;
      monthAttribute.set('current', currentMonth);
    }
    var checkMax = _.find(monthID, function (obj) { return obj.id === currentMonth;});
    monthAttribute.set('max', monthID.length);
    seasonAttribute.set('current', checkMax.Season);
    seasonAttribute.set('max', checkMax.Name);
  }
});

//Chat commands to access the script.
on('chat:message', function (msg) {
//find current date and weather
  var msgTxt = msg.content
  var existingCalendar = findObjs ({
    _type: 'character',
    name: 'CalendarPC'
  }, {caseInsensitive: true}) [0];
  var dayAttribute = findObjs ({
    _type: 'attribute',
    name: 'Day',
    _characterid: existingCalendar.id
  }, {caseInsensitive: true}) [0];
  var monthAttribute = findObjs ({
    _type: 'attribute',
    name: 'Month',
    _characterid: existingCalendar.id
  }, {caseInsensitive: true}) [0];
  var yearAttribute = findObjs ({
    _type: 'attribute',
    name: 'Year',
    _characterid: existingCalendar.id
  }, {caseInsensitive: true}) [0];
  var seasonAttribute = findObjs ({
    _type: 'attribute',
    name: 'Season',
    _characterid: existingCalendar.id
  }, {caseInsensitive: true}) [0];
  var descriptionAttribute = findObjs ({
    _type: 'attribute',
    name: 'Description',
    _characterid: existingCalendar.id
  }, {caseInsensitive: true}) [0];
  var extremeAttribute = findObjs ({
    _type: 'attribute',
    name: 'Extreme',
    _characterid: existingCalendar.id
  }, {caseInsensitive: true}) [0];
  var currentDay = parseInt(dayAttribute.get('current'));
  var currentMonth = parseInt(monthAttribute.get('current'));
  var currentYear = parseInt(yearAttribute.get('current'));
  var currentSeason = seasonAttribute.get('current');
  var currentDescription = descriptionAttribute.get('current');
  var maxDay = parseInt(dayAttribute.get('max'));
  var maxMonth = parseInt(monthAttribute.get('max'));
  var monthName = seasonAttribute.get('max');
  var fullDate = currentDay + ' ' + monthName + ', ' + currentYear + ' PA';
  var extremeToggle = extremeAttribute.get('current');
  //function to roll a new weather
  function whatsTheWeather() {
    // variable to pick a random event from an array of events, respecting the weights of the events.
    var resolve = function(table) {
      var total = 0;
      for (i in table) {
        total += table[i].frequency;
      }
      var roll = randomInteger(total);
      for (i in table) {
        roll -= table[i].frequency;
        if (roll <= 0) {
          return table[i].message;
        }
      }
    }
    //check if the extremeToggle is TRUE; if so, roll on Extreme weather table
    if (Boolean(extremeToggle)) {
      var newDescription = resolve(weatherTable['Extreme']);
      log('rolling xxxxxtreeeeem weather');
    } else {
      newDescription = resolve(weatherTable[currentSeason]);
    }
    //check to see if extreme switch was rolled for weatherTable
    while (newDescription === 'extreme shift') {
      extremeToggle = !extremeToggle;
      extremeAttribute.set('current', extremeToggle);
      log('toggling extreme weather on/off');
      if (Boolean(extremeToggle)) {
        var newDescription = resolve(weatherTable['Extreme']);
      } else {
        newDescription = resolve(weatherTable[currentSeason]);
      }
    }
    descriptionAttribute.set('current', newDescription);
    currentDescription = newDescription;
    }
  //log function for debugging in console
  function consoleWeatherLog(whatCalled) {
    log('/==========/ ' + whatCalled + ' was called. /==========/');
    log(currentSeason + '//' + currentDay + '/' + currentMonth + '/' + currentYear)
  }
  //chat function using default roll template
  function dateWeatherToChat(chatTitle) {
    //look up Holidays
    var checkHolidays = _.findWhere(holidayID, {'Month': currentMonth, 'Day': currentDay});
    //send it all to chat
    if (checkHolidays === undefined) {
      sendChat('', '/direct ' + '&{template:default} {{name=' + chatTitle + '}} {{Dx=' + fullDate + '}} {{Season=' + currentSeason + '}} {{Weather=' + currentDescription + '}}');
    } else {
      var currentHoliday = checkHolidays.Name;
      sendChat('', '/direct ' + '&{template:default} {{name=' + chatTitle + '}} {{Dx=' + fullDate + '}} {{Season=' + currentSeason + '}} {{Holiday=' + currentHoliday + '}} {{Weather=' + currentDescription + '}}');
    }
  }
  //!currentWeather - send a message to chat with current date and weather
  if (msg.type == 'api' && msgTxt.indexOf ('!currentWeather') !== -1) {
    dateWeatherToChat('Current Weather');
    consoleWeatherLog('currentWeather');
  }
  //!newDay - roll over to a new day, roll a new weather and post to chat
  //if necessary, roll over a new month, season, and year
  if (msg.type == 'api' && msgTxt.indexOf ('!newDay') !== -1) {
    dayAttribute.set('current', currentDay + 1);
    if (currentDay >= maxDay) {//roll over month and reset day to 1
      dayAttribute.set('current', 1);
      monthAttribute.set('current', currentMonth + 1);
      if (currentMonth >= maxMonth) {//roll over year and reset month to 1
        monthAttribute.set('current', 1);
        yearAttribute.set('current',currentYear + 1);
        currentYear = parseInt(yearAttribute.get('current'));
      }
      currentMonth = parseInt(monthAttribute.get('current'));
      var newMonth = _.find(monthID, function (obj) { return obj.id === currentMonth;});
      if (currentYear % leapYear === 0 && currentMonth === leapMonth) {//check for leap year
        dayAttribute.set('max', newMonth.Days + 1);
      } else {
        dayAttribute.set('max', newMonth.Days);
      }
      seasonAttribute.set('current', newMonth.Season);
      seasonAttribute.set('max', newMonth.Name);
      monthName = seasonAttribute.get('max');
    }
    currentDay = parseInt(dayAttribute.get('current'));
    fullDate = currentDay + ' ' + monthName + ', ' + currentYear + ' PA';
    whatsTheWeather();
    dateWeatherToChat('A New Day Has Dawned!');
    consoleWeatherLog('newDay');
  }
  //!newWeather - roll a new weather, post the current date and weather to chat
  if (msg.type == 'api' && msgTxt.indexOf ('!newWeather') !== -1) {
    whatsTheWeather();
    dateWeatherToChat('New Weather Rolling In...');
    consoleWeatherLog('newWeather');
  }
});
