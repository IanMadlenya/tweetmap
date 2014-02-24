// Events:

 function project (pos){
      var point= map.getViewPortPxFromLonLat(new OpenLayers.LonLat(pos[0], pos[1])
        .transform("EPSG:4326", "EPSG:900913"));
      return [point.x, point.y];
    };

var clearCount = 0;
var timeUpdateInterval = 1500;
newTime = 0
lastTime = 0
tweetNow = 0
tweetLast = 0

var Vars = {
    selectedVar: "donations_ip",
    datasets: {
        cdr: {
            time: "epoch",
            x: "goog_x",
            y: "goog_y",
            aux: {
                user: "user_id",
                text: "user_id",
            },
            layer: "point"
        },
        donations_ip: {
            table: "donations_ip",
            time: "date",
            x: "goog_x",
            y: "goog_y",
            aux: {
                user: "contributor_name",
                text: "recipient_name",
            },
            layer: "point"
        },
        pickups: {
            time: "pickuptime",
            x: "pickup_x",
            y: "pickup_y",
            text: "pickupaddress",
            layer: "point"
        },
        dropoffs: {
            time: "droptime",
            x: "drop_x",
            y: "drop_y",
            text: "dropaddress",
            layer: "point"
        },
        trips: {
            time: "pickuptime",
            x: "pickup_x",
            y: "pickup_y",
            text: "pickupaddress",
            x0: "pickup_x",
            y0: "pickup_y",
            x1: "drop_x",
            y1: "drop_y",
            table: "trips",
            layer: "line"
        },
    }
};


var BBOX = {
  //WORLD: "-19313026.92,-6523983.06,14187182.33,12002425.38",
  WORLD: "-19813026.92,-8523983.06, 19813026.92,12002425.38",
  US: "-13888497.96,2817023.96,-7450902.94,6340356.62",
  //BOSTON: "-7930396.9,5206138.3,-7893707.1,5220737.8"
  BOSTON: "-7920070,5210793,-7903215,5218035"

};

function buildURI(params) {
  var uri = '';
  for (key in params) 
    uri += key + '=' + params[key] + '&';
  return encodeURI(uri.substring(0, uri.length - 1));
};

function toHex(num) {
    var str = Number(num).toString(16);
    return str.length == 1? "0" + str : str;
}

