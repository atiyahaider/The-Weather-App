const locationAPIKey = 'e4a633a23ec37c';
const darkskyAPIKey = '088dc080e5b6c573fefc7cec1fe324de';
let addressSet = false;
let currentData;
let forecast = [];

$(document).ready(function() {
  //update the date
  $("#date").html(new Date().toLocaleString("en-US", {weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric'}));
    
  //update time every minute
  updateTime();
  setInterval(updateTime, 60000);
  
  getGeoLocation();
});

function getGeoLocation() {
  //get location coords
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      //get readable address
      getAddress(position.coords);
      
      //get current weather
      getWeather(position.coords.latitude + ',' + position.coords.longitude);
    });
  } 
  else {
    alert('Cannot get location. Geolocation is not supported by this browser.');
    console.log('Cannot get location. Geolocation is not supported by this browser.');
  }
}

function getAddress(coords) {
  let url = 'https://us1.locationiq.com/v1/reverse.php?';

  $.ajax({
    url: url,
    method: 'GET',
    data: {
      'key': locationAPIKey,
      'lat': coords.latitude,
      'lon': coords.longitude,
      'format': 'json'
    }
  })
    .done(function(data) {
      if (data) {
        $('#location').html(data.address.city + ', ' + data.address.state);
        addressSet = true;
      }
      else {
        addressSet = false;
      }
    })
    .fail(function(xhr, status, error) {
      alert('Failed to get address.');
      console.log('Failed to get address: ' + status);
    });
}

function getWeather(location) {
  let proxy = 'https://cors-anywhere.herokuapp.com/'; //add this to the fetch URL to get around CORS problem
  let APIurl = 'https://api.darksky.net/forecast/';
  let url = proxy + APIurl + 
            darkskyAPIKey + '/' + location + 
            '?exclude=minutely,hourly,flags';

  $.ajax({
    url: url,
    method: 'GET'
  })
    .done(function(data) { 
      if (data) { 
        //store data to be reused
        storeData(data);
        
        if (!addressSet)
          $('#location').html(data.timezone);
        $('#temp').html(Math.round(data.currently.temperature));
        $('#units').html(String.fromCharCode(176) + 'F');
        $('#hi').html(Math.round(data.daily.data[0].temperatureHigh) + String.fromCharCode(176) + 'F');
        $('#lo').html(Math.round(data.daily.data[0].temperatureLow) + String.fromCharCode(176) + 'F');
        $('#feels').html(Math.round(data.currently.apparentTemperature) + String.fromCharCode(176) + 'F');
        $('#desc').html(data.currently.summary);
        $('#wind').html(data.currently.windSpeed + ' mph ' + currentData.windDirection);
        $('#humidity').html(Math.round(data.currently.humidity * 100) + '%');
        $('#icon').html('<use xlink:href="#' + getIcon(data.currently.icon, true) + '"/>');

        updateForecast(data.daily.data);
      }
      else {
        console.log('Data not defined');
      }
    })
    .fail(function(xhr, status, error) {
      alert('Failed to get data. Please enter a valid location.');
      console.log('Failed to get data: ' + status);
    });
}

function updateTime() {
  $("#time").html(moment().format('hh:mm A'));
}

function storeData(data) {
  currentData = ( 
    ({ temperature, apparentTemperature, windSpeed, windBearing }) => 
    ({ temperature, apparentTemperature, windSpeed, windBearing }))(data.currently);
  currentData.temperatureHigh = data.daily.data[0].temperatureHigh;
  currentData.temperatureLow = data.daily.data[0].temperatureLow;
  currentData.windDirection = (data.currently.windSpeed === 0) ? '' : degreesToDirection(data.currently.windBearing);

  for (let i=1; i<=5; i++) {
    forecast.push({ temperatureHigh: data.daily.data[i].temperatureHigh,
                    temperatureLow: data.daily.data[i].temperatureLow });
  }
}

function degreesToDirection(deg) {
  const arr = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  // Divide the angle by 45 because 360deg/8 directions = 45deg/direction change.
  // Add .5 so that when the value is truncated, you can break the 'tie' between the change threshold.
  let val =  Math.floor((deg / 45) + 0.5);
  return arr[(val % 8)];
}

