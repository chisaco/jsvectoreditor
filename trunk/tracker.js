

VectorEditor.prototype.unselect = function(shape){
  if(!shape){
    this.selected = [];
    this.removeTracker();
  }else{
    this.array_remove(shape, this.selected);
    for(var i = 0; i < this.trackers.length; i++){
      if(this.trackers[i].shape == shape){
        this.removeTracker(this.trackers[i]);
      }
    }
  }
}


VectorEditor.prototype.selectAdd = function(shape){
  if(this.is_selected(shape) == false){
    this.selected.push(shape)
    this.showGroupTracker(shape);
  }
}

VectorEditor.prototype.selectToggle = function(shape){
  if(this.is_selected(shape) == false){
    this.selected.push(shape)
    this.showGroupTracker(shape)
  }else{
    this.unselect(shape)
  }
}

VectorEditor.prototype.select = function(shape){
  this.unselect()
  this.selected = [shape]
  this.showTracker(shape)
}



VectorEditor.prototype.removeTracker = function(tracker){
  if(!tracker){
    while(this.trackers.length > 0){
      this.removeTracker(this.trackers[0]);
    }
  }else{
    tracker.remove();
    
    for(var i = 0; i < this.trackers.length; i++){
      if(this.trackers[i] == tracker){
        this.trackers.splice(i, 1)
      }
    }
  }
}

VectorEditor.prototype.rotateTracker = function(a, x, y){
  for(var i = 0; i < this.trackers.length; i++){
    var el = this.trackers[i]
    el.rotate(a, x, y)
  }
}

VectorEditor.prototype.moveTracker = function(x, y){
  for(var i = 0; i < this.trackers.length; i++){
    var el = this.trackers[i]
    /*
    for(var k = 0; k < el.length; k++){
      var box = el[k].getBBox()
      //el[k].attr("x", box.x + x);
      //el[k].attr("y", box.y + y);
      el[k].translate(x,y)
    }
    */
    el.translate(x,y)
  }
}
VectorEditor.prototype.updateTracker = function(tracker){
  if(!tracker){
    for(var i = 0; i < this.trackers.length; i++){
      this.updateTracker(this.trackers[i])
    }
  }else{
    if(shape._ && shape._.rt && shape._.rt.deg > 0){
      this.rotateTracker(shape._.rt.deg, (box.x + box.width/2), (box.y + box.height/2))
    }
    
  }
}
VectorEditor.prototype.trackerBox = function(x, y){
  var w = 4
  return this.draw.rect(x - w, y - w, 2*w, 2*w).attr({
    "stroke-width": 1,
    "stroke": "green",
    "fill": "white"
  }).mouseover(function(){
    this.attr("fill", "red")
  }).mouseout(function(){
    this.attr("fill", "white")
  }).mousedown(function(){
    //this.paper.editor.action = "rotate"
  })
}

VectorEditor.prototype.trackerCircle = function(x, y){
  var w = 5
  return this.draw.ellipse(x, y, w, w).attr({
    "stroke-width": 1,
    "stroke": "green",
    "fill": "white"
  }).mouseover(function(){
    this.attr("fill", "red")
  }).mouseout(function(){
    this.attr("fill", "white")
  }).mousedown(function(){
    this.paper.editor.action = "rotate";
  });
}


VectorEditor.prototype.showTracker = function(shape){
  var box = shape.getBBox();
  var tracker = this.draw.set();
  tracker.shape = shape;
  if(shape.subtype == "line"){
    var line = Raphael.parsePathString(shape.attr('path'));
    tracker.push(this.trackerBox(line[0][1],line[0][2]))
    tracker.push(this.trackerBox(line[1][1],line[1][2]))
    this.trackers.push(tracker)
  }else if(shape.type == "rect" || shape.type == "image"){
    tracker.push(this.draw.rect(box.x - 10, box.y - 10, box.width + 20, box.height + 20).attr({"opacity":0.3}))
    tracker.push(this.trackerBox(box.x - 10, box.y - 10))
    tracker.push(this.trackerBox(box.x + box.width + 10, box.y - 10))
    tracker.push(this.trackerBox(box.x + box.width + 10, box.y + box.height + 10))
    tracker.push(this.trackerBox(box.x - 10, box.y + box.height + 10))
    tracker.push(this.trackerCircle(box.x + box.width/2, box.y - 25))
    this.trackers.push(tracker)
  }else if(shape.type == "ellipse"){
    tracker.push(this.trackerBox(box.x, box.y))
    tracker.push(this.trackerBox(box.x + box.width, box.y))
    tracker.push(this.trackerBox(box.x + box.width, box.y + box.height))
    tracker.push(this.trackerBox(box.x, box.y + box.height))
    tracker.push(this.trackerCircle(box.x + box.width/2, box.y - 25))
    this.trackers.push(tracker)
  }else{
    tracker.push(this.draw.rect(box.x - 10, box.y - 10, box.width + 20, box.height + 20).attr({"opacity":0.3}))
    tracker.push(this.trackerCircle(box.x + box.width/2, box.y - 25))
    this.trackers.push(tracker)
  }
}

VectorEditor.prototype.showGroupTracker = function(shape){
  var tracker = this.draw.set();
  var box = shape.getBBox();
  tracker.push(this.draw.rect(box.x - 5, box.y - 5, box.width + 10, box.height + 10).attr({
    "stroke-dasharray": "-",
    "stroke": "blue"
  }))
  tracker.shape = shape;
  this.trackers.push(tracker)
}