var MapD = {
  map: null,
  host: "http://sirubu.velocidy.net:8080/",
  table: "donations_ip",
  dataView: "counts",
  timestart: null,
  timeend: null,
  queryTerms: [],
  user: null,
  party: null,
  location: null,
  locationCat: null,
  datastart: null,
  dataend: null,
  linkButton: null,
  fullScreen: false,
  timeUpdates: 0,
  updateFlag: false,
  controlWidth:400,
  streaming: false,
  services: {
    baseLayerName: "Light",
    pointmap: null,
    heatmap: null,
    geotrends: null,
    topktokens: null, 
    tweets: null,
    graph: null,
    search: null,
    settings: null,
    tweetclick: null,
    animation: null,
    choropleth: null,
    realtime: null
  },



  init: function(map, pointmap, heatmap, geotrends, topktokens, tweets, graph, search, settings, tweetclick, animation, choropleth, realtime) {
  
    //$("#dataDisplayBarchart").click(function() {console.log($(this).attr("id"));});  
    if (window.location.search == "?local")
        this.host = "http://sirubu.velocidy.net:8080";

    Vars.selectedVar = "donations_ip";
    this.map = map;
    $("#control").resizable({handles:"e", helper: "control-resize-helper", stop: MapD.resizeControl, minWidth:352});
    $("#tweets").resizable({handles:"s", helper: "tweets-resize-helper", stop: MapD.resizeCloud});
    $("#cloudBox").resizable({handles:"n", helper: "cloud-resize-helper", stop: MapD.resizeCloud});
    $("#chart").resizable({handles:"n", helper: "chart-resize-helper", stop: MapD.resizeChart});
    //$("#tweets").resizable();
    //$("#cloudBox").resizable();
    
    //$("#clipboard-share").click($.proxy(function() {
    $("#clipboard-share").click($.proxy(this.genLink,
    this, false, this.displayLink));
        //var link = this.writeLink(false);
        //console.log("long link: " + link);
        //this.getShortURL(link);
        //console.log(link);
        //$("#link-dialog").html(link).dialog({width: 900});

    $("#twitter-share").on('click', $.proxy(this.genLink, this, false, this.sendTweet));
    $("#facebook-share").on('click', $.proxy(this.genLink, this, false, this.facebookShare));
    $("#sizeButton").removeClass("collapseImg").addClass("expandImg");
    $("#mapAnimControls").hide();
        
    this.services.pointmap = pointmap;
    this.services.heatmap = heatmap;
    this.services.geotrends = geotrends;
    this.services.topktokens = topktokens;
    this.services.tweets = tweets;
    this.services.graph = graph;
    this.services.search = search;
    this.services.settings = settings;
    this.services.tweetclick = tweetclick;
    this.services.animation = animation;
    this.services.choropleth = choropleth;
    this.services.realtime = realtime;
    this.map.events.register('moveend', this, this.reload);
    //this.map.events.register('changebaselayer', this, this.moveBaseAttr);


    $("#sizeButton").click($.proxy(function() {
        if (this.fullScreen == false) {
            this.fullScreen=true;
            this.services.animation.stopFunc();
            $("#sizeButton").removeClass("expandImg").addClass("collapseImg");
            $("#control").hide();
            //$("#chart").hide();
            //$("#chart").css({left: 0, bottom:0});
            //$("#mapview").css({left: 0, bottom:150});
            $("#mapview").css({left: 0});
            //$("#mapAnimControls").show();
            var chartWidth = $("#mapview").width();
            $("#chart").css({left: 0, width:chartWidth });
            $("#analysisControls").hide();
        }
        else {
            this.fullScreen=false;
            this.services.animation.stopFunc();
            $("#sizeButton").removeClass("collapseImg").addClass("expandImg");
            $("#control").show();
            //$("#chart").show();
            $("#mapview").css({left: this.controlWidth});
            var chartWidth = $("#mapview").width();
            //$("#mapview").css({left: this.controlWidth, bottom:170});
            //$("#mapAnimControls").hide();
            $("#chart").css({left: this.controlWidth, width:chartWidth});
            $("#analysisControls").show();
            //$("#chart").css({left: 400, bottom: 200});
        }
        this.map.updateSize();
        //this.chart.updateSize();
        //this.services.graph.updateSize();
        $('div#chart').empty();
        Chart.init($('div#chart'));
        //Animation.init(pointLayer, heatLayer, TopKTokens, Choropleth, $('.play-pause'), $('.stop'));
        //Chart.reload();

        //Chart.chart.setBrushExtent([this.timestart * 1000, this.timeend * 1000]);
        //Chart.chart.redrawBrush();
        //Chart.chart.draw();


    },this));

    $(window).resize($.proxy(function() {
      $("#cloud").height($("#cloudBox").height() - 70);
      //TopKTokens.reload();
      $('div#chart').empty();
      Chart.init($('div#chart'));
      MapD.map.updateSize();
      //Animation.init(pointLayer, heatLayer, TopKTokens, Choropleth, $('.play-pause'), $('.stop'));
    },this));

      


    $(".olControlZoomPanel").css("top",35);

    
    $(document).on('mapdreload', $.proxy(this.reload, this));
  },

  moveBaseAttr: function() {
    //console.log("movebaseattr");
    $(".gmnoprint").each(function() {
        var right = parseInt($(this).css("right"), 10);
        //console.log(right);
        $(this).css("right", right+40);
    })
    $(".gmnoprint").hide();
  },


  datasetClick: function(event) {






  },
  displayLink: function(response) {
    //console.log(response.data.url);
    $("#link-dialog").html(response.data.url).dialog({width: 200, height: 70});
  },
    
  getShortURL: function(longUrl, callback) {
    $.getJSON(
      "http://api.bitly.com/v3/shorten?callback=?",
      {
        "format": "json",
        "apiKey": "R_1abf41c5437c575da82e28c25052c8c4",
        "login": "mapd",
        "longUrl": longUrl
      }).done($.proxy(callback,this))
  },

  genLink: function(fullEncode, callback) {
    var link = this.writeLink(fullEncode);
    //console.log ("long link: " + link);
    this.getShortURL(link, callback);
  },
  
  facebookShare: function(response) {
    //var link = this.writeLink(true);
    var link = response.data.url; 
    //console.log(link);
    var countLinkUrl= "http://mapd.csail.mit.edu/tweetmap";
    var message = "Check out this interactive tweetmap I made with GPU-powered mapD!"; 
    window.open(
        'https://www.facebook.com/sharer/sharer.php?u=' + link, 'facebook-share-dialog', 'width=626,height=436');
    },

  resizeControl: function(event, ui) {
    var width = $("#control").width();
    console.log(width);
    $("#mapview").css({left: width});
    $("#chart").css({left: width});
    $("#cloud").css({width:width});
    $("#analysisControls").css({width: width});
    //$("#control").css({width: width});
    MapD.map.updateSize();
    MapD.controlWidth=width;
    //TopKTokens.reload();
    $('div#chart').empty();
    Chart.init($('div#chart'));
      $("#chart").resizable({handles:"n", helper: "chart-resize-helper", stop: MapD.resizeChart});
    //Animation.init(pointLayer, heatLayer, TopKTokens, Choropleth, $('.play-pause'), $('.stop'));


  },

  resizeChart: function(event, ui) {
      var chartHeight = ui.size.height; 
      var chartBarHeight = chartHeight + 30;
      console.log("Chart bar height: " + chartBarHeight);
      //$("#mapview").css("bottom", chartBarHeight);
      $("#mapview").css("bottom", chartBarHeight);
      $("#chart").height("height", chartHeight);
      var height = $("#chart").height();
      console.log("height: " + height);
      console.log("chartHeight: " + chartHeight);
      MapD.map.updateSize();
      $('div#chart').empty();
      Chart.init($('div#chart'));
      $("#chart").resizable({handles:"n", helper: "chart-resize-helper", stop: MapD.resizeChart});
      //Animation.init(pointLayer, heatLayer, TopKTokens, Choropleth, $('.play-pause'), $('.stop'));
   },





  resizeTweets: function(event, ui) {
      var comboHeight = $("#control").height() - 40;  
      var tweetsHeight = ui.size.height;
      var cloudHeight = comboHeight - tweetsHeight;
      $("#tweets").height(tweetsHeight);
      $("#cloudBox").height(cloudHeight);
      $("#cloud").height(cloudHeight - 70);
      TopKTokens.reload();
  },


  resizeCloud: function(event, ui) {
      console.log(event);
      console.log(ui);
      var comboHeight = $("#control").height() - 40;  
      console.log("Combo Height: " + comboHeight);
      var cloudHeight = ui.size.height;
      console.log("Cloud Height: " + cloudHeight);
      var tweetsHeight = comboHeight - cloudHeight;
      console.log("Tweets Height: " + tweetsHeight);
      $("#tweets").height(tweetsHeight);
      $("#cloudBox").height(cloudHeight);
      $("#cloud").height(cloudHeight - 70);
      TopKTokens.reload();
      Chart.reload();
      /*
      $('div#chart').empty();
      Chart.init($('div#chart'));
      */
  },


  sendTweet: function(response) {
    //var link = this.writeLink(true);
    var link = response.data.url; 
    //console.log("tweet link");
    var countLinkUrl= "http://mapd.csail.mit.edu/tweetmap";
    var message = "Check out this interactive tweetmap I made with GPU-powered mapD!"; 
    window.open("https://twitter.com/share?" +
        "url=" + link +
        "&counturl=" + encodeURIComponent(countLinkUrl) +
        "&text=" + encodeURIComponent(message) +
        "&hashtags=" + encodeURIComponent('tweetmap,mapD') +
        "&via=" + encodeURIComponent('datarefined'),
        "twitter", "width=500,height=300");
    },
  start: function() {
    $.getJSON(this.services.tweets.getTimeRangeURL()).done($.proxy(this.setDataTimeRange, this));
  },

  startCheck: function() {
    if (this.datastart != null && this.dataend != null) {
      this.timeend = Math.round((this.dataend-this.datastart)*1.01 + this.datastart);
      this.timestart = Math.round(this.dataStart);
      this.timestart = 1050000000; 
      this.timeend = 1352505600; 
      //this.timestart = 1000000000;
      //this.timeend = 1300000000;
      //this.timestart = Math.max(this.dataend - 8640000,  Math.round((this.dataend-this.datastart)*.01 + this.datastart));

      var mapParams = {extent: new OpenLayers.Bounds(BBOX.US.split(',')), baseOn: 1, pointOn: 1, heatOn: 0, polyOn: 0, dataDisplay: "Cloud", dataSource: "Word", dataMode: "Counts",  dataLocked: 0, t0: this.timestart, t1: this.timeend, pointR:6,  pointG:90, pointB:199, pointRadius:2, pointColorBy: "party", heatRamp: "green_red", scatterXVar: "pst045212", baseLayer: "Light", fullScreen: 1};
      mapParams = this.readLink(mapParams);
      //console.log("map params");
      //console.log(mapParams);
      this.timestart = mapParams.t0;
      this.timeend = mapParams.t1;
      this.timestart = 1050000000; 
      this.timeend = 1352505600;
      //this.timestart = 1000000000;
      //this.timeend =   1300000000;
      if ("what" in mapParams) {
        this.services.search.termsInput.val(params.what);
        $('#termsInput').trigger('input');
      } 
      if ("who" in mapParams) {
        this.services.search.userInput.val(params.who);
        $('#userInput').trigger('input');
      }
      if ("lang" in mapParams) {
        this.services.search.langInput.val(params.lang);
        $('#langInput').trigger('input');
      }
      if ("party" in mapParams) {
        this.services.search.partyInput.val(params.party);
        $('#partyInput').trigger('input');
      }
      if ("origin" in mapParams) {
        this.services.search.originInput.val(params.origin);
        $('#originInput').trigger('input');
      }

      this.services.topktokens.xVar = mapParams.scatterXVar; 
      //console.log("xvar: " + this.services.topktokens.xVar);
      //console.log("Join attrs: " + this.services.topktokens.params.joinattrs);
      ScatterPlot.selectedVar = mapParams.scatterXVar;
      if (mapParams.fullScreen == 1) {
        $("#sizeButton").click();
      }
      //$("#displayMode").addClass("grey-button"); 
      $(".data-buttons").buttonset();
      //$(".data-buttons").css("margin-right", "30px");
      $(".data-buttons label").css("background-image", "none").css("background-color", "white").css("color", "black");
      $(".data-buttons .ui-button-text").css("padding-left", "5px").css("padding-top", "3px").css("padding-right", "5px").css("padding-bottom", "0px");
      /*
      for (key in Vars.datasets) {
        var input = $("<input type='radio' id='" ); 
        $("#DatasetButtons").append("input"



      }
      */





      $(".dataview-buttons").buttonset();
      //$(".data-buttons").css("margin-right", "30px");
      $(".dataview-buttons label").css("background-image", "none").css("background-color", "white").css("color", "black");
      $(".dataview-buttons .ui-button-text").css("padding-left", "5px").css("padding-top", "3px").css("padding-right", "5px").css("padding-bottom", "0px");
      this.services.topktokens.setMenuItem("Source", mapParams.dataSource, false);
      this.services.topktokens.setMenuItem("Mode", mapParams.dataMode, false);
      this.services.topktokens.setMenuItem("Display", mapParams.dataDisplay, false);

        $("#PickupDisplay").prop('checked', 'checked');
        $("#DataviewButtons").buttonset("refresh");

        $("input:radio[name=dataview]").click(function() {
          MapD.dataView = $(this).val();
          if (MapD.dataView == "counts")
            Chart.chart.setMode("num");
          else
            Chart.chart.setMode("money");
          console.log(this.dataView);
          //Vars.selectedVar = $(this).val();
          //console.log(Vars.selectedVar);
        //$(".detail-text").html("<i>All " + Vars.selectedVar + "</i>");

        Search.form.submit();
      });





        $("#CountsDisplay").click();

      //this.services.topktokens.displayMode = mapParams.dataMode;
      /*
      if (mapParams.dataMode == "cloud")
        $("#cloudDisplay").prop('checked', 'checked');
      else 
        $("#barDisplay").prop('checked', 'checked');
      $("#displayMode").buttonset("refresh");
      */
      /*
      switch (mapParams.dataSource) {
        case "words":
          this.services.topktokens.dataSource = "words";
          $('#dataWords').prop('checked', 'checked');
          break;
        case "users":
          this.services.topktokens.dataSource = "users";
          $('#dataUsers').prop('checked', 'checked');
          break;
        case "geo":
          this.services.topktokens.dataSource = "geo";
          $('#dataGeo').prop('checked', 'checked');
          break;
        case "origin":
          this.services.topktokens.dataSource = "origin";
          $('#dataOrigin').prop('checked', 'checked');
      }
       $('#dataSource').buttonset("refresh");
       */

      /*
      if (mapParams.dataLocked == 1)
        this.services.topktokens.lockClickFunction(); 
      */
      if ("cx" in mapParams) {
        this.map.zoomTo(mapParams.zoom);
        this.map.setCenter(new OpenLayers.LonLat(mapParams.cx, mapParams.cy));
      }
      else {
        this.map.zoomToExtent(mapParams.extent);
      }
      this.services.search.form.submit();
      this.services.pointmap.colorBy = mapParams.pointColorBy;
      if (mapParams.pointColorBy == "sender_name" || mapParams.pointColorBy == "origin" || mapParams.pointColorBy == "lang" || mapParams.pointColorBy == "party") 
          $("#pointStaticColor").hide();
      var radius = parseInt(mapParams.pointRadius);
      //console.log("radius: " + radius);
      //$(".circle").eq(radius - 1).addClass("circle-selected");
      $(".point-size").eq(radius + 1).addClass("point-size-selected");
      this.services.pointmap.params.radius = parseInt(radius);
      var hexColor = '#' + toHex(parseInt(mapParams.pointR)) + toHex(parseInt(mapParams.pointG)) +  toHex(parseInt(mapParams.pointB));
      $("#pointColorPicker").minicolors('value', hexColor);
      //console.log(mapParams.heatRamp);
      this.services.heatmap.setRamp(mapParams.heatRamp, false);
      /*
      this.services.heatmap.params.colorramp = mapParams.heatRamp;
      $(".color-ramp").removeClass("ramp-selected");
      $("#" + mapParams.colorRamp).addClass("ramp-selected");
      */
      BaseMap.currentLayer = mapParams.baseLayer;
      this.services.settings.baseButtonFunction(mapParams.baseOn);
      this.services.settings.polyButtonFunction(mapParams.polyOn);
      if (mapParams.pointOn == 1)
        this.services.settings.pointButtonFunction();
      if (mapParams.heatOn == 1)
        this.services.settings.heatButtonFunction();
      this.timeReload();
      //pointLayer.setVisibility(mapParams.pointOn);
      //heatLayer.setVisibility(mapParams.heatOn);
      //Settings.init(pointLayer, heatLayer, $('button#pointButton'), $('button#heatButton'));

      //this.reloadByGraph(this.timestart, this.timeend);
      //if (!linkRead)
      this.reload();
    }
  },



  writeLink: function(fullEncode) {
    var url = document.URL.split('?')[0] + "?";
    //var mapExtent = this.map.getExtent().toBBOX().split(',');
    var center = map.getCenter();
    //var uriParams = {t0: this.timestart, t1: this.timeend, x0: mapExtent[0], y0: mapExtent[1], x1: mapExtent[2], y1: mapExtent[3]};
    var uriParams = {t0: this.timestart, t1: this.timeend, cx: center.lon, cy: center.lat, zoom: map.getZoom()};

    var what = this.services.search.termsInput.val();
    if (what != "") 
      uriParams.what = what;
    var who = this.services.search.userInput.val();
    if (who != "") 
      uriParams.who = who;
    var lang = this.services.search.langInput.val();
    if (lang != "") 
      uriParams.lang = lang;
    var origin = this.services.search.originInput.val();
    if (origin != "") 
      uriParams.origin = origin;


    uriParams.baseOn = (Settings.baseOn ? 1 : 0);
    uriParams.baseLayer = BaseMap.currentLayer;
    uriParams.polyOn = (Settings.polyOn ? 1 : 0);
    uriParams.pointOn = pointLayer.getVisibility() == true ? 1 : 0; 
    uriParams.heatOn = heatLayer.getVisibility() == true ? 1 : 0; 
    uriParams.dataDisplay = this.services.topktokens.displaySetting;
    uriParams.dataSource = this.services.topktokens.sourceSetting;
    uriParams.dataMode = this.services.topktokens.modeSetting;
    uriParams.dataLocked = this.services.topktokens.locked == true ? 1 : 0;
    uriParams.pointR = this.services.pointmap.params.r;
    uriParams.pointG = this.services.pointmap.params.g;
    uriParams.pointB = this.services.pointmap.params.b;
    uriParams.pointRadius = this.services.pointmap.params.radius;
    uriParams.pointColorBy = this.services.pointmap.colorBy;
    uriParams.heatRamp = this.services.heatmap.params.colorramp;
    uriParams.scatterXVar = this.services.topktokens.xVar;
    uriParams.fullScreen = this.fullScreen == true ? 1: 0;
    var uri = buildURI(uriParams);
    if (fullEncode)
        url += encodeURIComponent(uri);
    else 
        url += uri;
    //url = encodeURI(url);

    //console.log(url);
    return url;

  },

  readLink: function(mapParams) {
    if (window.location.search.substr(0,1) == "?") {
      //console.log("params");
      params = this.getURIJson();
      //console.log(params);

      // next two are to provide backward compatibility
      if ("dataSource" in params) {
        //params.dataSource = (params.dataSource.charAt(0).toUpperCase() + params.dataSource.slice(1));
        if (params.dataSource == "words")
            params.dataSource = "Word";
        else if (params.dataSource == "users")
            params.dataSource = "User";
        else if (params.dataSource == "countries")
            params.dataSource = "Country";
      }
      if ("dataMode" in params && params.dataMode.charAt(0).toLowerCase()) {
        if (params.dataDisplay == "cloud")
            params.dataDisplay = "Cloud";
        else if (params.dataDisplay == "bar")
            params.dataDisplay = "Bar";
        //else
        //    params.dataDisplay = "Bar";

        //params.dataMode = "Counts";
      }

      for (var attr in params)
        mapParams[attr] =  params[attr];
    }
    return mapParams;
  },

  getURIJson: function() {
    var queryString = location.search.substring(1);
    var obj = {}
    var pairs = queryString.split('&');
    for(i in pairs){
      var split = pairs[i].split('=');
      obj[decodeURIComponent(split[0])] = decodeURIComponent(split[1]);
    }
    return obj;

    /*JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) }):{};
    return search; */
  },

  timeReload: function(e) {

    if (this.streaming == true && this.services.animation.isAnimating() == false ) { 

           lastTime = newTime;
           newTime = new Date().getTime();
           //console.log(newTime - lastTime)
           if (this.timeend >  (this.dataend-this.datastart)*.98 + this.datastart) {
             if (this.updateFlag == false) {
                 this.services.tweets.reload(false);
                  this.updateFlag = true;
                  setTimeout($.proxy(this.timeReload,this),timeUpdateInterval);
                  return;
            }
            
             var updateInterval = map.zoom > 7 ? 10 : 5;
             if (this.timeUpdates % updateInterval == 0) {
                  this.services.pointmap.reload();
                  this.services.heatmap.reload();
              }
            this.services.tweets.reload(true);
              this.timeUpdates++;
              this.updateFlag = true;
            }
            else if (this.updateFlag == true) {
                this.updateFlag = false;
                this.services.realtime.removeData();
            }

        }
        //this.timeReload();
        //this.timeReload();
        setTimeout($.proxy(this.timeReload,this),timeUpdateInterval);
   },

  reload: function(e) {

    this.services.graph.reload();
    if (this.fullScreen == false) {
      this.services.geotrends.reload();
      this.services.topktokens.reload();
      this.services.tweets.reload();
    }
    if (e.type != "moveend") {
        //console.log("reloading");
        //this.services.choropleth.reload();
        this.services.choropleth.reload();
    }
  },

  reloadByGraph: function(start, end) {
    //console.log('in reloadByGraph');
    //var oldStart = this.timestart;
    //var oldEnd = this.timeend;
    this.timestart = start;
    this.timeend = end;
    if (this.services.animation.isAnimating()) { // only need to refresh point and heatmaps in this case - done by stopFunc
      this.services.animation.stopFunc();
    }
    else {
      this.services.geotrends.reload();
      this.services.topktokens.reload();
      this.services.tweets.reload();
      this.services.pointmap.reload();
      this.services.heatmap.reload();
      //this.services.choropleth.reload();
      //this.services.choropleth.reset();
      this.services.choropleth.reload();

    }
    //this.timestart = oldStart;
    //this.timeend = oldEnd;
  },

  setDataStart: function(json) {
    this.datastart = json.results[0].time;
    this.startCheck();
  },

  setDataEnd: function(json) {
    this.dataend = json.results[0].time;
    this.startCheck();
  },


  setDataTimeRange: function(json) {
    //this.datastart = 1267405200 - 20000;
    //this.datastart = 1267405200 - 92000;
    //this.dataend = 1267419599 - 17000;
    this.datastart = json.results[0].min;
    this.dataend = json.results[0].max + 86400;
    //this.datastart = 900000000; 
    this.datastart = 950000000; 
    //this.dataend = 1352505600;
    this.dataend = 1360505600;
    //this.dataend = json.results[0].max;
    this.startCheck();
  },


  setUser: function(user) {
    this.user = user;
  },

  setOrigin: function(origin) {
    this.origin = origin;
  },

  setLang: function(lang) {
    this.lang = lang;
  },
  setParty: function(party) {
    this.party = party;
  },

  setSeat: function(seat) {
    this.seat = seat;
  },

    
  setLocation:function(locationCat, location) {
    this.locationCat = locationCat;
    this.location = location;
  },

  parseQueryExpression: function(str) {
    var numQuotes = 0;
    var numStartParens = 0;
    var numEndParens = 0;
    for (i in str) {
      if (str[i] == '"')
        numQuotes++;
      else if (str[i] == "(")
        numStartParens++;
      else if (str[i] == ")")
        numEndParens++;
    }
    if (numQuotes % 2 != 0 || numStartParens != numEndParens)
      return;

    var returnString = "(";
    str = str.replace(/'/g, "''").replace("/&/g", "");
    var queryTerms = str.split(/(AND|OR|"|\s+|NOT|\(|\))/);
    var expectOperand = true;
    var inQuote = false;
    var atNot = false;
    var searchString = "";
    for (var i = 0; i != queryTerms.length; i++) {
      var token = queryTerms[i];
      if (token == "" || token[0] == ' ')
        continue;
      if (token == "AND" || token == "OR") {
        if (expectOperand == true)  
          return null;
        expectOperand = true;
        returnString += " " + token + " ";  
      }
      else if (token == "NOT") {
        /*if (expectOperand == false)  
          return null;*/
        atNot = true;
        //returnString += " " + token + " ";  
      }
      else if (token == "(") {
        /*if (expectOperand == false)  
          return null; */
        returnString += " " + token + " ";  
      }
      else if (token == ")") {
        /*if (expectOperand == true)  
          return null;*/
        returnString += " " + token + " ";  
      }
      else if (token == '"') {
        if (expectOperand == false)  {
          returnString += " AND ";
          expectOperand = true;

          //return null;
        }
        inQuote = !inQuote;
        if (inQuote) {
          if (atNot) {
            searchString = Vars.datasets[Vars.selectedVar].aux.text + " not ilike '"  
            atNot = false;
          }
          else
            searchString = Vars.datasets[Vars.selectedVar].aux.text + " ilike '"  
        }
        else {
          console.log("At end quote");
          expectOperand = false;
          if (searchString[searchString.length -1] == ' ') {
            searchString = searchString.substr(0,searchString.length-1) + "'";
          }
          else {
            searchString += "'";
          }
          returnString += searchString;
          searchString = "";
        }
      }
      else {
        if (inQuote) {
          searchString += token + " ";
        }
        else  {
          if (expectOperand == false) {
            returnString += " AND ";
            //return null;
          }
          if (atNot) {
            returnString += Vars.datasets[Vars.selectedVar].aux.text + " not ilike '" + token + "'";
            atNot = false;
          }
          else  {
            returnString += Vars.datasets[Vars.selectedVar].aux.text + " ilike '" + token + "'";
          }
          expectOperand = false;
        }
     }
  }
  return returnString + ")";
},
            
  

  setQueryTerms: function(queryTerms) {
    console.log("Query terms: " + queryTerms);
    if (queryTerms != undefined) {
      if (queryTerms[0] != '"' && this.queryTerms[this.queryTerms.length -1] != '"')
          this.queryTerms = queryTerms.trim().split(" ").filter(function(d) {return d});
      else {
          this.queryTerms = []
          this.queryTerms.push(queryTerms);
      }
    }


  },

  parseQueryTerms: function(queryTerms) { 
    //console.log(queryTerms);
    if (queryTerms[0] == "multilanguage:") {
        var query = "tweet_text ilike 'coffee' or tweet_text ilike 'café' or tweet_text ilike 'caffè' or tweet_text ilike 'kaffe' or tweet_text ilike 'kaffe' or tweet_text ilike 'кофе' or tweet_text ilike 'kahve' or tweet_text ilike 'قهوة' or tweet_text ilike '咖啡' or tweet_text ilike '커피' or tweet_text ilike 'コーヒー' or tweet_text ilike 'kopi'";
	return query;
    }
    else if (queryTerms[0] == "origin:") {
        var query = "(origin ilike '" + queryTerms[1] + "')";
        return query;
    }
    else if (queryTerms[0] == "country:" || queryTerms[0] == "state:" || queryTerms[0] == "county:" || queryTerms[0] == "zip:") {
        var term = "";
        for (var q = 1; q < queryTerms.length; q++) 
            term += queryTerms[q] + " ";
        term = term.substr(0, term.length - 1);
        var query = "(" + queryTerms[0].substring(0,queryTerms[0].length - 1) + " ilike '" + term + "')";
        return query;
    }
    else {
        var array = queryTerms.slice(0);
        for (i in array) {
          array[i] = "'" + array[i].replace("'", "''").replace(/["]/g, '').replace("&", "") + "'";
        }
        var whereTerms = array.join(" and tweet_text ilike ");
        whereTerms = "(tweet_text ilike " + whereTerms + ") ";
    }
    return whereTerms;
  },

  getOriginQuery: function () {
    console.log("origin: " + this.origin);
    if (this.origin != undefined && this.origin != null && this.origin != "") {
      var query = "";
      query += "origin ilike '" + this.origin + "' and ";
      return query;
    }
    return "";
  },

  getLangQuery: function() {
    if (this.lang != undefined && this.lang != null && this.lang != "") {
      var query = "";
      query += "lang ilike '" + this.lang + "' and ";
      return query;
    }
    return "";
  },

  getGenericQuery: function(varName, value) {
    if (value != undefined && value != null && value != "") {
      var query = varName + " ilike '" + value + "' and "; 
      return query;
    }
    return "";
  },

  getPartyQuery: function(party) {
    console.log("AT PARTY QUERY");
    if (party != undefined && party != null && party != "") {
      var query = "";
      query += "party ilike '" + party + "' and ";
      console.log(query);
      return query;
    }
    return "";
  },

  getTermsAndUserQuery: function (queryTerms, split, user  ) {
    var query = ""; 
    if (queryTerms.length) {
      //queryTerms = this.parseQueryTerms(queryTerms);
      console.log("Now doing parse Expression: ");
      if (split == true) {
        queryTerms = this.parseQueryExpression(this.services.search.termsInput.val());
      }
      else  {
        queryTerms = Vars.datasets[Vars.selectedVar].aux.text + " ilike '"+ this.services.search.termsInput.val() + "'";
      }
      console.log(queryTerms);

      query += queryTerms + " and ";
    }
    if (user)
      query += Vars.datasets[Vars.selectedVar].aux.user + " ilike '" + user + "' and ";
    return query;
  },


  getTimeQuery: function (timestart, timeend) {
    console.log("at get time query");
    console.log(Vars.selectedVar);
    var query = "";
    if (timestart)
      query +=  Vars.datasets[Vars.selectedVar].time + " >= " + timestart + " and ";
    if (timeend)
      query += Vars.datasets[Vars.selectedVar].time + " <= " + timeend + " and ";
    return query;
  },

  getWhere: function(options) {
    var timestart = this.timestart;
    var timeend = this.timeend;
    var user = this.user;
    var party = this.party;
    var seat = this.seat;
    var origin = this.origin;
    var splitQuery = false; // don't split query into two parts 
    var queryTerms = this.queryTerms;
    var minId = null;
    if (options) {
      if (options.time) {
        //console.log("time " + options.time.timestart);
        timestart = options.time.timestart;
        timeend = options.time.timeend;
      }
      if ("queryTerms" in options)
        queryTerms = options.queryTerms;
      if ("user" in options) {
        user = options.user;
      }
      if ("party" in options)
        party = options.party;
      if ("seat" in options)
        seat = options.seat;
      if ("splitQuery" in options) 
        splitQuery = options.splitQuery;

      if ("minId" in options)
        minId = options.minId; 

      
    }
    //console.log("minid: " + minId);
    
        var addedOrigin = false;
        var addedLang = false;
        var locQuery = "";
        if (this.location != null && this.location != "") {
          locQuery = this.locationCat + " ilike '" + this.location + "' and ";  
        }
      if (splitQuery) {
        var queryArray = new Array(2);
        queryArray[0] = this.getTermsAndUserQuery(queryTerms, false, user);
        console.log("Query array!: " + queryArray[0]);
        if (queryArray[0] != "") {
          queryArray[0] = queryArray[0].substr(0, queryArray[0].length-5);
        }
        else {
            queryArray[0] = this.getGenericQuery("party", party) + this.getGenericQuery("seat", seat);
            queryArray[0] = queryArray[0].substr(0, queryArray[0].length-5);
            addedOrigin = true;
        }
        queryArray[1] = this.getTimeQuery(timestart, timeend);
      //if (!addedOrigin)
      //  queryArray[1] += this.getOriginQuery() + this.getLangQuery();

      if (locQuery != "") {
        if (queryArray[1] != "")
          queryArray[1] += locQuery;
        else
          queryArray[1] = locQuery;
      }

        if (queryArray[1])
          queryArray[1] = " where " + queryArray[1].substr(0, queryArray[1].length-5);

        return queryArray;

      }
      else {
        var whereQuery ="";
        if (minId != null) {
          whereQuery = "id > " + minId + " and " + locQuery + this.getTermsAndUserQuery(queryTerms, false, user);
        }
        else {
            whereQuery = this.getTimeQuery(timestart, timeend) + locQuery + this.getTermsAndUserQuery(queryTerms, false, user) + this.getPartyQuery(party) + this.getGenericQuery("seat", seat);
        }
        if (whereQuery)
          whereQuery = " where " + whereQuery.substr(0, whereQuery.length-5);
        return whereQuery;
      }
  }
};

var GeoTrends = {
  mapd: MapD,
  binWidthPx: 96,
  binHeightPx: 96,
  params: {
    request: "GetGeoTrends",
    sql: null,
    bbox: null,
    timestart: null,
    timeend: null,
    xbins: 16,
    ybins: 16,
    tbins: 2,
    //stoptable: "multistop"
  },
  GRIDSIZE_SMALL: 64,
  GRIDSIZE_MEDIUM: 96,
  GRIDSIZE_LARGE: 128,

  getGridSize: function() {
    var size = [this.binWidthPx, this.binHeightPx]
    return size;
  },

  setGridSize: function(size) {
    this.binWidthPx = size;
    this.binHeightPx = size;
  },

  alignBBOX: function() {
    var map = this.mapd.map;
    var bbox = map.getExtent().toBBOX().split(',');
    var viewPortSize = map.getSize(); // in pixels
    var resolution = map.getResolution(); // meters per pixel
    var binWidth = this.binWidthPx * resolution;
    var binHeight = this.binHeightPx * resolution;
    var bboxLeft = Math.floor(bbox[0] / binWidth) * binWidth;
    var bboxRight = Math.ceil(bbox[2] / binWidth) * binWidth;
    var bboxBottom = Math.floor(bbox[1] / binWidth) * binHeight;
    var bboxTop = Math.ceil(bbox[3] / binWidth) * binHeight;
    this.params.bbox = [bboxLeft, bboxBottom, bboxRight, bboxTop].join();
    this.params.xbins = Math.round((bboxRight - bboxLeft) / binWidth);
    this.params.ybins = Math.round((bboxTop - bboxBottom) / binHeight);
  },

  getURL: function() {
    //this.params.sql = "select goog_x, goog_y, time, tweet_text from " + this.mapd.table;
    var selectedVar = Vars.selectedVar;
    this.params.sql = "select " + Vars.datasets[selectedVar].x + "," + Vars.datasets[selectedVar].y +"," + Vars.datasets[selectedVar].time + "," + Vars.datasets[selectedVar].text + "," + duration + " from " + this.mapd.table;
    this.params.sql += this.mapd.getWhere();
    this.params.timestart = this.mapd.timestart;
    this.params.timeend = this.mapd.timeend;
    this.alignBBOX();
    var url = this.mapd.host + '?' + buildURI(this.params);
    return url;
  },

  reload: function() {
    //$.getJSON(this.getURL()).done($.proxy(onTrends, this, this.mapd.queryTerms));
  } 
};

var TopKTokens = {
  mapd: MapD,
  displayDiv: null, 
  defaultCloudK: 30,
  defaultChartK: 15,
  defaultScatterK: 4000,
  displaySetting: null,
  sourceSetting: null,
  modeSetting: null,
  settingDict: {Display: 'displaySetting', Source: 'sourceSetting', Mode: 'modeSetting'},
  locked: false,
  tokens: [],
  xVar: "pst045212",
  params: {
    request: "GroupByToken",
    sql: null,
    sql1: null, // only for trending
    sql2: null, // only for trending
    bbox: null,
    k: 30,
    stoptable: "multistop",
    sort: "true",
    tokens: [],
    jointable: null,
    joinvar: null,
    joinattrs: null,
    //joinattrs: "inc910211"
  },

  init: function(displayDiv) {
    this.displayDiv = displayDiv;
    /*
    $(this.displayDiv).resize(function() {
        console.log("resized!");
    });
    */

    $(".data-dropdown").click($.proxy(function(e) {
      var menu;
      var choice = this.getMenuItemClicked(e.target);
      if ($(e.currentTarget).hasClass("display-menu")) {
        menu="Display";
      }
      else if ($(e.currentTarget).hasClass("source-menu")) {
        menu="Source";
      }
      else if ($(e.currentTarget).hasClass("mode-menu")) {
        menu="Mode";
      }
      this.setMenuItem(menu, choice, true);
    }
    , this));  

    /*
    $(".data-buttons input").click($.proxy(function(e) {
         //console.log($(e.currentTarget.htmlFor));
         var id = $(e.currentTarget).attr("id");
         var menu = "Mode";
         var choice;
         var displayPos = id.search("Display");
         if (id.search("Display") != -1) {
            menu = "Display";
            choice = id.substr(0,displayPos); 
         }
         else {
            choice = id.substr(0,id.search("Mode")); 
         }
          this.setMenuItem(menu, choice, true);

       }, this));
     */   
    $("#lock").button({
        text:false,
        icons: {
            primary: "ui-icon-unlocked"
        }
    })
    .click($.proxy(this.lockClickFunction, this));
    
    /*
     
    $('input[name="displayMode"]').change($.proxy(function (event) {
       this.displayMode = event.target.value;
       if (this.displayMode == "cloud")
            $(this.displayDiv).click($.proxy(this.addClickedWord, this)); 
        else
            $(this.displayDiv).off('click');

       this.reload();
    }, this));

    $('input[name="dataSource"]').change($.proxy(function (event) {
       this.dataSource = event.target.value;
       if (this.locked)
         this.lockClickFunction(true);

       this.reload();
    }, this));

    $('input[name="dataNums"]').change($.proxy(function (event) {
       this.dataNums = event.target.value;
       this.reload();
    }, this));


    $('input[name="cloudSource"]').change($.proxy(function (radio) {
        console.log($(radio).val());
        //console.log($(this));
        //console.log($(radio).val());
    }, this, $('input[name="cloudSource"]')));
    */
    //$(this.displayDiv).click($.proxy(this.addClickedWord, this)); 

  },
  
  getMenuItemClicked: function(target) {
    var innerText = "";
    if (target.localName != "span")
        innerText = target.firstChild.innerText;
    else {
        if (target.className == "checkmark")
            innerText = target.parentElement.firstChild.innerText;
        else
            innerText = target.innerText;
            
    }
    return innerText;
  },

  setMenuItem: function(menu, choice, reload) {   
    //console.log("menu: " + menu);
    if (menu == "Mode" || menu == "Display") {
        var buttonDiv = "#" + menu + "Buttons";
        var choiceDiv = "#" + choice + menu; 
        $(choiceDiv).prop('checked', 'checked');
        $(buttonDiv).buttonset("refresh");

    }
    else {

        var menuDiv = "#data" + menu;
        var dropdownDiv = menuDiv + "Dropdown";
        var choiceDiv = menuDiv + choice;
        //console.log(menuDiv);
        //console.log(choiceDiv);
        $(dropdownDiv + " span.checkmark").css("visibility", "hidden");
        $(choiceDiv + " .checkmark").css("visibility","visible");
        $(menuDiv + " span.choice-text").text(choice);
        $(dropdownDiv).removeClass('dropdown-open');
    }
        this[this.settingDict[menu]] = choice;
        if (menu == "Source") {
          if (Search.searchEmpty || choice == "Word") {
          $("#PercentsMode").prop('disabled',true);
          $("#ModeButtons").buttonset("refresh");
          this.setMenuItem("Mode", "Counts", false);
        }
        else {
          $("#PercentsMode").prop('disabled',false);
          $("#ModeButtons").buttonset("refresh");
         }
         if (choice == "Word" || choice =="User" || choice == "Os-App") {
          $("#ScatterDisplay").prop('disabled',true);
          $("#DisplayButtons").buttonset("refresh");
          this.setMenuItem("Display", "Cloud", false);
        }
         else {
          $("#ScatterDisplay").prop('disabled',false);
          $("#DisplayButtons").buttonset("refresh");
        }


    }

        /*
        if (menu == "Source") {
            console.log("source!!!");
            if (choice == "Words") { 
                if (this.modeSetting == "Percents") {
                    this.setMenuItem("Mode", "Counts", false); 
                }
                $("#dataModePercents").hide();
            }
            else {
                $("#dataModePercents").show();
            }
        }
        */

    if (choice == "Cloud")
      $(this.displayDiv).click($.proxy(this.addClickedWord, this)); 
    else if (choice == "Bar")
      $(this.displayDiv).off('click');
    else if (choice == "Scatter" || (menu == "Source" && this.displaySetting == "Scatter")) {
      $(this.displayDiv).off('click');
      $.getJSON(this.getScatterVarsURL()).done($.proxy(this.onScatterVarsLoad, this));
    }
    if (reload)
      this.reload();
  },

  getScatterVarsURL: function() {
    //console.log("getscattervars");
    var scatterParams = {};
    scatterParams.request = "GetTableCols";
    //scatterParams.table = this.sourceSetting + "_data";
    scatterParams.table = this.sourceSetting.toLowerCase() + "_data";
    //scatterParams.table = "county_data";
        this.params.jointable = this.sourceSetting.toLowerCase() + "_data";
    var url = this.mapd.host + '?' + buildURI(scatterParams);
    return url;
  },

  onScatterVarsLoad: function(json) {
    //console.log("Selected var 0: " + ScatterPlot.selectedVar);
    ScatterPlot.setVars(json);
    //console.log("Selected var 1: " + ScatterPlot.selectedVar);
    //TopKTokens.xVar = ScatterPlot.selectedVar; 
    //TopKTokens.xVar = "pst045212";
    //console.log("Xvar: " + TopKTokens.xVar);
    TopKTokens.reload();
    //ScatterPlot.init(this, this.displayDiv);
  },

  scatterVarChange: function(e) {
    //console.log($(this).find("option:selected"));
    TopKTokens.xVar = $(this).find("option:selected").get(0).value;
    console.log("Xvar: " + TopKTokens.xVar);
    ScatterPlot.selectedVar = TopKTokens.xVar;
    //console.log(ScatterPlot.selectedVar);
    TopKTokens.reload();
  },

  lockClickFunction: function (preventReload) {  
        var options;
        var lock = $("#lock");
        if (lock.text() === "unlocked") {
            options = {
                label: "locked",
                icons: {
                    primary: "ui-icon-locked"
                }
            };
            this.locked = true;
            //this.params.sort = "false";
        } 
        else {
            options = {
                label: "unlocked",
                icons: {
                    primary: "ui-icon-unlocked"
                }
            };
            this.locked = false;
            //this.params.sort = "true";
            if (preventReload != true)
                this.reload();
        }
        $("#lock").button("option",options);
    },

  getURL: function(options) {


    var numQueryTerms = this.mapd.queryTerms.length;
    /*
    if (numQueryTerms > 0) { // hack - doesnt work for who
      //$("#dataPercents").attr('disabled', false);
    }
    else
      $("#dataPercents").attr('disabled', true);
    */
    //$("#dataNums").buttonset("refresh");
    //if (this.modeSetting == "Percents" && this.sourceSetting == "Word")
    //    this.setMenuItem("Mode", "Counts", false);
    if (this.displaySetting == "Scatter") {
        //this.params.jointable = "county_data";
        this.params.jointable = this.sourceSetting.toLowerCase() + "_data";
        this.params.joinvar = "name";
        this.params.sort = "false";
    }
    else {
        this.params.jointable = null;
        this.params.joinvar = null;
        this.params.joinattrs = null;
        //this.xVar = null;
        ScatterPlot.selectedVar = null;
        this.params.sort = "true";
    }
    var getPercents = (this.modeSetting == "Percents" && this.sourceSetting != "Word");
    if (getPercents) { 
      if (options == undefined || options == null) 
        options = {splitQuery: true};
      else
        options.splitQuery = true;
    }

    var query = this.mapd.getWhere(options);
    //console.log("query: " + query);

    this.params.stoptable = "";
    //console.log(this.sourceSetting);
    if (this.sourceSetting == "Word") {
        this.params.sql = "select tweet_text";
        this.params.stoptable = "multistop";
    }
    else if (this.sourceSetting == "User") {
        this.params.sql = "select sender_name";
    }
    else if (this.sourceSetting == "Country") {
        this.params.sql = "select country";
    }
    else if (this.sourceSetting == "State") {
        this.params.sql = "select state";
    }
    else if (this.sourceSetting == "County") {
        this.params.sql = "select county";
    }
    else if (this.sourceSetting == "Zip") {
        this.params.sql = "select zip";
    }
    else if (this.sourceSetting == "Language") {
        this.params.sql = "select lang";
    }
    else if (this.sourceSetting == "OS-App") {
        this.params.sql = "select origin";
    }
   

    if (getPercents) 
      this.params.sql += "," + query[0] + " from " + this.mapd.table + query[1]; 
    else if (this.modeSetting == "Counts")
      this.params.sql += " from " + this.mapd.table + query; 
    else 
      this.params.sql += " from " + this.mapd.table; 

    if (this.displaySetting == "Cloud") {
        var area = this.displayDiv.width() * this.displayDiv.height();
        var areaRatio = area/80000.0; 
        var adjCloudK = Math.round(this.defaultCloudK * areaRatio);
        this.params.k = adjCloudK + numQueryTerms;
    }
    else if (this.displaySetting == "Bar") {
        var adjChartK = Math.round(this.defaultChartK * this.displayDiv.width() / 400.0);
        this.params.k = adjChartK;
    }
    else if (this.displaySetting == "Scatter") {
        this.params.k = this.defaultScatterK ;
        if (ScatterPlot.colorVar != null)
            this.params.joinattrs = this.xVar + "," + ScatterPlot.colorVar;
        else
            this.params.joinattrs = this.xVar;
    }

    if (this.locked) {
        this.params.tokens = this.tokens;
        this.params.sort = "false";
    }
    else {
        if (this.displaySetting != "Scatter") 
            this.params.sort = "true";
        this.params.tokens = [];
    }

    if (this.modeSetting == "Trends") {
        var timestart = parseInt(this.mapd.timestart);
        var timeend = parseInt(this.mapd.timeend);
        //console.log(timestart);
        //console.log(midTime);
        //console.log(timeend);
        if (options == undefined || options == null)  
            options = {};
        else if (options.time != undefined && options.time != null) {
            timestart = options.time.timestart;
            timeend = options.time.timeend;
        }
        var midTime = Math.round ((timestart + timeend) / 2);
        
        var options1 = options;
        var options2 = {}; 
        for (var key in options) {
            options2.key = options.key;
        }
        options.time = {};
        options2.time = {};
        options1.time.timestart = timestart;
        options1.time.timeend = midTime;
        options2.time.timestart = midTime;
        options2.time.timeend = timeend;
        this.params.sql1 = this.params.sql + this.mapd.getWhere(options1);
        this.params.sql2 = this.params.sql + this.mapd.getWhere(options2);
        this.params.request = "CompareTopKTokens";
        this.params.sort = "false";
        if (this.sourceSetting == "Word")
            this.params.stoptable = "multistop";
        else
            this.params.stoptable = "";
    }
    else {
        this.params.request = "GroupByToken";
    }


    this.params.bbox = this.mapd.map.getExtent().toBBOX();
    var url = this.mapd.host + '?' + buildURI(this.params);
    return url;
  },
  barClickCallback: function(token) {
    
    if (this.sourceSetting == "Word") {
      this.mapd.services.search.termsInput.val(this.mapd.services.search.termsInput.val() + " " + token);
      $('#termsInput').trigger('input');
    }
    else if (this.sourceSetting == "User") {
      this.mapd.services.search.userInput.val(token);
      $('#userInput').trigger('input');
      //this.setMenuItem("Source", "Words", false);
    }
    else if (this.sourceSetting == "Language") {
      this.mapd.services.search.langInput.val(token);
      $('#langInput').trigger('input');
    }
    else if (this.sourceSetting == "Country") {
      //this.mapd.services.search.termsInput.val("country: " + token);
      //this.mapd.services.search.locationCat = "Country";
      $("#locationSelect").val("Country");
      //$("#locationSelect").children().eq(defaultIndex).prop('selected', true);
      this.mapd.services.search.locationInput.val(token);
      $('#locationInput').trigger('input');
      //this.setMenuItem("Source", "Words", false);
    }
    else if (this.sourceSetting == "State") {
      //this.mapd.services.search.locationCat = "State";
      //$("#locState").click();
      $("#locationSelect").val("State");
      console.log("State!");
      this.mapd.services.search.locationInput.val(token);
      $('#locationInput').trigger('input');
      //this.setMenuItem("Source", "Words", false);
    }
    else if (this.sourceSetting == "County") {
      //this.mapd.services.search.locationCat = "County";
      //$("#locCounty").click();
      $("#locationSelect").val("County");
      this.mapd.services.search.locationInput.val(token);
      $('#locationInput').trigger('input');
      //this.setMenuItem("Source", "Words", false);
    }
    else if (this.sourceSetting == "Zip") {
      this.mapd.services.search.termsInput.val("zip: " + token);
      $('#termsInput').trigger('input');
      //this.setMenuItem("Source", "Words", false);
    }
    else if (this.sourceSetting == "OS-App") {
      this.mapd.services.search.originInput.val(token);
      $('#originInput').trigger('input');
      //this.setMenuItem("Source", "Words", false);
    }

    this.mapd.services.search.form.submit();
  },


  addClickedWord: function(event) {
    //console.log(event);
    //var token = event.originalEvent.srcElement.innerText;
    var token = event.target.innerHTML;
    //console.log("circle cloud token: " + token);
    if (token.substring(0,5) != "<span") {
      //console.log(this.mapd);
      //console.log(this.sourceSetting);
      if (this.sourceSetting == "Word") {
        this.mapd.services.search.termsInput.val(this.mapd.services.search.termsInput.val() + " " + token);
        $('#termsInput').trigger('input');
      }
      else if (this.sourceSetting == "User") {
        this.mapd.services.search.userInput.val(token);
        $('#userInput').trigger('input');
        //this.setMenuItem("Source", "Words", false);
      }
    else if (this.sourceSetting == "Country") {
      //$("#locCountry").click();
      $("#locationSelect").val("Country");
      this.mapd.services.search.locationCat = "Country";
      this.mapd.services.search.locationInput.val(token);
      $('#locationInput').trigger('input');
      //this.setMenuItem("Source", "Words", false);
    }
    else if (this.sourceSetting == "State") {
      //$("#locState").click();
      $("#locationSelect").val("State");
      this.mapd.services.search.locationCat = "State";
      this.mapd.services.search.locationInput.val(token);
      $('#locationInput').trigger('input');
      //this.setMenuItem("Source", "Words", false);
    }
    else if (this.sourceSetting == "County") {
      //$("#locCounty").click();
      $("#locationSelect").val("County");
      this.mapd.services.search.locationCat = "County";
      this.mapd.services.search.locationInput.val(token);
      $('#locationInput').trigger('input');
      //this.setMenuItem("Source", "Words", false);
    }
    else if (this.sourceSetting == "Language") {
      //$("#locCounty").click();
      this.mapd.services.search.langInput.val(token);
      $('#langInput').trigger('input');
      //this.setMenuItem("Source", "Words", false);
    }
    /*
    else if (this.sourceSetting == "Zip") {
      this.mapd.services.search.termsInput.val("zip: " + token);
      $('#termsInput').trigger('input');
      //this.setMenuItem("Source", "Words", false);
    }
    */
    else if (this.sourceSetting == "OS-App") {
      this.mapd.services.search.originInput.val(token);
      $('#originInput').trigger('input');
      //this.setMenuItem("Source", "Words", false);
    }
    this.mapd.services.search.form.submit();

    }
  },

  reload: function(options) {
    //$.getJSON(this.getURL(options)).done($.proxy(this.onLoad, this));
  },
  onLoad: function(json) {
    this.displayDiv.empty();
    var n =json.n;
    if (this.modeSetting == "Trends") 
        n = json.n1 + json.n2;

    var numQueryTerms = this.mapd.queryTerms.length;
    this.tokens = json.tokens;
    if (this.displaySetting == "Cloud") {
        $("#cloud").empty();

        //var tokens = json.tokens; 

        var numResultsToExclude = 0;
        if (this.sourceSetting == "Word")
          numResultsToExclude = numQueryTerms; 
        var numTokens = this.tokens.length;
        var wordArray = new Array(numTokens - numResultsToExclude);

        if (this.modeSetting == "Counts") {
            var percentFactor = 100.0 / n;
            var counts = json.counts; 
            var tokenRatio = 1.0 / counts[2 + numResultsToExclude];
            for (var t = numResultsToExclude; t < numTokens; t++) {
              //$('<li>' + tokens[i] + '</li>').appendTo(cloud);
                if (counts[t] == 0 && this.locked == false) {
                    console.log("Breaking at: " + t);
                    wordArray = wordArray.slice(0,t-numResultsToExclude);
                    break;
                }
                var percent = counts[t] * percentFactor;
                var textPercent = "%" + percent.toFixed(3);
                wordArray[t - numResultsToExclude] = {text: this.tokens[t], html: {title: textPercent},  weight: Math.max(Math.min(40, Math.round(counts[t]* tokenRatio * 30.0)), 4)};
            }
        }
        else if (this.modeSetting == "Percents") {
            var percents = json.percents; 
            var tokenRatio = 1.0 / percents[2 + numResultsToExclude];
            for (var t = numResultsToExclude; t < numTokens; t++) {
                var textPercent = "%" + percents[t].toFixed(3);
                wordArray[t - numResultsToExclude] = {text: this.tokens[t], html: {title: textPercent},  weight: Math.max(Math.min(40, Math.round(percents[t]* tokenRatio * 30.0)), 4)};
            }
        }
        else if (this.modeSetting == "Trends") {
            var zScores = json.zScores;
            n = json.n1 + json.n2;
            var tokenRatio = 1.0 / zScores[2 + numResultsToExclude];
            for (var t = numResultsToExclude; t < numTokens; t++) {
                wordArray[t - numResultsToExclude] = {text: this.tokens[t], html: {title: zScores[t]},  weight: Math.max(Math.min(40, Math.round(zScores[t]* tokenRatio * 30.0)), 4)};
            }
        }
        $(this.displayDiv).empty();
        console.log("Array length: " + wordArray.length);
        this.displayDiv.jQCloud(wordArray);
    }
    else if (this.displaySetting == "Bar") {
        var bottomMargin = 90;
        if (this.sourceSetting == "Word" || this.sourceSetting == "State" || this.sourceSetting == "Os-App" || this.sourceSetting == "Language") {
          bottomMargin = 50;
        }

        BarChart.init(this.displayDiv, bottomMargin, $.proxy(this.barClickCallback, this));
        var numResultsToExclude = 0;
        if (this.sourceSetting == "Word")
          numResultsToExclude = numQueryTerms; 
        //console.log("num results to exclude: " + numResultsToExclude);
        BarChart.addData(json, numResultsToExclude, this.modeSetting);
    }
    else if (this.displaySetting == "Scatter") {
        //if (update) 
        ScatterPlot.init(this, this.displayDiv);
        //console.log("at load scatter");
        //console.log(ScatterPlot);
        var numResultsToExclude = 0;
        if (this.sourceSetting == "Word")
          numResultsToExclude = numQueryTerms; 
        ScatterPlot.addData(json, numResultsToExclude, this.modeSetting);
    }

    var label = (this.sourceSetting == "Word") ? "# Words: " : ((this.sourceSetting == "User") ? "# Tweets: " : "# Tweets: ");
    $('#numTokensText').text(label + numberWithCommas(n));
    //console.log("triggering loadend");
    $(this).trigger('loadend');

  }

};

var PointMap = {
  mapd: MapD,
  wms: null,
  colorBy: "none",
  colormap: {"R": [200,0,0], "D": [0,0,255], "I": [200,200,0], "3": [0,200,0], "default": [140,140,140]},

  params: {
    request: "GetMap",
    sql: null,
    bbox: null,
    width: null,
    height: null,
    layers: "point",
    r: 0,
    g: 0,
    b: 255,
    colormap: null,
    x0: "pickup_x",
    y0: "pickup_y",
    x1: "drop_x",
    y1: "drop_y",
    table: "trips",
    rand:0,
    radius: 1,
    format: "image/png",
    transparent: true,
    xVar: null,
    yVar: null
  },

  init: function(wms) {
    this.wms = wms;
    //this.wms.events.register('retile', this, this.setWMSParams);
    $(document).on('pointmapreload', $.proxy(this.reload, this));
    //$(".circle").eq(this.params.radius - 1).addClass("circle-selected");
    $("#pointColorNone").addClass("color-by-cat-selected");
    $("#pointStaticColor").click(function() {
        return false;
    });

    $("#pointColorPicker").minicolors({ 
        changeDelay:50,
        change: $.proxy (function (hex) {
            //console.log(hex);
            var rgb = $("#pointColorPicker").minicolors('rgbObject');
            this.params.r = rgb.r;
            this.params.g = rgb.g;
            this.params.b = rgb.b;
            $(".circle").css('background-color', hex);
            this.reload();
        }, this)
        
    }); 
    
    //click(function() {return false;});
    $(".point-size").click($.proxy(function(e) { 
      //this.params.radius = $(e.target).index() + 1;
      this.params.radius = $(e.target).index() - 1;
      //console.log("this.params.radius: " + this.params.radius);
      $(".point-size").removeClass("point-size-selected");
      $(e.target).addClass("point-size-selected");
      this.reload();
      return false;
    }, this));

    $('.color-by-cat').click($.proxy(function(e) {
      var selectedId = $(e.target).attr("id");
      switch (selectedId) {
        case "pointColorNone":
          this.colorBy = "none";
          $("#pointStaticColor").show();
          break;
        case "pointColorUser":
          this.colorBy = "user_id";
          $("#pointStaticColor").hide();
          break;
        case "pointColorParty":
          this.colorBy = "party";
          $("#pointStaticColor").hide();
          break;
        case "pointColorOS":
          this.colorBy = "origin";
          $("#pointStaticColor").hide();
          break;
        case "pointColorLang":
          this.colorBy = "lang";
          $("#pointStaticColor").hide();
          break;
      }
      $('.color-by-cat').removeClass('color-by-cat-selected');
      $(e.target).addClass('color-by-cat-selected');
      this.reload();
      return false;
    }, this));
    
  },

  setWMSParams: function() {
    //console.log("retile");
    //this.wms.params = OpenLayers.Util.extend(this.wms.params, this.getParams());
  },

  getParams: function(options) {
    //this.params.layers = Vars.datasets[Vars.selectedVar].layer; 
    //this.params.xVar = Vars.datasets[Vars.selectedVar].x;
    //this.params.yVar = Vars.datasets[Vars.selectedVar].y;
    this.params.sql = "select " + Vars.datasets[Vars.selectedVar].x + "," + Vars.datasets[Vars.selectedVar].y;
    if (this.colorBy != "none")
      this.params.sql += ", " + this.colorBy;
    this.params.sql += " from " + this.mapd.table;
    this.params.sql += this.mapd.getWhere(options);
    this.params.colormap = $.toJSON(this.colormap);
    //console.log(this.params.sql);
    return this.params;
  },

  reload: function(options) {
    //console.log("reload");
    this.params.rand = Math.round(Math.random() * 10000);
    this.wms.mergeNewParams(this.getParams(options));
  }
};

var BaseMap = {
  mapd: MapD,
  baseLayerNames: [],
  currentLayer: null,
  defaultLayer: null,

  init: function() {
    this.currentLayer = map.getLayersBy("visibility",true)[0].name;
    this.defaultLayer = this.currentLayer;
    var layers = map.layers;
    var baseMenu = $("#baseMenu");
    for (var v = 0; v < layers.length; v++) {
      if (layers[v].isBaseLayer && layers[v].name != "Blank") {
        this.baseLayerNames.push(layers[v].name);
          $("<li></li>")
          .attr("class", "base-choice")
          //.html("<span>" + layers[v].name + '</span><span class="checkmark">\&#x2713</span>')
          .html("<span>" + layers[v].name + "</span>")
          .appendTo(baseMenu);
      }
    }
    //console.log(this.baseLayerNames);
    
    $(".base-choice").click($.proxy(function(e) { 
      this.currentLayer = $(e.target).text();
      map.setBaseLayer(map.getLayersByName(this.currentLayer)[0]);
    }, this));
  }
}

  

var HeatMap = {
  mapd: MapD,
  wms: null,
  params: {
    request: "GetMap",
    sql: null,
    bbox: null,
    width: null,
    height: null,
    layers: "heatmap",
    maxval: "auto", 
    min: 0.2,
    blur: 25,
    level: 50,
    colorramp: "green_red",
    format: "image/png",
    transparent: true,
    xVar: null,
    yVar: null
  },

  init: function(wms) {
    this.wms = wms;
    this.wms.events.register('retile', this, this.setWMSParams);
    $(document).on('heatmapreload', $.proxy(this.reload, this));
    $.ajaxSetup({
        async: false
    });
    $.getJSON(this.mapd.host + '?' + 'REQUEST=GetColorRamps').done($.proxy(this.processColorRamps,this));
    
    $.ajaxSetup({
        async: true
    });



    $("#blurSlider").slider({
      min:0,
      max:37,
      value:25,
      stop: $.proxy(function(e, ui) {
        this.params.blur = ui.value;
        this.reload();
      }, this)
    });
    
    /*
    var ramp2 = $("#green_red_ramp2").get(0);
    var ctx2 = ramp2.getContext("2d");
    var grd2 = ctx2.createLinearGradient(0, 0, 100, 0);
    grd2.addColorStop(0, "green");
    grd2.addColorStop(1, "red");
    ctx2.fillStyle=grd2;
    ctx2.fillRect(20,20,100,50);
    */
    /*
    $("#levelSlider").slider({
      min:0,
      max:100,
      value:50,
      stop: $.proxy(function(e, ui) {
        this.params.level = ui.value;
        this.reload();
      }, this)
    })
    */
  },

  processColorRamps: function(json) {
    //console.log(json);
    var rampsCont = $("#colorRamps");
    var x = 80;
    var y = 20;
    for (var i = 0; i < json.length; ++i) {
      //console.log(json[i]);
      var canvas = $('<canvas></canvas>').attr("id", json[i].name).attr("class", "color-ramp").prop("width", x).prop("height",y).appendTo(rampsCont).click($.proxy(this.changeRamp,this)).get(0);
      //console.log(canvas);
      var context = canvas.getContext("2d");
      context.rect(0,0,x-2,y-2);
      var gradient = context.createLinearGradient(0, 0, x, 0);
      var colors = json[i].colors;
      for (var c = 0; c != colors.length; ++c) {
        //console.log(json[i].name + " - " + colors[c].stop + " (" + colors[c].r + "," + colors[c].g + "," + colors[c].b + ")");
        gradient.addColorStop(colors[c].stop, "rgb(" + colors[c].r +"," + colors[c].g +"," + colors[c].b+")");
      }
      context.fillStyle=gradient;
      context.fill();

    }
    $("#green_red").addClass("ramp-selected");



    //rampsCont.append("<div style='clear: both;'></div>");
    /*
    var canvas = $("#green_red_ramp").get(0);
    var context = canvas.getContext("2d");
    context.rect(0,0,x,50);
    var gradient = context.createLinearGradient(0, 0, x, 0);
    gradient.addColorStop(0, "green");
    gradient.addColorStop(0.5, "orange");
    gradient.addColorStop(1, "red");
    context.fillStyle=gradient;
    context.fill();
    */


  },
 
  changeRamp: function(e) {
    this.setRamp(e.target.id, true);
    /*
    this.params.colorramp = e.target.id;
    $(".color-ramp").removeClass("ramp-selected");
    $(e.target).addClass("ramp-selected");
    this.reload();
    */
  },
  setRamp: function(rampName, reload) {
    this.params.colorramp = rampName;
    $(".color-ramp").removeClass("ramp-selected");
    $("#" + rampName).addClass("ramp-selected");
    //this.wms.params = OpenLayers.Util.extend(this.wms.params, this.getParams());
    //if (reload)
    this.reload();
  },

  setWMSParams: function() {
    //this.wms.params = OpenLayers.Util.extend(this.wms.params, this.getParams());
  },

  getParams: function(options) {
    this.params.xVar = Vars.datasets[Vars.selectedVar].x;
    this.params.yVar = Vars.datasets[Vars.selectedVar].y;
    if (options == undefined || options == null) 
      options = {splitQuery: true};
    else
      options.splitQuery = true;

    this.params.sql = "select " + Vars.datasets[Vars.selectedVar].x + "," + Vars.datasets[Vars.selectedVar].y;
    //this.params.sql = "select goog_x, goog_y from " + this.mapd.table;
    //this.params.sql = "select goog_x, goog_y"; //from " + this.mapd.table;
    //var queryArray = this.mapd.getWhere({splitQuery: true});
    var queryArray = this.mapd.getWhere(options);
    if (queryArray[0])
      this.params.sql += "," + queryArray[0];
    this.params.sql += " from " + this.mapd.table + queryArray[1];

    if (options.heatMax != undefined && options.heatMax != null && isNaN(options.heatMax) == false) 
      this.params.maxval = options.heatMax;
    else
      this.params.maxval = "auto"; 

    //console.log("FINAL");
    //console.log(this.params.sql);
    return this.params;
  },

  reload: function(options) {
    this.wms.mergeNewParams(this.getParams(options));
  }
};

/*
var GetNearestTweet = {
  mapd: MapD,
*/
var TweetClick = 
{
  mapd: MapD,
  pixelTolerance: 5,
  params: {
    request: "GetFeatureInfo",
    sql: null,
    bbox: null,
    xVar: null,
    yVar: null

  },
  clickControl: null,
  popup: null,

  init:function() {
    /*
    OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
      defaultHandlerOptions: {
        'single': true,
         'double': false,
         'pixelTolerance': 0,
         'stopSingle': false,
         'stopDouble': false
        },
        initialize: function (options) {
          this.handlerOptions = OpenLayers.Util.extend( {}, this.defaultHandlerOptions
          );
          this.handler = new OpenLayers.Handler.Click(
              this, {
                  'click': this.trigger
                }, this.handlerOptions
            );
        },
      trigger: function(e) {
          console.log('at click');
          if (mapd.services.settings.pointOn) {
            $.getJSON(this.getURL()).done($.proxy(this.onTweet,this));
          }
        }


    });
    */
    /*
    this.clickControl = new OpenLayers.Control.Click();
    map.addControl(this.clickControl);
    this.clickControl.activate();
    */
    },

      handleClick: function(e) {
        //console.log("handleclick");
        $.getJSON(this.getURL(e)).done($.proxy(this.onTweet,this));
      },

        
      getURL: function(e) {
        this.params.xVar = Vars.datasets[Vars.selectedVar].x;
        this.params.yVar = Vars.datasets[Vars.selectedVar].y;
        this.params.sql = "select " + Vars.datasets[Vars.selectedVar].x + "," + Vars.datasets[Vars.selectedVar].y +"," + Vars.datasets[Vars.selectedVar].time + "," + Vars.datasets[Vars.selectedVar].aux.user + "," + Vars.datasets[Vars.selectedVar].aux.text + ", amount from " + this.mapd.table;
        this.params.sql += this.mapd.getWhere();
        var lonlat = this.mapd.map.getLonLatFromPixel(e.xy);
        //console.log(lonlat);
        this.params.sql += " ORDER BY orddist(point(" + Vars.datasets[Vars.selectedVar].x + "," +  Vars.datasets[Vars.selectedVar].y + "), point(" + lonlat.lon +"," + lonlat.lat + ")) LIMIT 1";
        //console.log(this.params.sql);
        var pointBuffer = this.mapd.map.resolution * this.pixelTolerance;
        //console.log("pointbuffer");
        //console.log(pointBuffer);

        this.params.bbox = (lonlat.lon-pointBuffer).toString() + "," + (lonlat.lat-pointBuffer).toString() +"," + (lonlat.lon+pointBuffer).toString() + "," + (lonlat.lat+pointBuffer).toString(); 
        var url = this.mapd.host + '?' + buildURI(this.params);
        //console.log(url);
        return url;
      },

      onTweet: function(json) {
        //console.log("ontweet");
        //console.log(json);
        if (json != null) {
            var tweet = json.results[0];
            this.addPopup(tweet[Vars.datasets[Vars.selectedVar].x], tweet[Vars.datasets[Vars.selectedVar].y], tweet);
        }
      },


      addPopup: function(x, y, tweet) {
        //var popupLatLon = new OpenLayers.LonLat(x, y);
        //var popupSize = new OpenLayers.Size(50, 50);
        //var popup = new OpenLayers.Popup.Anchored(null, popupLatLon, popupSize, html);
        //var html = "<p>" + tweet.tweet_text + "<\p>";
        var container = $('<div></div>').addClass("tweet-popup");
        //var container = $('<div></div>').addClass("tweet-container");
        var header = $('<div></div>').addClass("popup-header").appendTo(container);
        var money = $('<span></span>').addClass("popup-money").appendTo(container);
        var content = $('<a></a>').addClass("popup-content").appendTo(container);
        var profile = $('<a></a>').addClass("popup-profile").appendTo(header);

        //var profile = $('<a></a>').addClass("tweet-profile").appendTo(header);
        var time = new Date(tweet[Vars.datasets[Vars.selectedVar].time] * 1000);
        var timeText = $('<div></div>').addClass("popup-time").appendTo(header);
        timeText.html(time.toLocaleDateString());
        $('<div style="clear: both;"></div>').appendTo(header);
        money.html('$' + tweet.amount + ' --> ');
        content.html(tweet[Vars.datasets[Vars.selectedVar].aux.text]);
        $('<div style="clear: both;"></div>').appendTo(container);
        console.log("Content: " + tweet[Vars.datasets[Vars.selectedVar].aux.text]);
        //content.html(twttr.txt.autoLink(tweet.tweet_text, {targetBlank: true}));
        profile.html(tweet[Vars.datasets[Vars.selectedVar].aux.user]);
        //profile.attr('href', 'https://twitter.com/' + tweet.sender_name);
        //profile.attr('target', '_none');

        if (this.popup != null)
          this.popup.destroy();

        this.popup = new OpenLayers.Popup.FramedCloud("tweet",
         new OpenLayers.LonLat(x, y),
         //new OpenLayers.Size(300,150),
         null,
         container.html(), 
         null,
         true);

        this.mapd.map.addPopup(this.popup);
        this.popup.updateSize();
        $('.popup-profile, .username').click( $.proxy(function(e) {
          var userName = $(e.target).html();
          //console.log($(this).html());
          this.mapd.services.search.termsInput.val("");
          this.mapd.services.search.userInput.val(userName);
          $('#userInput').trigger('input');
          this.mapd.services.search.form.submit();
        }, this));

        


      }



    }



var Tweets = 
{
  mapd: MapD,
  sortDiv: null,  
  viewDiv: null,
  params: {
    request: "GetFeatureInfo",
    sql: null,
    bbox: null,
    xVar: null,
    yVar: null
  },
  defaultPointStyle: null,
  tempPointStyle: null,
  pointStyleMap: null,
  mouseOverFeatureControl: null,
  selectFeatureControl: null,
  sortDesc: null,
  topOffset: null,
  bottomOffset: null,
  startRecordSpan:null,
  endRecordSpan:null,
  numDisplayTweets:null,
  minId: 0,
  startRecord: 0,
  endRecord: 1,
  scrollTop:0,
  append: false,
  numTweets: null,
  numResults: null,

init: function(sortDiv, viewDiv) {
    //console.log("SortDiv: " + sortDiv);
    //console.log(viewDiv);
    this.sortDiv = sortDiv;
    this.viewDiv = viewDiv;
    this.defaultPointStyle = new OpenLayers.Style({
    'fillColor': '#C00',
    'fillOpacity': 0.0,
    //'strokeColor': '#000',
    'strokeWidth': 0,
    'pointRadius': 0 
    });
    this.tempPointStyle = new OpenLayers.Style({
    'fillColor': '#C00',
    //'externalGraphic': 'img/twitter-bird.png', 
    'externalGraphic': 'img/target.png', 
    'strokeColor': '#000',
    'fillOpacity': 1.0,
    'strokeWidth': 1,
    'pointRadius': 15 
    });


    this.selectedPointStyle = new OpenLayers.Style({
      //graphicName: "star",
      pointRadius: 5,
      fillOpacity: 1.0,
      strokeColor: "#000",
      fillColor: '#FD4E01'
      //fillColor: '${selectColor}'
    });
    
    this.pointStyleMap = new OpenLayers.StyleMap({
    'default': this.defaultPointStyle,
    'temporary': this.tempPointStyle,
    'select': this.selectedPointStyle
    });

    this.sortDesc = true;

    $("<div id='sortPref'>Showing results <span id='startRecord'></span>-<span id='endRecord'></span> of <span id='resultsCount'></span> - Sort by <a href='javascript:void(0)' id='oldSort'>Oldest</a> <a href='javascript:void(0)' id='newSort'>Newest</a></div>").appendTo(this.sortDiv);
    $('#oldSort').click($.proxy(this.oldSortFunc, this));
    $('#newSort').click($.proxy(this.newSortFunc, this));
    this.viewDiv.scroll($.proxy(this.onScrollFunc,this));
    this.startRecordSpan = $("#startRecord");
    this.endRecordSpan = $("#endRecord");


  },

    onScrollFunc: function() {
      this.topOffset = this.viewDiv.offset().top + 1;
      this.bottomOffset = this.topOffset + this.viewDiv.height() - 1; 
        var oldScrollTop = this.scrollTop;
        this.scrollTop = this.viewDiv.scrollTop();
        var containers = $('.tweet-container');
        var numContainers = containers.length;
        var scrollDown = this.scrollTop >= oldScrollTop ? true : false;
        //console.log(scrollDown);
        if (scrollDown) {
            for (var record = this.startRecord; record < numContainers; record++) {
                //console.log (record + " " + containers.eq(record).offset().top);
                if (containers.eq(record).offset().top >= this.topOffset) {
                    this.startRecord = record; 
                    break;
                }
            }
            for (var record = this.endRecord; record < numContainers; record++) {
                //console.log (record + " " + containers.eq(record).offset().top);
                if (containers.eq(record).offset().top >= this.bottomOffset) {
                    this.endRecord = record - 1; 
                    break;
                }
            }
        }
        else {
            for (var record = this.startRecord; record >= 0 ; record--) {
                //console.log (record + " " + containers.eq(record).offset().top);
                var containerOffset = containers.eq(record).offset().top;
                if (containerOffset <= this.topOffset) {
                    if (containerOffset < this.topOffset)
                        this.startRecord = record + 1;
                    else
                        this.startRecord = record; 
                    break;
                }
            }
            for (var record = this.endRecord; record >= 0 ; record--) {
                //console.log (record + " " + containers.eq(record).offset().top);
                var containerOffset = containers.eq(record).offset().top;
                if (containerOffset <= this.bottomOffset) {
                    if (containerOffset < this.bottomOffset)
                        this.endRecord = record;
                    else
                        this.endRecord = record; 
                    break;
                }
            }
        }

        this.startRecordSpan.html(Math.min(this.startRecord+1, this.numTweets));
        this.endRecordSpan.html(Math.min(this.endRecord+1, this.numTweets));



        /*
        for (var offset = 0; offset < numContainers; offset++) {
            if (this.startRecord - offset) 


        console.log("Length " + numContainers);
        for (var i = 0; i < numContainers; i++) {
            //console.log("i: " + i + " " +  containers.eq(i).offset().top);
            console.log(this.topOffset);
            if (containers.eq(i).offset().top > this.topOffset) {
                this.startRecord = i; 
                this.startRecordSpan.html(i+1);
                break;
            }
        }
        */
    },


  oldSortFunc: function () { 
    if (this.sortDesc == true) {
        this.sortDesc = false;
        this.reload();
        $(this.viewDiv).scrollTop(0);
        
      }
   },
   newSortFunc: function () { 
      if (this.sortDesc == false) {
        this.sortDesc = true;
        this.reload();
        $(this.viewDiv).scrollTop(0);
      }
   },

  getTimeRangeURL: function() {
    this.params.sql = "select min(date), max(date) from " + this.mapd.table;
    this.params.bbox = this.mapd.map.getExtent().toBBOX();
    var url = this.mapd.host + '?' + buildURI(this.params);
    return url;
  },

  getURL: function(options) {
    this.params.xVar = Vars.datasets[Vars.selectedVar].x;
    this.params.yVar = Vars.datasets[Vars.selectedVar].y;
    if (options.minId != null) {
      this.params.sql = "select id, goog_x, goog_y, time, sender_name, tweet_text from " + this.mapd.table;
      this.append = true;
    }
    else {
      this.params.sql = "select goog_x, goog_y, time, sender_name, tweet_text from " + this.mapd.table;
      this.append = false;
    }
    this.params.sql += this.mapd.getWhere(options);
    //var sortDesc = this.sortDesc;
    //if (options.minId != null)
      //sortDesc = false;
    if (options.minId != null)
        this.params.sql += " order by id " + (this.sortDesc == true ? "desc" : "") +  " limit 500";
    else
        this.params.sql += " order by time " + (this.sortDesc == true ? "desc" : "") +  " limit 100";
    this.params.bbox = this.mapd.map.getExtent().toBBOX();
    //console.log(this.params.sql);
    var url = this.mapd.host + '?' + buildURI(this.params);
    return url;
  },

  reload: function(getMinId) {
    var options = {}
    if (getMinId == true) {
      options.minId =this.minId;
    }
    //console.log(options);
    //$.getJSON(this.getURL(options)).done($.proxy(this.onTweets, this));
  },
  //oldSortFunc :function () { 
  //    console.log("oldsort");
  //    if (this.sortDesc == true) {
  //      console.log ("old sorting");
  //      this.sortDesc = false;
  //      this.reload();
  //    }
  // },
   
  onTweets: function(json) {
      tweetLast = tweetNow;
      tweetNow = new Date().getTime();
      var delay = tweetNow - tweetLast;
      //console.log("Tweet delay: " + delay)

    if (json == null || json.results.length == 0) {
      if (this.append == false) {
        this.viewDiv.empty();
        this.startRecord = 0;
        this.endRecord = 1;
        this.numTweets = 0; 
        this.numDisplayTweets = 0;
        $("#resultsCount").html(numberWithCommas(this.numTweets));
      }
      console.log("returning");

      return;
    }

      //console.log("This numDisplaytweets: " + this.numDisplayTweets);
    var prepend = true;
    //if (!("id" in json.results[0])) {
    if (this.append == false) {
      prepend = false;
      this.viewDiv.empty();
      this.startRecord = 0;
      this.endRecord = 1;
      this.numTweets = json.n;
      this.numDisplayTweets = json.results.length; 
    }
    else { 
      this.numTweets += json.n;
      this.numDisplayTweets += json.results.length; 
      if (this.numDisplayTweets > 300) {
        $(".tweet-container").slice(300).remove();
        this.numDisplayTweets = 300;
        }
      this.mapd.services.realtime.addData(json.results);
      }



    if (this.sortDesc) {
      $("#newSort").addClass("link-visited");
      $("#oldSort").removeClass("link-visited");
    }
    else {
      $("#oldSort").addClass("link-visited");
      $("#newSort").removeClass("link-visited");
    }

    //$('#oldSort').click($.proxy(this.oldSortFunc, this));
    var container = $('<div></div>').prependTo(this.viewDiv);
    if (json == null) return;
    if (vectors) map.removeLayer(vectors);
    vectors = new OpenLayers.Layer.Vector("Vector Layer", {'displayInLayerSwitcher': false});
    vectors.styleMap = this.pointStyleMap;
    this.mouseOverFeatureControl = new OpenLayers.Control.SelectFeature (vectors, 
      { hover: false,
        renderIntent: "temporary"
        /* eventListeners: { 
          featurehighlighted: this.onPointHover,
          featureunhighlighted: this.offPointHover
      }
      */
    });
    map.addControl(this.mouseOverFeatureControl);
    this.mouseOverFeatureControl.activate();

    this.selectFeatureControl = new OpenLayers.Control.SelectFeature (vectors, 
      {
        //renderIntent: "select"
      });

    map.addControl(this.selectFeatureControl);
    this.selectFeatureControl.activate();

    map.addLayer(vectors);
    vectors.setZIndex(Number(pointLayer.getZIndex()) + 1);
    if (markers) map.removeLayer(markers);
    markers = new OpenLayers.Layer.Markers("Markers Layer", {'displayInLayerSwitcher': false});
    map.addLayer(markers);
    markers.setZIndex(Number(vectors.getZIndex()) + 1);

    
    $("#resultsCount").html(numberWithCommas(this.numTweets));
    this.topOffset = this.viewDiv.offset().top + 1;
    this.bottomOffset = this.topOffset + this.viewDiv.height(); 

    var results = json.results;
    var numResults = results.length;
    var delay = Math.round(timeUpdateInterval / numResults);
    //console.log("delay: " + delay);
    badCount = 0;
   
    if (this.mapd.fullScreen == false) { 
        for (var i = 0; i < numResults; i++)
        {
              //var result = results[i];
              //if (!results[i] || !resulttweet_text)
              //  continue;
              this.add(results[i],i,container);
              var timeDelay = delay * i;
              //setTimeout($.proxy(this.add(result, i, container), this), timeDelay);
              //setTimeout(this.add(result, i, container), timeDelay);
              //setTimeout(function() {Tweets.add(result, i, container);}, timeDelay);
        }
        //console.log(badCount +"/" + numResults);
    }

    $('.tweet-profile, .username').click( $.proxy(function(e) {
      var userName = $(e.target).html();
      //console.log($(this).html());
      this.mapd.services.search.termsInput.val("");
      this.mapd.services.search.userInput.val(userName);
      $('#userInput').trigger('input');
      this.mapd.services.search.form.submit();
    }, this));
    this.scrollTop = 0;
    this.onScrollFunc();
    /*
    this.startRecordSpan.html(this.startRecord + 1);
    this.endRecordSpan.html(this.endRecord + 1);
    */

  },

  add: function(tweet, index, div) {
    if (!("id" in tweet))
        badCount++;
    var user = tweet.sender_name;
    var text = tweet.tweet_text;
    if (tweet.id > Tweets.minId)
      Tweets.minId = tweet.id;
    //tweet.time = tweet.time - 4 * 60 * 60; // hack: original data set is ahead by 4 hours.
    var time = new Date(tweet.time * 1000);
    var x = tweet.goog_x;
    var y = tweet.goog_y;
    
    var container = $('<li></li>').addClass("tweet-container").appendTo(div);
    var header = $('<div></div>').addClass("tweet-header").appendTo(container);
    var content = $('<p></p>').addClass("tweet-content").appendTo(container);
    var profile = $('<a></a>').addClass("tweet-profile").appendTo(header);
    var timeText = $('<div></div>').addClass("tweet-time").appendTo(header);
    timeText.html(time.toLocaleString());
    content.html(twttr.txt.autoLink(text, {targetBlank: true}));
    content.data({"text":text});
    profile.html(user);
    profile.attr('href', 'https://twitter.com/' + user);
    profile.attr('target', '_none');

    var urls = twttr.txt.extractUrls(text);
    var hashtags = twttr.txt.extractHashtags(text);
    var users = twttr.txt.extractMentions(text);
    //console.log(hashtags)
    //console.log(urls)
    //console.log(users)
    var selectColor = Tweets.getRandomColor(); 
    container.data({tweet: tweet, urls: urls, hashtags: hashtags, users: users, selectColor: selectColor});
    container.mouseenter($.proxy(Tweets.onMouseEnter,Tweets, container));
    container.mouseleave($.proxy(Tweets.onMouseLeave,Tweets, container));
    container.click($.proxy(Tweets.onClick,Tweets,container));
    //container.mouseup($.proxy(this.onUnClick,this,container));
    this.addPoint(x,y,index, selectColor);

  },
 

  onPointHover: function(e) {
    $(".tweet-container").eq(e.feature.data.index).addClass("container-hover");
    //$(".tweet-container").eq(e.feature.data.index).addClass("tweet-container > hover");
  },
  offPointHover: function(e) {
      $(".tweet-container").eq(e.feature.data.index).removeClass("container-hover");
  },

  addPopup: function(x, y, html) {
    var popupLatLon = new OpenLayers.LonLat(x, y);
    var popupSize = new OpenLayers.Size(50, 50);
    var popup = new OpenLayers.Popup.Anchored(null, popupLatLon, popupSize, html);
    this.mapd.map.addPopup(popup);
    popup.updateSize();
    //console.log(popup);
  },

  addPoint: function(x,y,index, selectColor) {
    var point = new OpenLayers.Geometry.Point(x,y);
    var featurePoint = new OpenLayers.Feature.Vector(point, {index: index, selectColor: selectColor});
    vectors.addFeatures([featurePoint]);
  }, 

  getRandomColor: function() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ )
      color += letters[Math.round(Math.random() * 15)];
      return color;
  },

  onClick: function(container) {
    var index = $(container).index();
    var x = vectors.features[index].geometry.x;
    var y = vectors.features[index].geometry.y;
    var json = {}
    json.x = x;
    json.y = y;
    var date = new Date($(".tweet-time",container).html());
    json.time = date.getTime() / 1000;
    json.sender_name=$(".tweet-profile",container).html();
    json.tweet_text = $(".tweet-content",container).data().text; 
    TweetClick.addPopup(x,y,json);
    /*
    if (OpenLayers.Util.indexOf(vectors.selectedFeatures,vectors.features[index]) == -1)
      this.selectFeatureControl.select(vectors.features[index]);
    else
      this.selectFeatureControl.unselect(vectors.features[index]);
    */
  },

  // this points to <li> container 
  onMouseEnter: function(container) {
    //console.log(this);
    var index = $(container).index();
    this.mouseOverFeatureControl.highlight(vectors.features[index]);
    /*
    var tweet = $(container).data('tweet');
    console.log(tweet);
    var user = tweet.sender_name;
    var x = tweet.goog_x;
    var y = tweet.goog_y;
    var label = new OpenLayers.Label(x, y, user, null, null, null);
    label.addTo(markers);
    $(label.getIcon()).addClass('label-user');
    $(container).data('label', label);
    */
  },

  // this points to <li> container 
  onMouseLeave: function(container) {
    var index = $(container).index();
    //if (OpenLayers.Util.indexOf(vectors.selectedFeatures,vectors.features[index]) == -1)
    if (OpenLayers.Util.indexOf(vectors.selectedFeatures,vectors.features[index]) == -1)
      this.mouseOverFeatureControl.unhighlight(vectors.features[index]);
    else {
      // need to reselect element
      this.selectFeatureControl.select(vectors.features[index]);
    }
    //$(container).data('label').erase();
  },
};

var GeoCoder = {
  map: null,
  _geocoder: new google.maps.Geocoder(),
  address: null,
  status: null,

  setMap: function(map) {
    this.map = map;
  },

  geocode: function(address) {
   console.log("at geocode");
    this.address = address;
    this._geocoder.geocode({'address': address}, $.proxy(this.onGeoCoding, this));
  },

  onGeoCoding: function(data, status) {
    //console.log('in onGeoCoding');
    this.status = status;
    if (status != google.maps.GeocoderStatus.OK) {
      this.bbox = null;
      //console.log('Geocoding service failed:', status);
      return;
    }
    if (data.length != 1)  {
      //console.log('Geocoding service returned', data.length);
    }
    var viewport = data[0].geometry.viewport;
    var ne = viewport.getNorthEast();
    var sw = viewport.getSouthWest();
    var bounds = new OpenLayers.Bounds(sw.lng(), sw.lat(), ne.lng(), ne.lat());
    var proj = new OpenLayers.Projection("EPSG:4326");
    bounds.transform(proj, this.map.getProjectionObject());
    $(document).trigger({type: 'geocodeend', bounds: bounds});
  }
}

var Search = {
  geocoder: GeoCoder,
  mapd: MapD,
  map: null,
  form: null,
  locateButton: null,
  zoomForm: null,
  curLoc: null,
  termsInput: null,
  userInput: null,
  locationCat: "Country",
  locationCatMenu: null,
  locationInput: null,
  langInput: null,
  partyInput: null,
  seatInput: null,
  zoomInput: null,
  originInput: null,
  terms: '',
  user: '',
  location: '',
  zoomTo: null, 
  zoomToChanged: false,
  io: null,
  searchEmpty: true,

  init: function(map, form, zoomForm, curLoc, termsInput, userInput, locationCatMenu, locationInput, partyInput, seatInput, langInput, zoomInput, originInput) {
    $(document).on('propertychange keyup input paste', 'input.search-input', function() {
      var io = $(this).val().length ? 1: 0;
      console.log("at icon clear");
      console.log(io);

      $(this).next('.iconClear').stop().fadeTo(300,io);
      }).on('click', '.iconClear', function() {
        $(this).delay(300).fadeTo(300,0).prev('input').val('');

        Search.form.submit();
      });

    $(document).on('propertychange keyup input paste', 'input.adv-search-input', function() {
      var io = $(this).val().length ? 1: 0;

      $(this).next('.iconClear').stop().fadeTo(300,io);
      }).on('click', '.iconClear', function() {
        $(this).delay(300).fadeTo(300,0).prev('input').val('');

        Search.form.submit();
      });


    this.map = map;
    this.form = form;
    this.zoomForm = zoomForm;
    this.curLoc = curLoc;
    this.termsInput = termsInput;
    this.userInput = userInput;
    this.locationInput = locationInput;
    this.locationCatMenu = locationCatMenu;
    this.langInput = langInput;
    this.partyInput = partyInput;
    this.seatInput = seatInput;
    this.zoomInput = zoomInput;
    this.originInput = originInput;
    this.geocoder.setMap(this.map);
    this.form.submit($.proxy(this.onSearch, this));
    this.zoomForm.submit($.proxy(this.onSearch, this));
    this.curLoc.click($.proxy(this.getPosition, this));
    this.loadOSMenu();
    this.loadLangMenu();
    this.locationCatMenu.change($.proxy(function(e) {
       this.locationCat = this.locationCatMenu.val(); //e.target.firstChild.innerText; 

       //var text = this.locationCat + " ▾";
       //$("#locationSelect").html(text);
       //$.getJSON(this.getLocNamesURL()).done($.proxy(this.loadLocMenu, this));
       return false;
    }, this));
    

    $(this.partyInput).change($.proxy(this.onSearch, this));
    $(this.seatInput).change($.proxy(this.onSearch, this));

    $("#searchMenu input").click(function() {
        return false;
    });


    $(document).on('geocodeend', $.proxy(this.onGeoCodeEnd, this));
    this.map.events.register('moveend', this, this.onMapMove);

     $.getJSON(this.getLocNamesURL()).done($.proxy(this.loadLocMenu, this));
     $.getJSON(this.getRecNamesURL()).done($.proxy(this.loadRecMenu, this));


  },

  getLocNamesURL: function() {
     var params = {request:"GetFeatureInfo"};
     params.sql = "select name from " + this.locationCat + "_data";
     var url = this.mapd.host + '?' + buildURI(params);
     return url;
  },

  getRecNamesURL: function() {
     var params = {request:"GetFeatureInfo"};
     params.sql = "select recipient_name from recipient_data where n > 1000 order by n desc";
     var url = this.mapd.host + '?' + buildURI(params);
     return url;
  },

   loadLangMenu: function() {
      var names = ["en", "es", "id", "pt", "tr", "ar", "ja", "und", "fr", "tl", "ru", "th", "nl", "it", "ko", "de", "et", "sv", "vi", "sl", "ht", "lv", "pl", "sk", "da", "hu", "he", "fi", "no", "zh", "bg", "el", "lt", "fa", "is", "uk", "ur", "hi", "ta", "ne", "bn", "ka", "hy", "lo", "si"];
    $("#langInput").autocomplete({
        source:names,
        position: {my: "right top", at: "right top"}
    });
  },

   loadOSMenu: function() {
     var names = ["iOS", "Android", "Blackberry", "Foursquare", "Instagram", "Other"];
    $("#originInput").autocomplete({
        source:names,
        position: {my: "right top", at: "right top"}
    });
   },

    loadLocMenu: function(json) {
     var names = [];
     for (i in json.results)
       names.push(json.results[i].name);
 
     $("#locationInput").autocomplete({
         source:names
     });
    },

    loadRecMenu: function(json) {
     var names = [];
     for (i in json.results)
       names.push(json.results[i].recipient_name);
 
     $("#recipientInput").autocomplete({
         source:names
     });
    },


   getPosition: function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(this.zoomToPosition);
    }
    else{ 
      console.log("geolocation not supported!")
    }
   },

   zoomToPosition: function(position) {
    console.log(position);
    var center = new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
    map.setCenter(center, 16);
    MapD.services.tweets.addPoint(center.x, center.y, 100, "#f00"); 

   },

  onSearch: function() {
    console.log("on search"); 
    var terms = this.termsInput.val();
    //var origin = this.originInput.val();
    var origin = "";
    var lang = this.langInput.val(); 
    var party = this.partyInput.val();
    var seat = this.seatInput.val();
    this.searchEmpty = (terms == "" && this.userInput.val() == "" && origin == "" && lang == "" && party == "" && seat == "");
    if (this.searchEmpty || (this.mapd.services.topktokens.sourceSetting == "Word"))    {
      $("#PercentsMode").prop('disabled',true);
      $("#ModeButtons").buttonset("refresh");
      //$("#dataModePercents").children().prop('disabled',true);
      //$("#dataModePercents").hide();
      //$("#dataModePercents").hide();
      this.mapd.services.topktokens.setMenuItem("Mode", "Counts", false);
    }
    else {
      //$("#dataModePercents").prop('disabled',false);
      $("#PercentsMode").prop('disabled',false);
      $("#ModeButtons").buttonset("refresh");
      //$("#dataModePercents").show();
      //this.mapd.services.topktokens.setMenuItem("Mode", "Percents", false);
    }
    /*   
    if (this.userInput.val().length > 0) {
      this.mapd.services.topktokens.setMenuItem("Source", "Word", false);
    }
    */
    /*
    else if (terms.substring(0,8) == "country:" || terms.substring(0,6) == "state:" || terms.substring(0,7) == "county:" || terms.substring(0,4) == "zip:") {
        var colonPosition = terms.indexOf(":");
        //console.log(colonPosition);
        if (terms.substring(1,colonPosition) == this.mapd.services.topktokens.sourceSetting.substring(1))
          this.mapd.services.topktokens.setMenuItem("Source", "Word", false);
    }
    else if (terms.substring(0,7) == "origin:") { 
      this.mapd.services.topktokens.setMenuItem("Source", "Word", false);
    }
    */


    /*
    else if (terms.substring(0,6) == "state:") {
      this.mapd.services.topktokens.setMenuItem("Source", "Word", false);
    }
    else if (terms.substring(0,7) == "county:") {
      this.mapd.services.topktokens.setMenuItem("Source", "Word", false);
    }
    else if (terms.substring(0,4) == "zip:") {
      this.mapd.services.topktokens.setMenuItem("Source", "Word", false);
    }
    else if (terms.substring(0,7) == "origin:") { 
      this.mapd.services.topktokens.setMenuItem("Source", "Word", false);
    }
    */

    var zoomTo = this.zoomInput.val();
    console.log(zoomTo);
    this.zoomToChanged = this.zoomTo != zoomTo;
    this.terms = terms;
    this.user = this.userInput.val();
    this.location = this.locationInput.val() 
    this.mapd.setQueryTerms(this.terms);
    this.mapd.setUser(this.user);
    this.mapd.setOrigin(origin);
    this.mapd.setLang(lang);
    this.mapd.setParty(party);
    this.mapd.setSeat(seat);
    this.mapd.setLocation(this.locationCat, this.location);
    //console.log ("user: " + this.user);
    if (this.zoomToChanged) {
      this.zoomTo = zoomTo;
      console.log("about to zoom");
      this.geocoder.geocode(this.zoomTo);
      return false;
    }
    //console.log("After this location changed");
    $(document).trigger({type: 'mapdreload'});
    $(document).trigger({type: 'pointmapreload'});
    $(document).trigger({type: 'heatmapreload'});
    return false;
  },

  onGeoCodeEnd: function(event) {
    //console.log('in onGeoCodeEnd');
    var bounds = event.bounds;
    this.map.zoomToExtent(bounds);
  },

  onMapMove: function() 
  {
    //console.log('in onMapMove');
    if (this.zoomToChanged)
      this.zoomToChanged = false;
    else {
      this.zoomTo = "";
      this.zoomInput.val("");
    }
  },
}

var Animation = {
  mapd: MapD,
  pointLayer: null,
  heatLayer: null,
  wordGraph: null,
  choropleth: null,
  heatMax: null,
  oldRadius: null,
  //pointMap: null,
  //heatMap: null,
  playPauseButton: null,
  stopButton: null,
  playing: false,
  numFrames: 120.0,
  animStart: null,
  animEnd: null,
  frameStep: null,
  frameWidth: null,
  prevTime: null,
  frameWait: 80, // milliseconds - minimum
  numLayersLoaded: 0,
  isInitted: false,
  formerGraphLockedState: false,
  formerGraphDisplayMode: "cloud",

  init: function(pointLayer, heatLayer, wordGraph, choropleth, playPauseButton, stopButton) {
    this.pointLayer = pointLayer;
    this.heatLayer = heatLayer;
    this.wordGraph = wordGraph;
    this.choropleth = choropleth;
    this.pointLayer.events.register("loadend", this, this.layerLoadEnd);
    this.heatLayer.events.register("loadend", this, this.layerLoadEnd);
    //$(this.wordGraph).bind('loadend', this, this.layerLoadEnd);
    //$("#numTokensText").bind('loadend', this, this.layerLoadEnd);
    $(this.wordGraph).on('loadend', $.proxy(this.layerLoadEnd, this));
    $(this.choropleth).on('loadend', $.proxy(this.layerLoadEnd, this));
    this.playPauseButton = playPauseButton;
    this.stopButton = stopButton;
    $(this.playPauseButton).click($.proxy(this.playFunc, this));
    $(this.stopButton).click($.proxy(this.stopFunc, this));
    this.isInitted = true;
  },

  updateButtons: function(playPauseButton, stopButton) {
    this.playPauseButton = playPauseButton;
    this.stopButton = stopButton;
    $(this.playPauseButton).click($.proxy(this.playFunc, this));
    $(this.stopButton).click($.proxy(this.stopFunc, this));
  },


  layerLoadEnd: function () {
    //console.log(this.numLayersLoaded);
    if (this.playing == true) {
      var numLayersVisible = this.mapd.services.settings.getNumLayersVisible(); 
      if (this.mapd.fullScreen == false)
          numLayersVisible++; // for chart
      if (this.choropleth.active)
          numLayersVisible++; // choropleth
      this.numLayersLoaded++;
      if (this.numLayersLoaded >= numLayersVisible) {
          var curTime = new Date().getTime();
          this.numLayersLoaded = 0;
          var timeDiff = curTime - this.prevTime;
          //console.log("Time diff: " + timeDiff);
          if (timeDiff <  this.frameWait) {
              var waitTime = this.frameWait - timeDiff;
              //console.log("setting timeout");
              setTimeout($.proxy(this.animFunc,this),waitTime);
          }
          else
              this.animFunc();
      }
    }
  },

  isAnimating: function() {
    return (this.animStart != null);
  },

  animFunc: function() {
     if (this.frameEnd < this.animEnd) {
        this.prevTime = new Date().getTime();
        var options = {time: {timestart: Math.floor(this.frameStart), timeend: Math.floor(this.frameEnd)}, heatMax: this.heatMax}; 
       var graphOptions = {time: {timestart: Math.floor(this.frameStart), timeend: Math.floor(this.frameEnd)}, heatMax: this.heatMax}; 
      //console.log (this.frameStart + "-" + this.frameEnd);
      this.frameStart += this.frameStep;
      this.frameEnd += this.frameStep;
      this.mapd.services.graph.chart.setBrushExtent([this.frameStart * 1000, this.frameEnd * 1000]);
      this.mapd.services.pointmap.reload(options);
      this.mapd.services.heatmap.reload(options);
      this.mapd.services.choropleth.reload(options);
      if (this.mapd.fullScreen == false)
          this.wordGraph.reload(graphOptions);
    }
    else {
      //this.frameStart = this.animStart;
      //this.frameEnd = this.animStart + this.frameWidth;
      this.stopFunc();
    }
  },


  playFunc: function () {
    console.log("at play");
    if (this.playing == false) {
      this.playing = true;
      this.playPauseButton.removeClass("play-icon").addClass("pause-icon");
      if (this.animStart == null) { // won't trigger if paused
        this.animStart = Number(this.mapd.timestart);
        this.animEnd = Number(this.mapd.timeend);
        console.log ("Anim start: " + this.animStart);
        console.log ("Anim end: " + this.animEnd);
        this.frameStep = (this.animEnd - this.animStart) / this.numFrames;
        this.frameWidth = this.frameStep * 4.0; 
        this.prevTime = 0;
        this.frameStart = this.animStart;
        this.frameEnd = this.animStart + this.frameWidth;
        console.log("Frame start: " + this.frameStart);
        console.log("Frame end: " + this.frameEnd);
        this.heatMax = parseFloat($.cookie('max_value')) * 10.0;
        var numPoints = parseInt($.cookie('tweet_count'));
        this.oldRadius = this.mapd.services.pointmap.params.radius;
        if (this.oldRadius == -1) {
            var radius = 2;
            if (numPoints > 100000)
                radius = 0;
            else if (numPoints > 10000)
                radius = 1;
            this.mapd.services.pointmap.params.radius = radius;
        }
        //console.log(this.heatMax);
        this.formerGraphLockedState = this.wordGraph.locked;
        //this.wordGraph.params.sort = "false";
        this.formerGraphDisplayMode = this.wordGraph.displaySetting;

        this.wordGraph.setMenuItem("Display", "Bar", false);
        $.ajaxSetup({
            async: false
        });
       
        this.wordGraph.reload({time: {timestart: this.mapd.datastart, timeend: this.mapd.dataend}});

        $.ajaxSetup({
            async: true
        });
        //console.log("changing to async"); 

        //this.wordGraph.locked = true;
        if (this.wordGraph.modeSetting != "Trends" && this.formerGraphLockedState == false) {
            this.wordGraph.lockClickFunction();
        }
        /*****
        $("#barDisplay").prop('checked', 'checked');
        $("#cloudDisplay").attr('disabled', true);
        $("#displayMode").buttonset("refresh");
        ******/
      }
      this.animFunc();

    }
    else {
      this.playing = false;
      this.playPauseButton.removeClass("pause-icon").addClass("play-icon");
    }
  },

  stopFunc: function() {
    //console.log("stop");
    if (this.animStart != null) { //meaning its stopped or playing
      this.animStart = null;
      this.animEnd = null;
      this.animStep = null;
      this.numLayersLoaded = 0;
      this.playing = false;
      this.playPauseButton.removeClass("pause-icon").addClass("play-icon");
      //this.playPauseButton.attr("id", "play-icon");
      this.mapd.services.pointmap.params.radius = this.oldRadius;
      this.mapd.services.graph.chart.setBrushExtent([this.mapd.timestart * 1000, this.mapd.timeend * 1000]);
      this.mapd.services.pointmap.reload();
      this.mapd.services.heatmap.reload();
      //this.wordGraph.locked = this.formerGraphLockedState;
      this.wordGraph.setMenuItem("Display", this.formerGraphDisplayMode, false);
      if (this.wordGraph.modeSetting != "Trends" && this.formerGraphLockedState != this.wordGraph.locked) {
        this.wordGraph.lockClickFunction(true);
      }
      //this.wordGraph.reload();
    }
  }
}

var Settings = {
  pointLayer: null,
  heatLayer: null,
  baseMap: null,
  baseOn: null,
  pointOn: null,
  heatOn: null,
  polyOn: null,
  baseButton: null,
  pointButton: null,
  heatButton: null,
  polyButton: null,

  init: function(pointLayer, heatLayer, baseButton, pointButton, heatButton, polyButton) {
    this.pointLayer = pointLayer;
    this.heatLayer = heatLayer;
    this.baseButton=baseButton;
    this.pointButton = pointButton;
    this.heatButton = heatButton;
    this.polyButton = polyButton;
    this.pointOn = pointLayer.getVisibility();
    this.heatOn = heatLayer.getVisibility();




    //console.log("settings point: " + this.pointOn);
    //console.log("settings heat: " + this.heatOn);
    //$("#pointButton").button().next().button().parent().buttonset().next().hide().menu();


    if (this.pointOn)
      this.pointButton.addClass("pointButtonOnImg");
    else
      this.pointButton.addClass("pointButtonOffImg");
    if (this.heatOn)
      this.heatButton.addClass("heatButtonOnImg");
    else
      this.heatButton.addClass("heatButtonOffImg");
    /* 
    if (this.baseOn)
      this.baseButton.addClass("basemapButtonOnImg");
    else
      this.baseButton.addClass("basemapButtonOffImg");

    if (this.polyOn)
      this.polyButton.addClass("polyButtonOnImg");
    else
      this.polyButton.addClass("polyButtonOffImg");
    */

   $(this.baseButton).hover($.proxy(function() {this.baseButton.addClass("basemapButtonHoverImg");}, this), $.proxy(function () {this.baseButton.removeClass("basemapButtonHoverImg");}, this));
   $(this.pointButton).hover($.proxy(function() {this.pointButton.addClass("pointButtonHoverImg");}, this), $.proxy(function () {this.pointButton.removeClass("pointButtonHoverImg");}, this));
   $(this.heatButton).hover($.proxy(function() {this.heatButton.addClass("heatButtonHoverImg");}, this), $.proxy(function () {this.heatButton.removeClass("heatButtonHoverImg");}, this));
   $(this.polyButton).hover($.proxy(function() {this.polyButton.addClass("polyButtonHoverImg");}, this), $.proxy(function () {this.polyButton.removeClass("polyButtonHoverImg");}, this));

    $(this.baseButton).click($.proxy(this.baseButtonFunction, this));
    $(this.pointButton).click($.proxy(this.pointButtonFunction, this));
    $(this.heatButton).click($.proxy(this.heatButtonFunction, this));
    $(this.polyButton).click($.proxy(this.polyButtonFunction, this));
    
    /*
    $(this.pointButton).click($.proxy(function() {
    this.pointLayer.setVisibility(!this.pointOn);
    this.pointOn = !this.pointOn;
    this.pointButton.toggleClass("pointButtonOffImg").toggleClass("pointButtonOnImg");
    }, this));
    $(this.heatButton).click($.proxy(function() {
      this.heatLayer.setVisibility(!this.heatOn);
      this.heatOn = !this.heatOn;
      this.heatButton.toggleClass("heatButtonOffImg").toggleClass("heatButtonOnImg");
    }, this));
    */
  },

  baseButtonFunction: function(baseOn) {
    
    //console.log($.type(baseOn));
    if ($.type(baseOn) != "object") {
      this.baseOn = parseInt(baseOn);
    }
    else
      this.baseOn = !this.baseOn; 
    if (this.baseOn)
      this.baseButton.removeClass("basemapButtonOffImg").addClass("basemapButtonOnImg");
    else
      this.baseButton.removeClass("basemapButtonOnImg").addClass("basemapButtonOffImg");
    //this.baseButton.toggleClass("basemapButtonOffImg").toggleClass("basemapButtonOnImg");
    if (!this.baseOn) {
      $("#curLoc").addClass("curLoc-blank");
      $("#zoom").addClass("zoom-blank");
      $("#mapAnimControls").addClass("anim-blank");
      map.setBaseLayer(map.getLayersByName("Blank")[0]);

    }
    else {
      //console.log(BaseMap.currentLayer);
      //if (BaseMap.currentLayer != BaseMap.defaultLayer)
    $("#curLoc").removeClass("curLoc-blank");
    $("#zoom").removeClass("zoom-blank");
    $("#mapAnimControls").removeClass("anim-blank");
      map.setBaseLayer(map.getLayersByName(BaseMap.currentLayer)[0]);
      //map.setBaseLayer(map.getLayersByName(MapD.services.baseLayerName)[0]);
    }
  },

  polyButtonFunction: function(polyOn) {
    if ($.type(polyOn) != "object") {
      this.polyOn = parseInt(polyOn);
    }
    else
      this.polyOn = !this.polyOn; 
    //console.log("at poly function");
    //console.log(this.polyOn);
    if (this.polyOn) {
      this.polyButton.removeClass("polyButtonOffImg").addClass("polyButtonOnImg");
      Choropleth.activate();
    }
    else {
      this.polyButton.removeClass("polyButtonOnImg").addClass("polyButtonOffImg");
      Choropleth.deactivate();
    }
  },

  pointButtonFunction: function() {
    this.pointLayer.setVisibility(!this.pointOn);
    this.pointOn = !this.pointOn;
    this.pointButton.toggleClass("pointButtonOffImg").toggleClass("pointButtonOnImg");
  },
  heatButtonFunction: function() {
    this.heatLayer.setVisibility(!this.heatOn);
    this.heatOn = !this.heatOn;
    this.heatButton.toggleClass("heatButtonOffImg").toggleClass("heatButtonOnImg");
  },

  getNumLayersVisible: function() {
    //return (pointLayer.getVisibility() + heatLayer.getVisiblity());
    return (this.pointOn + this.heatOn);
  }
}
  /*
  geotrends: GeoTrends,
  gridSmall: null,
  gridMedium: null,
  gridLarge: null,

  init: function(gridSmall, gridMedium, gridLarge) {
    this.gridSmall = gridSmall;
    this.gridMedium = gridMedium;
    this.gridLarge = gridLarge;
    this.gridSmall.click(this.geotrends.GRIDSIZE_SMALL, $.proxy(this.onChangeGridSize, this));
    this.gridMedium.click(this.geotrends.GRIDSIZE_MEDIUM, $.proxy(this.onChangeGridSize, this));
    this.gridLarge.click(this.geotrends.GRIDSIZE_LARGE, $.proxy(this.onChangeGridSize, this));
  },

  onChangeGridSize: function(event) {
    console.log('in onChangeGridSize');
    var size = event.data;
    var currentGridSize = this.geotrends.getGridSize();
    if (size != currentGridSize[0]) {
      this.geotrends.setGridSize(size);
      this.geotrends.reload();
    }
  }
  */


//}

var Chart = 
{
  mapd: MapD,
  chart: LineChart,
  viewDiv: null,
  seriesId: 0,
  queryTerms: [],
  requestId: 0,
  params: {
    request: "Graph",
    sql: null,
    bbox: null,
    histstart: null,
    histend: null,
    histbins: 100,
    id: 1,
    xVar: null,
    yVar: null
  },

  init: function(viewDiv) {
    this.viewDiv = viewDiv;
    //this.viewDiv.html("");
    var height = $(this.viewDiv).height();
    console.log("height of chart: " + height);
    if (height == 0) {
      height = 140;
      /*
      if (this.mapd.fullScreen == true)
        height = 120;
      */
    }
    console.log("new height of chart: " + height);

    
    this.chart.init(d3.select(this.viewDiv.get(0)),height,  $.proxy(this.onZoom, this), $.proxy(this.onCompare, this));
  },
  updateSize: function() {
    this.chart.updateSize();
  },

  //getWhere: function(options) {
  //  return this.mapd.getWhere(options);
  //},
  
  getURL: function(options) {
    this.params.xVar = Vars.datasets[Vars.selectedVar].x;
    this.params.yVar = Vars.datasets[Vars.selectedVar].y;
    this.params.sql = "select " + Vars.datasets[Vars.selectedVar].time + ", amount ";
    /*
    if (options == undefined || options == null) 
      options = {splitQuery: true};
    else
      options.splitQuery = true;
    */
    var query = this.mapd.getWhere(options);
    console.log(query);
    /*
    if (queryArray[0])
      this.params.sql += "," + queryArray[0];
    this.params.sql += " from " + this.mapd.table + queryArray[1];
    */
    this.params.sql += " from " + this.mapd.table + query;
    //this.params.sql += " from " + this.mapd.table + " where " + query;
    this.params.histstart = this.mapd.timestart > this.mapd.datastart? this.mapd.timestart : this.mapd.datastart;
    this.params.histend = this.mapd.timeend < this.mapd.dataend? this.mapd.timeend : this.mapd.dataend;
    if (options && options.time) {
      this.params.histstart = options.time.timestart;
      this.params.histend = options.time.timeend;
    }
    this.params.bbox = this.mapd.map.getExtent().toBBOX();
    this.params.id = options.id;
    console.log("End query id " + this.params.id);
    var url = this.mapd.host + '?' + buildURI(this.params);
    return url;
  },

  reload: function() {
    //var queryTerms = this.queryTerms.slice(0);
    var queryTerms = this.mapd.queryTerms;
    // for now, time range always corresponds to entire data range
    var requestId = ++this.requestId;
    console.log("Start requestid: " + requestId);
    var options = {queryTerms: queryTerms, user: this.mapd.user, id: requestId,  time: {timestart: this.mapd.datastart, timeend: this.mapd.dataend}};
    console.log(options);
    this.clearChart();
    clearCount++;
    console.log("Clear count: " + clearCount);
    if (queryTerms == "" && this.mapd.party == "") {
      $(".compare-input").hide();
      console.log("query terms empty");
      //#e3d83d
      //$.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, 0, this.mapd.timestart, this.mapd.timeend, "Total", "#fa7a39", false));

      options.party = "D";
      $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, 0, this.mapd.timestart, this.mapd.timeend, "Democrats", "#2255cc", false));
      options.party = "R";
      $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, 1, this.mapd.timestart, this.mapd.timeend, "Republicans", "#d22", false));
      /*
      options.party = "I";
      $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, 1, this.mapd.timestart, this.mapd.timeend, "Independents", "#C8C800", false));
      options.party = "3";
      $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, 1, this.mapd.timestart, this.mapd.timeend, "Greens", "#00C800", false));
      */
    }
    else {
      $(".compare-input").show();
      if (queryTerms == "") {
        switch (this.mapd.party) {
          case "D":
            $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, 0, this.mapd.timestart, this.mapd.timeend, "Democrats", "#2255cc", false));
            break;
          case "R":
            $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, 1, this.mapd.timestart, this.mapd.timeend, "Republicans", "#d22", false));
            break;
          case "I":
            $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, 1, this.mapd.timestart, this.mapd.timeend, "Independents", "#C8C800", false));
            break;
          case "3":
            $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, 1, this.mapd.timestart, this.mapd.timeend, "Greens", "#00C800", false));
            break;
        }
      }
      else {
        $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, 0, this.mapd.timestart, this.mapd.timeend, this.mapd.queryTerms, "#fa7a39", true));
      }
    }
  },

  drawChart: function() {
    //console.log('in drawChart', this);
  },

  clearChart: function () {
      this.seriesId = 0;
      this.queryTerms = [];
      this.chart.removeAll();
  },


  onChart: function(seriesId, frameStart, frameEnd, queryTerms, color, clear, json) {
    if (json.responseId != this.requestId)
      return 0;

    //console.log('in onChart', queryTerms);
    //queryTerms = queryTerms.join(" ")
    /*
    if (clear) {
      this.seriesId = 0;
      this.queryTerms = [];
      this.chart.removeAll();
    }
    */
    //this.queryTerms.push(queryTerms);
    var series = [];
    console.log("MapD dataview: " + MapD.dataView);
    var dayMult = Chart.params.histbins/((frameEnd - frameStart)/86400.0);
    console.log("Day mult: " + dayMult);



    if (MapD.dataView == "counts") {
      for (i in json.x) {
        series.push({date: new Date(json.x[i] * 1000), value: json.count[i] * dayMult});
      }
    }
    else if (MapD.dataView == "dollars") {
      console.log("doing dollars");
      for (i in json.x) {
        if (json.count[i] > 0)
          series.push({date: new Date(json.x[i] * 1000), value: json.count[i] * json.y[i] * dayMult});
        else
          series.push({date: new Date(json.x[i] * 1000), value: 0});

      }
    }
    else if (MapD.dataView == "dollsperdon") {
        console.log("doing dollarsperdon");
      for (i in json.x) {
        if (json.count[i] > 0) {
          series.push({date: new Date(json.x[i] * 1000), value: json.y[i]});
        }
      }
    }
    this.chart.addSeries(seriesId, queryTerms, series, frameStart, frameEnd, color);
    this.seriesId += 1;
  },

  onZoom: function() {
    var start = (this.chart.brush.extent()[0]/ 1000).toFixed(0);
    var end = (this.chart.brush.extent()[1] / 1000).toFixed(0);
    this.mapd.reloadByGraph(start, end);
  },


  onCompare: function(terms) {
    var queryTerms = terms.trim().split(" ").filter(function(d) {return d});
    // for now, time range always corresponds to entire data range
    var options = {queryTerms: queryTerms, user: this.mapd.user,  time: {timestart: this.mapd.datastart, timeend: this.mapd.dataend }};
    $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this, this.mapd.timestart, this.mapd.timeend, queryTerms, false));
  }
}

