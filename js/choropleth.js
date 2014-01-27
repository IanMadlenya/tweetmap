var Choropleth = {
  mapD: MapD,
  map: null,
  svg: null,
  overlay: null,
  g: null,
  path: null,
  curLayer: null,
  isTopo: true,

  init: function() {
    this.overlay = new OpenLayers.Layer.Vector("choroLayer");
    this.map = this.mapD.map.canvas;

     this.overlay.afterAdd = $.proxy(function() {
      //console.log("After add!");
      var div = d3.selectAll("#" + this.overlay.div.id);
      div.selectAll("svg").remove();
      this.svg = div.append("svg").attr("class", "choropleth");
      this.g = this.svg.append("g");
      //this.path = d3.geo.path().projection(project);
      this.colorScale = d3.scale.quantize().range(["rgb(255,255,229)","rgb(255,247,188)", "rgb(254,227,145)", "rgb(254,196,79)", "rgb(254,153,41)", "rgb(236,112,20)", "rgb(204,76,2)", "rgb(140,45,4)"]);
      this.map.events.register("moveend", this.map, $.proxy(this.reset,this));
    }, this);
    this.map.addLayer(this.overlay);
  },

  setLayer: function(layer, isTopo) {
    if (layer != this.curLayer) {
      this.curLayer = layer; 
      this.isTopo = isTopo;
      this.addGeoData();
    }
  },

  addGeoData: function() {
      d3.select("g").remove();
      this.g = this.svg.append("g");
      var g = this.g;
      this.path = d3.geo.path().projection(project);
      var path = this.path;
      var file = "data/" + this.curLayer + ".json";
      if (this.isTopo) {
        d3.json(file, function(error,json) {

          Choropleth.features = g.selectAll("path")
            .data(topojson.feature(json, json.objects.layer1).features)
            .enter().append("path")
            .attr("d",path);
          Choropleth.reset();
        });
      }
   },

   reset: function() {
     var size = this.map.getSize();
     this.svg.attr("width", size.w)
       .attr("height", size.h);
     if (this.features != null)
      this.features.attr("d", this.path);
   }
};
