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
  this.margin = {top: 20, right: 40, bottom: 40, left: 60};
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
  this.numResponses = 0;
  this.compareData = [0,0],
  this.minN = 20;
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
    /*
    this.svg.append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("class", "rect-clip")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", 2)
        .attr("height", 2);
    */
  },

  this.reload = function(options) {
    if ($(this.div).dialog("isOpen")) {
       if (options == undefined || options == null) 
         options = {};
       options.splitQuery = false;
       var party = this.mapd.party;
       if (this.mapd.queryTerms == "" && party == "") {
         this.mode = "compare";
         this.numResponses = 0;
         options.party = "D";
         $.getJSON(this.getURL(options)).done($.proxy(this.onLoad, this, 1));
         options.party = "R";
         $.getJSON(this.getURL(options)).done($.proxy(this.onLoad, this, 0));
       }
       else {
         this.mode = "single";
          $.getJSON(this.getURL(options)).done($.proxy(this.onLoad, this, -1));
       }

     }
    };

  this.getURL = function(options) {
      this.params.bbox = this.mapd.map.getExtent().toBBOX();
      if (this.colorVar != null)
          this.params.joinattrs = this.curJoinParams.pop_var + "," + this.selectedVar + "," + this.colorVar;
      else
          this.params.joinattrs = this.curJoinParams.pop_var + "," + this.selectedVar;
      this.params.sql = "select " + this.curJoinParams.data_col + ", amount from " + this.mapd.table + this.mapd.getWhere(options);
      var url = this.mapd.host + '?' + buildURI(this.params);
      return url;
  };

  this.clearData = function() {
    this.svg.selectAll(".label")
    .remove();

    this.svg.selectAll("circle")
    .data([])
    .exit()
    .remove();
  };

  this.onLoad = function(datasetNum, dataset) { 
    var numYears;
      if (this.mapd.services.animation.isAnimating() == false)
        numYears = (MapD.dataend - MapD.datastart)/86400.0/365.0;
    else
        numYears = Animation.frameWidth / 86400.0/365.0;
    var colorVar = this.colorVar;
    var popVar = this.curJoinParams.pop_var;
    var selectedVar = this.selectedVar;
    var yAxisLabel = ""
    if (datasetNum >= 0) { 
      this.compareData[datasetNum] = dataset.results;
      this.numResponses++;
      if (this.numResponses < 2)
        return;
       var numVals = 0; 
       if ("results" in dataset)
         numVals = dataset.results.length;
       this.data = [] 
       var data = this.data;
       var dataKey = this.curJoinParams.data_key;
       switch (MapD.dataView) {
         case "counts":
           this.format = d3.format(".2s"); 
           //yAxisLabel = "Difference in Donations to Democratic and Republican Candidates Per Capita Per Year"
           yAxisLabel = "Margin of Donations - Democrats vs Republicans"
             //Difference in Donations to Democratic and Republican Candidates Per Capita Per Year"

           for (var i = 0; i < numVals; i++) {
             var insertObject = {"val": (this.compareData[1][i].n - this.compareData[0][i].n) / this.compareData[0][i][popVar], "n": this.compareData[0][i].n + this.compareData[1][i].n};
             insertObject[dataKey] = this.compareData[0][i][dataKey];
             insertObject[selectedVar] = this.compareData[0][i][selectedVar];
             insertObject[colorVar] = this.compareData[0][i][colorVar];
             data.push(insertObject);
           }
           break;
         case "dollars":
          this.format = d3.format("$,.2s"); 
           yAxisLabel = "Margin of Total Giving - Democrats vs Republicans"
           //yAxisLabel = "Difference in Total Giving between Democrats and Republicans per Capita  per Year (Dollars)"
          for (var i = 0; i < numVals; i++) {
              var insertObject = {"val": (this.compareData[1][i].n * this.compareData[1][i].y - this.compareData[0][i].n * this.compareData[0][i].y) / this.compareData[0][i][popVar], "n": this.compareData[1][i].n + this.compareData[1][i].n};
              insertObject[dataKey] = this.compareData[0][i][dataKey];
               insertObject[selectedVar] = this.compareData[0][i][selectedVar];
              insertObject[colorVar] = this.compareData[0][i][colorVar];
              data.push(insertObject);
          }

          break;
          case "dollsperdon":
            this.format = d3.format("$,.2s"); 
           yAxisLabel = "Difference in Average Giving between Democrats and Republicans per Year per Capita "
             for (var i = 0; i < numVals; i++) {
                var insertObject = {"val": this.compareData[1][i].y - this.compareData[0][i].y , "n": this.compareData[1][i].n + this.compareData[1][i].n};
                insertObject[dataKey] = this.compareData[0][i][dataKey];
               insertObject[selectedVar] = this.compareData[0][i][selectedVar];
                insertObject[colorVar] = this.compareData[0][i][colorVar];
                data.push(insertObject);
                //data[i].val = (this.compareData[1][i].y - this.compareData[0][i].y);
            }
           break;
        }
       console.log(data);
    }
    else {
      this.data = dataset.results;
      var data = this.data;
      var numVals = this.data.length;

      switch (MapD.dataView) {
        case "counts":
          this.format = d3.format(".2s"); 
          yAxisLabel = "Donations per Year per Capita"
          for (var i = 0; i < numVals; i++)
             data[i].val = (data[i].n / data[i][popVar]) / numYears ;
        break;
        case "dollars":
          this.format = d3.format("$,.2s"); 
          yAxisLabel = "Total Giving per Year per Capita (dollars)"
           for (var i = 0; i < numVals; i++)
               data[i].val = data[i].y * data[i].n / data[i][popVar] / numYears;
           break;
        case "dollsperdon":
          this.format = d3.format("$,.2s"); 
          yAxisLabel = "Average Giving per Year per Capita (dollars)"
           for (var i = 0; i < numVals; i++)
               data[i].val = data[i].y;
           break;
      }     
    }

    var minN = this.minN;
    data = data.filter(function(e) {
      return e.n >= this.minN;
    });




    this.clearData();

    this.yAxis.tickFormat(this.format);
    if (this.selectedVar.search("inc") != -1)
        this.xAxis.tickFormat(d3.format("$,.2s"));
    else
      this.xAxis.tickFormat(d3.format(".2s"));

    this.xScale
      .domain([d3.min(this.data, function(d) {return d[selectedVar];}), d3.max(this.data, function(d) {return d[selectedVar];})]);

    if (this.mapd.services.animation.isAnimating() == false)
      this.getYScale();

    var xScale = this.xScale;
    var yScale = this.yScale;
    var rScale = this.rScale;
    var cScale = this.cScale;


    this.svg.append("text")
      .attr("class", "label")
      .attr("text-anchor", "end")
      .attr("y", -58)
      .attr("x", yAxisLabel.length - 45)
      .attr("dy", ".95em")
      .attr("transform", "rotate(-90)")
      .text(yAxisLabel);
        
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
    /*
    this.svg.append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("class", "rect-clip")
        .attr("x", this.xScale(0))
        .attr("y", this.yScale(1))
        .attr("width", this.xScale(1) - this.xScale(0))
        .attr("height", this.yScale(0) - this.yScale(1));
    */


      $(this).trigger('loadend');
    };

  this.getYScale = function() {
    var dataArray =  new Array;
    for (var o in this.data) {
       dataArray.push(this.data[o].val);
    }
    dataArray.sort(d3.ascending);
    var maxQuantile = d3.quantile(dataArray, 0.95);
    /*
    var minThresh = 0.05;
    var minQuantile = d3.quantile(dataArray, minThresh);
    while (minQuantile * 10.0 < maxQuantile && minThresh < 1.0) { 
        minThresh += 0.05;
        minQuantile = d3.quantile(dataArray, minThresh);
    }
    */
    var minQuantile = d3.quantile(dataArray, 0.05);
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
    this.reload();
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