var Choropleth = {
  mapD: MapD,
  map: null,
  svg: null,
  overlay: null,
  active: false,
  g: null,
  path: null,
  curLayer: null,
  isTopo: true,
  curJoinParams: null,
  percents: false,
  colorRamps: null,
  colorScales: null,
  joinParams : {
    "countries": {jointable: "country_data", joinvar: "name", joinattrs: "pst045212,iso_a2", pop_var: "pst045212", map_key: "ISO2", data_key: "iso_a2", data_col: "country"},
    "states": {jointable: "state_data", joinvar: "name", joinattrs: "pst045212", pop_var: "pst045212", map_key: "abbr", data_key: "label", data_col: "state"},
    "counties": {jointable: "county_data", joinvar: "name", joinattrs: "pst045212,fips", pop_var: "pst045212", map_key: "id", data_key: "fips", data_col: "county"}
  },
  layers: {
     "State": {name: "states", isTopo: false},
     "County": {name: "counties", isTopo: true, layerName: "counties"},
     "Congress": {name: "congress", isTopo: true, layerName: "layer1"},
  },
  params: {
    request: "GroupByToken",
    sql: null,
    sort: "false",
    k: 400,
    jointable: "state_data",
    joinvar: "name",
    joinattrs: "pst045212",
  },

  init: function() {
    this.curJoinParams = this.joinParams["states"];

     $("#polyMenu").click($.proxy(function(e) {
        var choice = this.getMenuItemClicked(e.target);
        console.log(choice);
        this.setLayer(choice);
        /*
         switch (choice) {
           case "State":
              this.setLayer("states");
              break;
           case "County":
              this.setLayer("counties");
              break;
          }
        */
        
      }, this));


    this.overlay = new OpenLayers.Layer.Vector("choroLayer");
    //this.map = this.mapD.map.canvas;
    this.map = map; 

     this.overlay.afterAdd = $.proxy(function() {
      //console.log("After add!");
      var div = d3.selectAll("#" + this.overlay.div.id);
      div.selectAll("svg").remove();
      this.svg = div.append("svg").attr("class", "choropleth");
      //this.g = this.svg.append("g").attr("id", ";
      //this.path = d3.geo.path().projection(project);
      this.colorRamps = {
          "red_blue": d3.scale.quantize().range(["rgb(178,24,43)","rgb(214,96,77)", "rgb(244,165,130)", "rgb(253,219,199)", "rgb(209,229,240)", "rgb(146,197,222)", "rgb(67,147,195)", "rgb(33,102,172)"]),
          "orange": d3.scale.quantize().range(["rgb(255,255,229)","rgb(255,247,188)", "rgb(254,227,145)", "rgb(254,196,79)", "rgb(254,153,41)", "rgb(236,112,20)", "rgb(204,76,2)", "rgb(140,45,4)"])
      }
      this.colorScale = this.colorRamps["red_blue"];

      this.map.events.register("moveend", this.map, $.proxy(this.reset,this));
    }, this);
    this.map.addLayer(this.overlay);
  },

  setLayer: function(layer) {
    console.log(layer);
    if (layer != this.curLayer && layer in this.layers) {
      //this.curLayer = this.layers[layer].name;
      this.curLayer = layer;
      console.log("curlayer: " + this.curLayer);
      this.isTopo = this.layers[layer].isTopo;
      console.log("is topo: " + this.isTopo);
      if (this.active) {
        this.addGeoData();
      }
    }
  },

  getMenuItemClicked: function(target) {
    if (target.localName != "span")
        innerText = target.firstChild.innerText;
    else {
        if (target.className == "checkmark")
            innerText = target.parentElement.firstChild.innerText;
        else
            innerText = target.innerText;
            
    }
    return innerText;
  },

  addGeoData: function() {
      d3.selectAll("#choroplethG").remove();
      this.g = this.svg.append("g").attr("id","choroplethG");
      var g = this.g;
      this.path = d3.geo.path().projection(project);
      var path = this.path;
      var layerName = this.layers[this.curLayer].name;
      var file = "data/" + layerName + ".json";
      if (this.isTopo) {
        d3.json(file, function(error,json) {

          Choropleth.features = g.selectAll("path")
            .data(topojson.feature(json, json.objects[Choropleth.layers[Choropleth.curLayer].layerName]).features)
            .enter().append("path")
            .attr("d",path);
          Choropleth.reset();
        });
      }
      else {
        d3.json(file, function(error,json) {
          Choropleth.features = g.selectAll("path")
            .data(json.features)
            .enter().append("path")
            .attr("d",path)
          Choropleth.reset();
        });
      }
      this.reload();
   },


   deactivate: function() {
     this.active = false;
     d3.selectAll("#choroplethG").remove();
     //this.features = this.g.selectAll("path").data([]).exit().remove();
   },

   reload: function(options) {
     if (this.active) 
       $.getJSON(this.getURL(options)).done($.proxy(this.onLoad, this));
   },

   getURL: function(options) {
     var query = this.mapD.getWhere(options);
     this.params.sql = "select contributor_state, amount from " + this.mapD.table + query;
     this.percents = false;
     var url = this.mapD.host + '?' + buildURI(this.params);
     console.log(url);
     return url;
    },

    activate: function() {
      this.active = true;
      //this.features = this.g.selectAll("path")
      //  .style("opacity", 0.7);
      //$(this.svg).show();
      this.addGeoData();
    },

   reset: function() {
     var size = this.map.getSize();
     this.svg.attr("width", size.w)
       .attr("height", size.h);
     if (this.features != null)
      this.features.attr("d", this.path);
   },

   onLoad: function(dataset) {
     this.data = dataset.results;
     var g = this.g;
     var data = this.data;
     var numVals = data.length;
     var curJoinParams = this.curJoinParams;
     console.log("pop var: " + curJoinParams.pop_var);
     var popVar = curJoinParams.pop_var;
     var dataViewMode = MapD.dataView;
     /*
     if (dataViewMode == "counts") {
       for (var i = 0; i < numVals; i++)
           data[i].y /= data[i][curJoinParams.pop_var];
     }
     */
     data.sort(function(a,b) { return d3.ascending(a.y, b.y) });
     var numFeatures = this.features[0].length;
      var wasFound = 0;
      var notFound = 0;
      for (var f = 0; f < numFeatures; f++) {
        var joined = false;
        var key = this.features[0][f].__data__.properties[curJoinParams.map_key];
        for (var i = 0; i < numVals; i++) {
          var found = false;
          if (data[i][curJoinParams.data_key] == key) {
           this.features[0][f].__data__.properties.y = data[i].y;
           this.features[0][f].__data__.properties.n = data[i].n;
           this.features[0][f].__data__.properties.pop = data[i][popVar];
           wasFound++;

           //console.log(this.features[0][f].__data__);
           found = true;
           break;
          }
        }
        if (!found) {
            notFound++;
            this.features[0][f].__data__.properties.y = null;
            this.features[0][f].__data__.properties.n = null;
            this.features[0][f].__data__.properties.pop = null;
          }
      }
      console.log("Found: " + wasFound);
      console.log("Not Found: " + notFound);
      this.draw();
      $(this).trigger('loadend');
   },

   draw: function() {
        console.log("at draw");
        var isCounty = this.params.jointable == "county_data";
        var popVar = this.curJoinParams.pop_var;
        var dataArray =  new Array;
        switch (MapD.dataView) {
          case "counts":
             for (var o in this.data) {
                 dataArray.push(this.data[o].n / this.data[o][popVar]);
             }
             break;
          case "dollars":
             for (var o in this.data) {
                 dataArray.push(this.data[o].y * this.data[o].n / this.data[o][popVar]);
             }
             break;
          case "dollsperdon":
             for (var o in this.data) {
                 dataArray.push(this.data[o].y);
             }
             break;
        }


        dataArray.sort(d3.ascending);
        this.colorScale.domain([
            d3.quantile(dataArray, 0.05), 
            d3.quantile(dataArray, 0.95)
          ]);
      var g = this.g;
      var colorScale = this.colorScale;
      var opacity= this.opacity;

      switch (MapD.dataView) {
        case "counts": 
          this.features = g.selectAll("path")
            .style("fill", function(d) {
              return(colorScale(d.properties.n / d.properties.pop));
            })
            .style("stroke-width", function() {
              if (isCounty)
                  return 0.5;
              return 1.5;
            });
            break;
          case "dollars": 
          this.features = g.selectAll("path")
            .style("fill", function(d) {
              return(colorScale(d.properties.y  * d.properties.n / d.properties.pop));
            })
            .style("stroke-width", function() {
              if (isCounty)
                  return 0.5;
              return 1.5;
            });
            break;
            case "dollsperdon":
              this.features = g.selectAll("path")
                .style("fill", function(d) {
                  return(colorScale(d.properties.y));
                })
                .style("fill-opacity", function(d) {
                  if (d.properties.n != null && d.properties.n >= 10) // minTweets
                    return opacity;
                  else
                    return 0.0;
                })
                .style("stroke-width", function() {
                  if (isCounty)
                      return 0.5;
                  return 1.5;
                });
                break;
        }

    }

};


