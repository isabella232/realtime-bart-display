var map;
var bartAPIKey = 'MW9S-E7SL-26DU-VV8V';
var simpleGeoAPIKey = 'BPSeehMRSqd9cFU5DWTUSctk9Xb5cnU3';

$.extend({
  getUrlVars: function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  },
  getUrlVar: function(name){
    return $.getUrlVars()[name];
  }
});

function getWeather(){
  //Get weather from SimpleGeo
  var client = new simplegeo.ContextClient(simpleGeoAPIKey);
  
  client.getContext('37.778381','-122.389388', function(err, context) {
    if (err) {
      console.log(err);
    } else {
      $('.weather').html(
        '<div class="temp"><strong>' + context.weather.temperature.replace("F", "&deg;") + '</strong></div>' +
        '<div class="condition"><strong>' + context.weather.conditions + '</strong></div>' +
        '<div class="precipitation">Precipitation: <strong>' + context.weather.forecast.today.precipitation + '</strong></div>' +
        '<div class="range">Range: <strong>' + context.weather.forecast.today.temperature.min.replace("F", "&deg;F") + 
        ' - ' + context.weather.forecast.today.temperature.max.replace("F", "&deg;F") + '</strong></div>'
      );
    }
  });
}

function getBART(station){
  var url = 'http://api.bart.gov/api/etd.aspx';
  
  var bartNorth = [];
  var bartSouth = [];

  //Request Northbound Departures
  $.ajax({
    url: url,
    data: {
      cmd: 'etd',
      orig: station,
      dir: 'n',
      key: bartAPIKey
    },
    dataType: 'xml',
    success:function(result){
      //Page title
      $('.pageTitle h1').html($(result).find('name').text());
      
      $('#bartNorth .departures').html('');
      $(result).find('etd').each(function(i, data){
        //Process directions
        departure = addDirection(data);
        if(departure){
          bartNorth.push(departure);
        }
      });
      
      //Sort departures
      bartNorth.sort(bartSortHandler);
      
      $.each(bartNorth, function(i, departure){
        $('#bartNorth .departures').append(departure.div);
      });
    }
  });
  
  //Request Southbound Departures
  $.ajax({
    url: url,
    data: {
      cmd: 'etd',
      orig: station,
      dir: 's',
      key: bartAPIKey
    },
    dataType: 'xml',
    success:function(result){
      console.log(result);
      $('#bartSouth .departures').html('');
      $(result).find('etd').each(function(i, data){
        //Process directions
        departure = addDirection(data);
        if(departure){
          bartSouth.push(departure);
        }
      });
      
     //Sort departures
      bartSouth.sort(bartSortHandler);

      $.each(bartSouth, function(i, departure){
        $('#bartSouth .departures').append(departure.div);
      });
      
    }
  });
  
  function addDirection(data){
    var departure = {};
    
    departure.destination = $(data).find('destination').text();
    
    switch(departure.destination){
      case 'Dublin/Pleasanton':
        var color = '#00aeef';
        break;
      case 'Pittsburg/Bay Point':
        var color = '#ffe800';
        break;
      case 'Concord':
        var color = '#ffe800';
        break;
      case 'North Concord':
        var color = '#ffe800';
        break;
      case 'Richmond':
        var color = '#ed1c24';
        break;
      case 'Fremont':
        var color = '#4db848';
        break;
      case 'Daly City':
        var color = '#00aeef';
        break;
      case 'SFO/Millbrae':
        var color = '#ffe800';
        break;
      case 'SF Airport':
        var color = '#ffe800';
        break;
      case 'Millbrae':
        var color = '#ed1c24';
        break;
      default:
        var color = '#a8a9a9';
    }
    
    departure.div = '<div class="departure">';
    departure.div += '<div class="colorbox" style="background:' + color + '"></div>';
    departure.div += '<div class="destination">' + departure.destination + '</div>';
    
    departure.times = [];
    
    $(data).find('estimate').each(function(j, data){
      //Only add times where minutes are less than 100
      if($(data).find('minutes').text() < 100){
        //Convert "Arrived" to "Arr"
        var minutes = ($(data).find('minutes').text() == 'Arrived') ? "0" : $(data).find('minutes').text();
        
        departure.times.push(minutes);
        
        departure.div += '<span class="time">' + minutes + '</span>';
      }
    });
    departure.div += '</div>';
    
    //Check if first time is less than 40 minutes away. If not, discard
    if(departure.times[0] < 40){
      return departure;
    } else {
      return false;
    }
  }
  
  function bartSortHandler(a, b){
    return (a.times[0] - b.times[0]);
  }
}

function setupForm(){
  var url = 'http://api.bart.gov/api/stn.aspx';

  //Request list of BART stations
  $.ajax({
    url: url,
    data: {
      cmd: 'stns',
      key: bartAPIKey
    },
    dataType: 'xml',
    success:function(result){
      $(result).find('station').each(function(i, data){
        $('#stationSelect').append('<option value="' + $(data).find('abbr').text() + '">' + $(data).find('name').text() + '</option>');
      });
    }
  });
}

google.setOnLoadCallback(function(){
  
  //Detect settings
  if($.getUrlVar('station')){
    
    $('#infoContainer').show();
    $('#setupFormContainer').hide();
  
    //Do transit directions
    //Get BART
    setInterval(getBART($.getUrlVar('station')),15000);
  
    setInterval(getWeather(),1200000);
    
  } else {
    //No parameters sent
    setupForm();
    
  }
  
});