function getIcon(weather, bkground=false) {
  let icon;
  let lGradDark = 'linear-gradient(rgba(0, 0, 0, 0.3),rgba(0, 0, 0, 0.3))';
  let url;
  let d = new Date();

  switch (weather) {
    case 'clear-day':
    case 'clear-night':
      icon = (d.getHours() > 18 || d.getHours() < 5) && bkground ? 'moonIcon': 'sunIcon';
      url = (d.getHours() > 18 || d.getHours() < 5) ? 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1558633307/night-1049.jpg)' :
      'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1558633519/clear2-1049.jpg)';
      break;
    case 'partly-cloudy-day':
    case 'partly-cloudy-night':
      icon = (d.getHours() > 18 || d.getHours() < 5) && bkground ? 'partlyCloudyNightIcon': 'partlyCloudyDayIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/few-clouds-1049.jpg)';
      break;
/*    case 'few-clouds':
      icon = 'fewCloudsIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/few-clouds-1049.jpg)';
      break; */
    case 'cloudy':
      icon = 'darkCloudsIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/cloudy-1049.jpg)';
      break;
    case 'fog':
      icon = 'mistIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/mist2-1049.jpg)';
      break; 
/*    case 'patchy-rain':
      icon = (d.getHours() > 18 || d.getHours() < 5) && bkground ? 'patchyRainNightIcon': 'patchyRainDayIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/Rain-1049.jpg)';
      break; */
    case 'rain':
      icon = 'rainIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/Rain-1049.jpg)';
      break;
    case 'hail':
      icon = 'hailIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1582662918/hail.jpg)';
      break;
/*    case 'patchy-drizzle':      
       icon = (d.getHours() > 18 || d.getHours() < 5) && bkground ? 'patchyDrizzleNightIcon': 'patchyDrizzleDayIcon';
       url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/drizzle2-1049.jpg)';
       break; 
    case 'drizzle':  
       icon = 'drizzleIcon';
       url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/drizzle2-1049.jpg)';
       break; */
    case 'thunderstorm':
      icon = 'thunderstormIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/thunder2-1049.jpg)';
      break;
    case 'snow':
      icon = 'snowIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/snow-1049.jpg)';
      break;
    case 'sleet':
      icon = 'sleetIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/snow-1049.jpg)';
     break;
/*    case 'patchy-snow':
      icon = (d.getHours() > 18 || d.getHours() < 5) && bkground ? 'patchySnowNightIcon': 'patchySnowDayIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/snow-1049.jpg)';
      break; 
    case 'patchy-sleet':
      icon = (d.getHours() > 18 || d.getHours() < 5) && bkground ? 'patchySleetNightIcon': 'patchySleetDayIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/snow-1049.jpg)';
      break; */
    case 'wind':
      icon = 'windIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1582659890/windy.jpg)';
      break;
    case 'tornado':
      icon = 'tornadoIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1582663324/tornado.jpg)';
      break;
    default:  
      icon = 'partlyCloudyDayIcon';
      url = 'url(https://res.cloudinary.com/dzsnl7ocm/image/upload/v1557259471/few-clouds-1049.jpg)';
  }
  
  if (bkground) {
    $('body').css('background-image', url);
    $('#displayCurrent').css('background-image', lGradDark +', ' + url);
  }

  return icon;
}

function updateForecast(data) {
  for (let i=1; i<=5; i++) {
      $('#day' + i).html(moment().add(i, 'days').format('ddd'));  
      $('#day' + i + 'Icon').html('<use xlink:href="#' + getIcon(data[i].icon) + '" />'); 
      $('#day' + i + 'Temp').html(Math.round(data[i].temperatureLow) + '/' + Math.round(data[i].temperatureHigh));
      $('#day' + i + 'Units').html(String.fromCharCode(176) + 'F');
  }
}

//Change Units of Temperature on button click
$('#unitChangeButton').on('click', changeUnits);

function fahrenheitToCelsius(temp) {
  return (temp - 32) * 5/9;
}

function milesToKM(speed) {
  return (speed * 1.609344).toFixed(2);
}

function changeUnits() {
  if ($('#unitChangeButton').text().includes('C')) {
    $('#unitChangeButton').html(String.fromCharCode(176) + 'F');
    $('#temp').html(Math.round(fahrenheitToCelsius(currentData.temperature)));
    $('#units').html(String.fromCharCode(176) + 'C');
    $('#hi').html(Math.round(fahrenheitToCelsius(currentData.temperatureHigh)) + String.fromCharCode(176) + 'C');
    $('#lo').html(Math.round(fahrenheitToCelsius(currentData.temperatureLow)) + String.fromCharCode(176) + 'C');
    $('#feels').html(Math.round(fahrenheitToCelsius(currentData.apparentTemperature)) + String.fromCharCode(176) + 'C'); 
    $('#wind').html(milesToKM(currentData.windSpeed) + ' km/hr ' + currentData.windDirection);

    //update forecast units
    for (let i=1; i<=5; i++) {
      $('#day' + i + 'Temp').html(Math.round(fahrenheitToCelsius(forecast[i-1].temperatureLow)) + '/' + 
                                  Math.round(fahrenheitToCelsius(forecast[i-1].temperatureHigh)));
      $('#day' + i + 'Units').html(String.fromCharCode(176) + 'C');
    }
  }
  else {
    $('#unitChangeButton').html(String.fromCharCode(176) + 'C');
    $('#temp').html(Math.round(currentData.temperature));
    $('#units').html(String.fromCharCode(176) + 'F');
    $('#hi').html(Math.round(currentData.temperatureHigh) + String.fromCharCode(176) + 'F');
    $('#lo').html(Math.round(currentData.temperatureLow) + String.fromCharCode(176) + 'F');
    $('#feels').html(Math.round(currentData.apparentTemperature) + String.fromCharCode(176) + 'F');
    $('#wind').html(currentData.windSpeed + ' mph ' + currentData.windDirection);
    
    //update forcast units
    for (let i=1; i<=5; i++) {
      $('#day' + i + 'Temp').html(Math.round(forecast[i-1].temperatureLow) + '/' + Math.round(forecast[i-1].temperatureHigh));
      $('#day' + i + 'Units').html(String.fromCharCode(176) + 'F');
    }
  }
} 

$('#newLocation').submit(function(e) {
    e.preventDefault();
    getCoordinates($("#place").val());
    $("#place").val('');
})

function getCoordinates(address) {
  let url = 'https://us1.locationiq.com/v1/search.php?';

  $.ajax({
    url: url,
    method: 'GET',
    data: {
      'key': locationAPIKey,
      'q': address,
      'format': 'json'
    }
  })
    .done(function(data) {
      if (data) {
        $('#location').html(data[0].display_name);
        addressSet = true;
        getWeather(data[0].lat + ',' + data[0].lon);
       }
    })
    .fail(function(xhr, status, error) {
      alert('Failed to get data. Please enter a valid address');
      console.log('Failed to get coordinates: ' + status);
    });
}
