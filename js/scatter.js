function Scatter (div) {
  this.mapd = MapD;
  this.div =  $(div).get(0);
  this.svg = null;
  this.width = null;
  this.height = null;
  this.xScale = null;
  this.yScale = null;
  this.rScale = null;
  this.cScale = null; 
  this.colorVar = null;
  this.margin = {top: 20, right: 40, bottom: 40, left: 40};
  this.joinParams = {
    "Country": {jointable: "country_data", joinvar: "name", joinattrs: "pst045212,iso_a2", pop_var: "pst045212", map_key: "ISO2", data_key: "iso_a2", data_col: "country"},
    "State": {jointable: "state_data", joinvar: "name", joinattrs: "inc910211", pop_var: "pst045212", map_key: "abbr", data_key: "label", data_col: "contributor_state"},
    "County": {jointable: "county_data", joinvar: "fips", joinattrs: "inc910211", pop_var: "pst045212", map_key: "id", data_key: "label", data_col: "contributor_county_fips"}
  },
  this.format = null;
  this.data = null;
  //this.selectedVar = "pst045212";
  this.selectedVar = "inc910211";
  this.dataSource = "State";
  this.varPicker = null;
  this.curJoinParams = null;
  this.params = {
    bbox: null,
    request: "GroupByToken",
    jointable: "state_data",
    joinvar: "name",
    joinattrs: "pst045212",
    sort: false,
    sql: null,
    k: 10000

  };

  this.init = function() {
    this.width = $(this.div).width() - this.margin.left - this.margin.right;
    this.height = $(this.div).height() - this.margin.top - this.margin.bottom;
    this.svg = d3.select(this.div)
      .attr("class", "scatterplot")
      .append("svg")
      .attr("width", this.width + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.xScale = d3.scale.linear().range([0,this.width]);
    this.yScale = d3.scale.linear().range([this.height,0]); 
    this.rScale = d3.scale.linear().range([2,5]);
    this.cScale = d3.scale.category10();
    this.xAxis = d3.svg.axis().scale(this.xScale).orient("bottom").ticks(5);
    this.yAxis = d3.svg.axis().scale(this.yScale).orient("left").ticks(5);

     this.svg.append("g")
        .attr("class", "y axis")
        .call(this.yAxis);
     this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height  +")")
        .call(this.xAxis);
        //$(this.varPicker).appendTo($(this.elems.container));
  },

  this.reload = function(options) {
    if ($(this.div).dialog("isOpen")) {
       //if (options == undefined || options == null) 
         //options = {};
        /*j
       if (this.mapd.queryTerms == "" && this.mapd.party == "") {
         this.mode = "compare";
         options.party = "D";
         $.getJSON(this.getURL(options)).done($.proxy(this.addData, this));
         options.party = "R";
         $.getJSON(this.getURL(options)).done($.proxy(this.addData, this));
        }
        else {
        */
          $.getJSON(this.getURL(options)).done($.proxy(this.addData, this));
        //}
     }
    };

  this.getURL = function(options) {
       if (options == undefined || options == null) 
         options = {};
       options.splitQuery = false;
      this.params.bbox = this.mapd.map.getExtent().toBBOX();
      if (this.colorVar != null)
          this.params.joinattrs = this.curJoinParams.pop_var + "," + this.selectedVar + "," + this.colorVar;
      else
          this.params.joinattrs = this.curJoinParams.pop_var + "," + this.selectedVar;
      this.params.sql = "select " + this.curJoinParams.data_col + ", amount from " + this.mapd.table + this.mapd.getWhere(options);
      var url = this.mapd.host + '?' + buildURI(this.params);
      return url;
  };

  this.addData = function(dataset) { 
    this.svg.selectAll("circle")
    .data([])
    .exit()
    .remove();
    //var minN = this.minTweets;
    this.data = dataset.results;
    var data = this.data;
    var numVals = this.data.length;
    var popVar = this.curJoinParams.pop_var;
    var selectedVar = this.selectedVar;

    var numYears;
      if (this.mapd.services.animation.isAnimating() == false)
        numYears = (MapD.dataend - MapD.datastart)/86400.0/365.0;
    else
        numYears = Animation.frameWidth / 86400.0/365.0;




    switch (MapD.dataView) {
      case "counts":
        this.format = d3.format(".2s"); 
        for (var i = 0; i < numVals; i++)
           data[i].val = (data[i].n / data[i][popVar]) / numYears ;
      break;
      case "dollars":
        this.format = d3.format("$,.2s"); 
         for (var i = 0; i < numVals; i++)
             data[i].val = data[i].y * data[i].n / data[i][popVar] / numYears;
         break;
      case "dollsperdon":
         for (var i = 0; i < numVals; i++)
             data[i].val = data[i].y;
         break;
    }     

    this.yAxis.tickFormat(this.format);
    if (this.selectedVar.search("inc") != -1)
        this.xAxis.tickFormat(d3.format("$,.2s"));
    else
      this.xAxis.tickFormat(d3.format(".2s"));

    this.xScale
      .domain([d3.min(this.data, function(d) {return d[selectedVar];}), d3.max(this.data, function(d) {return d[selectedVar];})]);

  if (this.mapd.services.animation.isAnimating() == false)
      this.getYScale();


    /*this.yScale
      .domain([d3.min(this.data, function(d) {return d.val;}), d3.max(this.data, function(d) {return d.val;})]);
      */

    var xScale = this.xScale;
    var yScale = this.yScale;
    var rScale = this.rScale;
    var cScale = this.cScale;
    var colorVar = this.colorVar;

    this.svg.selectAll("circle")
        .data(this.data)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return xScale(d[selectedVar]);
          })
        .attr("cy", function(d) {
            return yScale(d.val);
          })
        .attr("r", 2)
        .style("fill", function(d) {
          return cScale(d[colorVar]);
        })
        .append("svg:title")
        .text(function (d) {
          return d.label; 
        });
        this.svg.select("g.x.axis")
        .call(this.xAxis);
        this.svg.select("g.y.axis")
        .call(this.yAxis);

        this.addTrendLine();



      $(this).trigger('loadend');
    };

  this.getYScale = function() {
    var dataArray =  new Array;
    for (var o in this.data) {
       dataArray.push(this.data[o].val);
    }
    dataArray.sort(d3.ascending);
    var maxQuantile = d3.quantile(dataArray, 0.95);
    var minThresh = 0.05;
    var minQuantile = d3.quantile(dataArray, minThresh);
    while (minQuantile * 10.0 < maxQuantile && minThresh < 1.0) { 
        minThresh += 0.05;
        minQuantile = d3.quantile(dataArray, minThresh);
    }
    this.yScale.domain([minQuantile,maxQuantile]);
  };





  this.setDataset = function(dataSource) {
    this.dataSource = dataSource;
    this.curJoinParams = this.joinParams[this.dataSource];
    this.params.jointable = this.curJoinParams.jointable;
    this.params.joinattrs = this.curJoinParams.pop_var;
    this.params.joinvar = this.curJoinParams.joinvar;

    //this.dataSource = dataSource.toLowerCase(); 
    $.getJSON(this.getScatterVarsURL()).done($.proxy(this.onScatterVarsLoad, this));
  };

  this.getScatterVarsURL = function() {
    var scatterParams = {};
    scatterParams.request = "GetTableCols";
    scatterParams.table = this.params.jointable;
    var url = this.mapd.host + '?' + buildURI(scatterParams);
    console.log(url);
    return url;
  };

  this.onScatterVarsLoad = function(json) {
    this.setVars(json);
    //this.reload();
  }

  this.getLeastSquares = function (xVar, yVar) {
    var data = this.data;
    var sumX = 0;
    var sumY =0;
    var sumXY = 0;
    var sumXX = 0;
    var count = 0;

    var x = 0;
    var y = 0;
    var numVals = data.length;
    if (numVals == 0)
      return 0;
    for (var v = 0; v < numVals; v++) {
      x = data[v][xVar];
      y = data[v][yVar];
      sumX += x;
      sumY += y;
      sumXX += x*x;
      sumXY += x*y;
      count++;
    }

    // y = mx + b
   
    results = {}
    results.m = (count * sumXY - sumX*sumY) / (count*sumXX - sumX * sumX);
    results.b = (sumY / count) - (results.m*sumX)/count;
    return results;

  },

  this.addTrendLine = function() {
    this.svg.selectAll('line').remove();

    var regResults = this.getLeastSquares(this.selectedVar, "val");
    var xSubDomain = this.xScale.domain();
    var xMean = xSubDomain[0] + xSubDomain[1] * 0.5;
    xSubDomain[0] = xMean - (xMean - xSubDomain[0]) * 0.95;
    var p0 = [this.xScale(xSubDomain[0]) + 0.5, this.yScale(regResults.m * xSubDomain[0] + regResults.b) + 0.5]
    var p1 = [this.xScale(xSubDomain[1]) + 0.5, this.yScale(regResults.m * xSubDomain[1] + regResults.b) + 0.5]
    xSubDomain[1] = xMean + (xSubDomain[1] - xMean) * 0.95;
    this.svg.append('svg:line')
      .attr('x1', p0[0])
      .attr('y1', p0[1])
      .attr('x2', p1[0])
      .attr('y2', p1[1])
      .attr("stroke-width",2)
      .attr("stroke", "blue");
  }




  this.setVars = function(vars) {
    $(this.varPicker).remove();
    console.log(vars);
    this.varPicker = $("<select></select>").attr("id", "scatterXVarSelect").appendTo($(this.div));
    this.vars = $.map(vars.columns, function (c, idx) {
      if (c.tag == "null" || c.tag.search(":") == -1)
        return null;
      return c;
    });
    var defaultIndex = -1;
    var defaultVar = null;
    var selectedVarFoundIndex = -1;
    var colorIndex = -1;
    $(this.vars).each($.proxy(function(index, element) {
      if ((element.tag) == "color:") {
        this.colorVar = element.name;
        colorIndex = index;
        return true;
      }
      if (element.name == this.selectedVar)
        selectedVarFoundIndex = index;
      var tag = element.tag.substring(1,element.tag.length-1)      
      var elemArray = tag.split(':');
      if (elemArray[0].substring(0,3) == "pct")
        elemArray[1] = "% " + elemArray[1];
      //if (elemArray[0].search("default") != -1) {
      if (element.name == "inc910211") {
        defaultIndex = index;
        console.log("default: " + element.name);
        defaultVar = element.name; 
      }
      $(this.varPicker).append('<option Value="' + element.name +'">'+elemArray[1]+'</option>')
    }, this));

      if (selectedVarFoundIndex >= 0) {
        if (colorIndex != -1 && colorIndex < selectedVarFoundIndex)
          selectedVarFoundIndex--;
        $(this.varPicker).children().eq(selectedVarFoundIndex).prop('selected', true);
      }
      else if (defaultIndex >= 0) {
        if (colorIndex != -1 && colorIndex < defaultIndex)
          defaultIndex--;
        this.selectedVar = defaultVar;
        console.log("this selected var: " + this.selectedVar);
        $(this.varPicker).children().eq(defaultIndex).prop('selected', true);
      }
      $(this.varPicker).change($.proxy(this.scatterVarChange, this));
    };

    this.scatterVarChange = function() {
      console.log(this);
      this.selectedVar = $(this.varPicker).find("option:selected").get(0).value;
      console.log(this.selectedVar);
      this.reload();
    
  };
  }

