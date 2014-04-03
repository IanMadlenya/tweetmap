
/*
function buildURI(params) {
  var uri = '';
  for (key in params) 
    uri += key + '=' + params[key] + '&';
  return encodeURI(uri.substring(0, uri.length - 1));
};
*/

function TimeChart (div) {
  this.div = $(div).get(0);
  this.lineChart = null;
  this.datastart = 1386201600;
  this.dataend = 1386260284;
  this.params = {
    request: "Graph",
    sql: null,
    bbox: "-14871588.221094,-2612311.87831,14871588.221094,2612311.878311",
    histstart: 1386201600,
    histend: 1386260284,
    histbins: 100,
    id: 0
  },

  this.init = function() {
    this.lineChart = LineChart;
    this.lineChart.init(d3.select(this.div),$(this.div).height(), this.brushCallback, null); 
  };

  this.brushCallback = function () {
    console.log("brush");
    timeChart.datastart = (timeChart.lineChart.brush.extent()[0]/ 1000).toFixed(0);
    timeChart.dataend = (timeChart.lineChart.brush.extent()[1] / 1000).toFixed(0);
    network.reload();
  };

  this.getURL = function(options) {
    this.params.sql = "select time, (tweet_text ilike '" + $("#queryInput").val() + "') from tweets where time > " + this.params.histstart + " and time < " + this.params.histend;
    var url = host + '?' + buildURI(this.params);
    return url;
  };

  this.reload = function() {
    //var options = {queryTerms: this.mapd.queryTerms, user: this.mapd.user, id: requestId, time: {timestart: this.mapd.datastart, timeend: this.mapd.dataend }};
    var options = {};
    this.clearChart();
    $.getJSON(this.getURL(options)).done($.proxy(this.onChart, this));
  };

  this.clearChart = function () {
      //this.seriesId = 0;
      //this.queryTerms = [];
      this.lineChart.removeAll();
      //this.chart.removePaths();
  };


  this.onChart = function(json) {
    var series = [];
    if ("y" in json) { // means we have percent
      this.lineChart.setMode("percent");
      for (i in json.x) {
          series.push({date: new Date(json.x[i] * 1000), value: json.y[i]});
      }
    this.lineChart.addSeries(0, $("#queryInput").val(), series, this.datastart, this.dataend);
  }
  };
};

