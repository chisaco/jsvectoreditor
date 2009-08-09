function bind(fn, scope){
  return function(){return fn.apply(scope, array(arguments))}
}

function array(a){
  for(var b=a.length,c=[];b--;)c.push(a[b]);
  return c;
}

function VectorEditor(elem, width, height){
    if (typeof(Raphael) != "function") { //check for the renderer
        return alert("Error! Renderer is Missing!"); //if renderer isn't there, return false;
    }
    
    this.container = elem
    this.draw = Raphael(elem, width, height);
    
    this.draw.editor = this;
    
    this.onHitXY = [0,0]
    this.offsetXY = [0,0]
    this.tmpXY = [0,0]
    
    this.fill =   "#ff0000"; //red
    this.stroke = "#000000"; //black
    
    this.mode = "select";
    this.selectbox = null;
    this.selected = []
    
    this.action = "";
    
    this.selectadd = false;
    
    this.shapes = []
    this.trackers = []
    
    var draw = this.draw;
    
    function offset(){
      //technically, vX.pos works too and I should probably use whatever I built here, but I have jQuery instead.
      if(window.Ext)return Ext.get(elem).getXY();
      if(window.jQuery){
        var pos = jQuery(elem).offset();
        return [pos.left, pos.top];
      }
      if(window.vx){ //vx support
        var pos = vx.pos(elem);
        return [pos.l, pos.t]
      }
      return [0,0]
    }
    
    
    $(elem).mousedown(bind(function(event){
      event.preventDefault()
      this.onMouseDown(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    $(elem).mousemove(bind(function(event){
      event.preventDefault()
      this.onMouseMove(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    $(elem).mouseup(bind(function(event){
      event.preventDefault()
      this.onMouseUp(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    $(elem).dblclick(bind(function(event){
      event.preventDefault()
      this.onDblClick(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
}

VectorEditor.prototype.setMode = function(mode){
  if(mode == "select+"){
    this.mode = "select";
    this.selectadd = true;
    this.unselect()
  }else if(mode == "select"){
    this.mode = mode;
    this.unselect()
    this.selectadd = false;
  }else if(mode == "delete"){
    this.deleteSelection();
    this.mode = mode;
  }else{
    this.unselect()
    this.mode = mode;
  }
}

//from the vXJS JS Library
VectorEditor.prototype.in_array = function(v,a){
  for(var i=a.length;i--&&a[i]!=v;);
  return i
}

//from vX JS, is it at all strange that I'm using my own work?
VectorEditor.prototype.array_remove = function(e, o){
  var x=this.in_array(e,o);
  x!=-1?o.splice(x,1):0
}

VectorEditor.prototype.is_selected = function(shape){
  return this.in_array(shape, this.selected) != -1;
}



VectorEditor.prototype.isCanvas = function(element){
  return element == this.draw.canvas || //yay for Firefox and Opera!
         element == this.container || //erm.. makes sense for Webkit
         (Raphael.vml && element == this.draw.canvas.parentNode); //IE.. uh...
}

VectorEditor.prototype.onMouseDown = function(x, y, target){
  this.tmpXY = this.onHitXY = [x,y]
  
  if(this.mode == "select" && !this.selectbox){
    if(this.isCanvas(target)){
      if(!this.selectadd) this.unselect();
      this.selectbox = this.draw.rect(x, y, 0, 0)
        .attr({"fill-opacity": 0.15, 
              "stroke-opacity": 0.5, 
              "fill": "#007fff", //mah fav kolur!
              "stroke": "#007fff"});
    }else{
      var shape_object = null
      if(target.shape_object){
        shape_object = target.shape_object
      }else if(target.parentNode.shape_object){
        shape_object = target.parentNode.shape_object
      }else{
        return; //likely tracker
      }
      if(this.selected.length > 1 || this.selectadd){
        this.selectAdd(shape_object);
        this.action = "move";
      }else{
        this.select(shape_object);
        this.action = "move";
      }
      this.offsetXY = [shape_object.attr("x") - x,shape_object.attr("y") - y]
    }
  }else if(this.mode == "delete" && !this.selectbox){
    if(this.isCanvas(target)){
      this.selectbox = this.draw.rect(x, y, 0, 0)
        .attr({"fill-opacity": 0.15, 
              "stroke-opacity": 0.5, 
              "fill": "#ff0000", //mah fav kolur!
              "stroke": "#ff0000"});
    }else{
      var shape_object = null
      if(target.shape_object){
        shape_object = target.shape_object
      }else if(target.parentNode.shape_object){
        shape_object = target.parentNode.shape_object
      }else{
        return; //likely tracker
      }
      this.deleteShape(shape_object)
      this.offsetXY = [shape_object.attr("x") - x,shape_object.attr("y") - y]
    }
  }else if(this.selected.length == 0){
    var shape = null;
    if(this.mode == "rect"){
      shape = this.draw.rect(x, y, 0, 0);
    }else if(this.mode == "ellipse"){
      shape = this.draw.ellipse(x, y, 0, 0);
    }else if(this.mode == "path"){
      shape = this.draw.path({}).moveTo(x, y)
    }else if(this.mode == "line"){
      shape = this.draw.path({}).moveTo(x, y)
      shape.subtype = "line"
    }else if(this.mode == "polygon"){
      shape = this.draw.path({}).moveTo(x, y)
      shape.subtype = "polygon"
    }else if(this.mode == "image"){
      shape = this.draw.image("http://upload.wikimedia.org/wikipedia/commons/a/a5/ComplexSinInATimeAxe.gif", x, y, 0, 0);
    }else if(this.mode == "text"){
      shape = this.draw.text(x, y, "elitist").attr("font-size",20)
    }
    if(shape){
      shape.id = this.generateUUID();
      shape.attr({fill: this.fill, stroke: this.stroke})
      this.addShape(shape)
    }
  }else{
    if(this.mode == "polygon"){
        this.selected[0].lineTo(x, y)
    }
  }
}

VectorEditor.prototype.onMouseMove = function(x, y, target){
      
  if(this.mode == "select" || this.mode == "delete"){
    if(this.selectbox){
      this.resize(this.selectbox, x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "select"){
      if(this.action == "move"){
        for(var i = 0; i < this.selected.length; i++){
          this.move(this.selected[i], x - this.tmpXY[0], y - this.tmpXY[1])
        }
        //this.moveTracker(x - this.tmpXY[0], y - this.tmpXY[1])
        this.updateTracker();
        this.tmpXY = [x, y]
      }else if(this.action == "rotate"){
        //no multi-rotate
        var box = this.selected[0].getBBox()
        var rad = Math.atan2(y - (box.y + box.height/2), x - (box.x + box.width/2))
        var deg = ((rad * (180/Math.PI))+90) % 360
        this.selected[0].rotate(deg, true); //absolute!
        //this.rotateTracker(deg, (box.x + box.width/2), (box.y + box.height/2))
        this.updateTracker();
      }
    }
  }else if(this.selected.length == 1){
    if(this.mode == "rect"){
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "image"){
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "ellipse"){
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "text"){
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "path"){
      this.selected[0].lineTo(x, y);
    }else if(this.mode == "polygon" || this.mode == "line"){
      //this.selected[0].path[this.selected[0].path.length - 1].arg[0] = x
      //this.selected[0].path[this.selected[0].path.length - 1].arg[1] = y
      //this.selected[0].redraw();
      //var pathsplit = this.selected[0].attr("path").split(" ");
      
      //theres a few freaky bugs that happen due to this new IE capable way that is probably better
    
      var pathsplit = Raphael.parsePathString(this.selected[0].attr("path"))
      if(pathsplit.length > 1){
        //var hack = pathsplit.reverse().slice(3).reverse().join(" ")+' ';
        
        //console.log(pathsplit)
        pathsplit.splice(pathsplit.length - 1, 1);
        //its such a pity that raphael has lost the ability to do it without hacks -_-
        this.selected[0].attr("path", pathsplit)
      }else{
        //console.debug(pathsplit)
        //normally when this executes there's somethign strange that happened
      }
      this.selected[0].lineTo(x, y)
    }
  }
  
}


VectorEditor.prototype.getMarkup = function(){
    return this.draw.canvas.parentNode.innerHTML;
}


VectorEditor.prototype.onDblClick = function(x, y, target){
  if(this.selected.length == 1){
    if(this.selected[0].getBBox().height == 0 && this.selected[0].getBBox().width == 0){
      this.deleteShape(this.selected[0])
    }
    if(this.mode == "polygon"){
      this.selected[0].andClose()
      this.unselect()
    }
  }
}



VectorEditor.prototype.onMouseUp = function(x, y, target){
  if(this.mode == "select" || this.mode == "delete"){
    if(this.selectbox){
      var sbox = this.selectbox.getBBox()
      var new_selected = [];
      for(var i = 0; i < this.shapes.length; i++){
        if(this.rectsIntersect(this.shapes[i].getBBox(), sbox)){
          new_selected.push(this.shapes[i])
        }
      }
      
      if(new_selected.length == 0){
        this.unselect()
      }if(new_selected.length == 1 && this.selectadd == false){
        this.select(new_selected[0])
      }else{
        for(var i = 0; i < new_selected.length; i++){
          this.selectAdd(new_selected[i])
        }
      }
      if(this.selectbox.node.parentNode){
        this.selectbox.remove()
      }
      this.selectbox = null;
      
      if(this.mode == "delete"){
        this.deleteSelection();
      }
      
    }else{
      this.action = "";
    }
  }else if(this.selected.length == 1){
    if(this.selected[0].getBBox().height == 0 && this.selected[0].getBBox().width == 0){
      if(this.selected[0].subtype != "polygon"){
        this.deleteShape(this.selected[0])
      }
    }
    if(this.mode == "rect"){
      this.unselect()
    }else if(this.mode == "ellipse"){
      this.unselect()
    }else if(this.mode == "path"){
      this.unselect()
    }else if(this.mode == "line"){
      this.unselect()
    }else if(this.mode == "image"){
      this.unselect()
    }else if(this.mode == "text"){
      this.unselect()
    }
  }
}