function Collocator (div) {
  this.mapd = MapD;
  this.div = $(div).get(0);
  this.strengthScale = null;
  this.query = "";
  this.svg = null;
  this.width = null;
  this.height = null;
  this.force = null;
  this.gnodes = null;
  this.nodes = null;
  this.edges = null;
  //this.host = 'http://dell0:8080/';
  this.host = this.mapd.host; 
  this.margin = {top: 40, right: 40, bottom: 40, left: 40};
  this.baseSql = "select tweet_text from tweets"; //where (speaker_party ilike 'R' or speaker_party ilike 'D')";
  this.demPercents = [];
  this.topKParams = {
    request: "GroupByToken",
    sql: null, 
    bbox: null,
    id: 0,
    k: 35,
    mintokens: 800,
    stoptable: "multistop",
    sort: "true",
    tokens: [],
  };
  this.colorParams = {
    request: "GroupByToken",
    sql: null,
    id: 0,
    k: 35,
    sort: "false",
    tokens: [],
  };

  this.collocationParams = {
    bbox: null,
    request: "GetCollocationScores",
    sql: null, 
    id: 0,
    tokens: [],
  };

  this.dataset = {
    nodes: [], 
  edges: []
  };

  this.init = function() {
    d3.se
    if (this.force != null) {
      d3.select(this.svg).remove();
    }

    this.colorScale = d3.scale.quantize().range(["#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac"]).domain(d3.extent(this.demPercents));

    this.width = $(this.div).width() - this.margin.left - this.margin.right;
    this.height = $(this.div).height() - this.margin.top - this.margin.bottom;
    var strengthMax =d3.max(this.dataset.edges, function(d) {return d.strength;}); 

    this.distScale = d3.scale.pow().exponent(0.6)
      .range([600.0,10.0])
      .domain([0.0,strengthMax]); 

    this.linkWidthScale = d3.scale.linear()
      .range([0.0,4.0])
      .domain([0.0, strengthMax]);

    this.tokenSizeScale = d3.scale.linear()
      .range([18,34])
      .domain(d3.extent(this.dataset.nodes, function(d) {return d.n;}));


    var distScale = this.distScale;
    var linkWidthScale = this.linkWidthScale;
    var tokenSizeScale = this.tokenSizeScale;
    var colorScale = this.colorScale;

    this.force = d3.layout.force()
      .nodes(this.dataset.nodes)
      .links(this.dataset.edges)
      .size([this.width, this.height])
      //.linkDistance(function(d) {console.log (d); return (20.0 - d.strength) * 20.0;})
      .linkDistance(function(d) {return distScale(d.strength);})
      .gravity(3.7)
      //.linkDistance([50])
      //.linkDistance([50])
      .charge([-60])
      .start();


    this.svg = d3.select(this.div)
      .attr("class", "network")
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);
      //.append("g")
      //.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
    this.edges = this.svg.selectAll("line")
      .data(this.dataset.edges)
      .enter()
      .append("line")
      .style("stroke", "#ccc")
      .style("opacity", 0.2)
      .style("stroke-width", function(d) {
        var width = linkWidthScale(d.strength);
        return width > 0.0 ? width : 0.0;
       });

      //.style("stroke-width", function(d) {return d.strength});

    this.gnodes = this.svg.selectAll('g.gnode')
      .data(this.dataset.nodes)
      .enter()
      .append('g')
      .classed('gnode', true)
      .call(this.force.drag);

    this.nodes = this.gnodes.append("circle")
      .attr("class", "node")
      .attr("r",30)
      //.style("fill", function(d) {return d.color;})
      .style("opacity", 0.0);
    /*
    this.nodes = this.gnodes.append("rect")
      .attr("class", "node")
      .attr("width", 20)
      .attr("height", 10)
      .style("fill", "#060")
      .style("opacity", 0.0)
      .call(this.force.drag);
    */
    var curQuery = this.query;
    this.labels = this.gnodes.append("text")
      .attr("class", "token-label")
      .text(function(d) {return d.token;})
      .style("font-size", function(d) {return tokenSizeScale(d.n) + "px";})
      .style("fill", function(d) {return colorScale(d.dem);})
      //.style("fill", function(d) {if (d.token == curQuery) return "#d00";})
      .attr("transform", "translate(-15,5)");

    $(".token-label").click($.proxy(function(e) {
      this.query = $(event.target).text();
      $("#queryInput").val(this.query);
      timeChart.reload();
      this.reload();
    }, this));
      //.call(this.force.drag);

    /*
    this.nodes = this.svg.selectAll("circle")
      .data(this.dataset.nodes)
      .enter().append("circle")
      .attr("class", "node")
      .attr("r", 5)
      .style("fill", "#f00")
      .call(this.force.drag);
    */
    /*
    this.nodes.append("title")
      .text(function(d) {return d.name;});
    */

    var gnodes = this.gnodes;
    var edges = this.edges;
    this.force.on("tick", function() {
      edges.attr("x1", function(d) {return d.source.x; })
      edges.attr("y1", function(d) {return d.source.y; })
      edges.attr("x2", function(d) {return d.target.x; })
      edges.attr("y2", function(d) {return d.target.y; })
      gnodes.attr("transform", function(d) {
          return 'translate(' + [d.x,d.y] + ')';
      });
        
      /* 
      gnodes.attr("cx", function(d) {return d.x;})
           .attr("cy", function(d) {return d.y;});
      */
  });
  };

  this.reload = function(options) {
    if ($(this.div).dialog("isOpen")) {
       if (options == undefined || options == null) 
         options = {};
  
         





    
     $.getJSON(this.getTopKURL(options)).done($.proxy(this.onTopKLoad, this));
  };

  this.getCollocations = function(options) {
     $.getJSON(this.getCollocationURL(options)).done($.proxy(this.onCollocationsLoad, this));
  };

  this.getTopKURL = function(options) {
      var sql = this.baseSql;
      /*
      if (this.query != "")
        sql += " and tweet_text ilike '" + this.query + "'"
      */
      //this.topKParams.sql = sql;
      this.topKParams.sql = "select tweet_text, tweet_text ilike '" + this.query + "' from tweets where time > " + timeChart.datastart + " and time < " + timeChart.dataend; 
      //console.log(this.topKParams);
      
      var url = this.host + '?' + buildURI(this.topKParams);
      return url;
  };
 
  this.getColors = function(options) {
     $.getJSON(this.getColorURL(options)).done($.proxy(this.onColorLoad, this));
  };

  this.getColorURL = function(options) {
      this.colorParams.sql = "select tweet_text, time from tweets  where time > " + timeChart.datastart + " and time < " + timeChart.dataend + " and tweet_text ilike '" + this.query + "'"; 
      var url = this.host + '?' + buildURI(this.colorParams);
      return url;
  };

  this.getCollocationURL = function(options) {
      //var sql = this.baseSql;
      var sql = "select tweet_text from tweets where time > " + timeChart.datastart + " and time < " + timeChart.dataend + " and tweet_text ilike '" + this.query + "'"
      this.collocationParams.sql = sql;

      //this.collocationParams.sql = sql + "  ;
      var url = this.host + '?' + buildURI(this.collocationParams);
      return url;
  };

  this.onTopKLoad = function(data) {
    if (this.query == "") { 
      this.colorParams.tokens = data.tokens;
      this.collocationParams.tokens = data.tokens;
    }
    else {
      this.colorParams.tokens = data.tokens.slice(1);
      this.collocationParams.tokens = data.tokens.slice(1);
    }

    //console.log(data);
    this.getColors();
    //this.getCollocations();
  };

  this.onColorLoad = function(data) {
    console.log("colors");
    console.log(data);
    this.demPercents = data.percents;
    this.getCollocations();

  };


  this.onCollocationsLoad = function(data) {
    console.log(data);
    this.dataset.nodes = [];
    this.dataset.edges = [];
    //this.dataset = {};
    var numNodes = data.tokens.length;
    for (var n = 0; n < numNodes; ++n) 
      this.dataset.nodes.push({token: data.tokens[n], n: data.counts[n], dem: this.demPercents[n]});
    var i = 0;
    for (var y = 0; y < numNodes; ++y) {
      for (var x = y + 1; x < numNodes; ++x) {
        this.dataset.edges.push({source: y, target: x, strength: data.scores[i]});
        i++;
      }
    }

    this.init();
    //console.log(this.dataset);

  };

}

function init () {
  timeChart = new TimeChart($("#timeChart"));
  timeChart.init();
  network = new Network($("#networkDiv"));
  $("#queryInput").val("capitalism");
  network.query = "capitalism";
  $("#queryInput").keyup( function (e) {
    if (e.keyCode == 13) {
      network.query = $(this).val();
      timeChart.reload();
      network.reload();
    }
  });
    


  //network.init();
  timeChart.reload();
  network.reload();
}


$(document).ready(init);




