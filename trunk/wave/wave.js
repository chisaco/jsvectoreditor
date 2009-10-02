  var editor = null;

isPlayback = function(){
  //hack for the time being
  //return false;
  
  if((new Date).getTime()/1000 < 1254471241 + 592653){ //10 / 2 / 2009 @ 3:14 
    //wave is broken: this is a hack
    if(wave && wave.getState && wave.getState() && wave.getState().get){
      return wave.getState().get("${playback}");
    }else{
      return false;
    }
  }
  
  if(wave_get("FORCE_OVERRIDE_PLAYBACK") == "TRUE"){
    return true;
  }
  return wave.isPlayback()
}

  function resetGadget(){
    var keys = wave.getState().getKeys()
    var state = {}
    for(var i = 0; i < keys.length; i++){
      state[keys[i]] = null;
    }
    wave.getState().submitDelta(state)
  }
  
  function index_of(v,a){
    for(var i=a.length;i--&&a[i]!=v;);
    return i
  }
  
  function unlock_all(){
    var locks = get_subkeys("locked:");
    for(var i = 0; i < locks.length; i++){
      wave_set("locked:"+locks[i], null);
    }
  }
  
  function get_subkeys(name){
    var allkeys = wave.getState().getKeys();
    var subkeys = []
    for(var i = 0; i < allkeys.length; i++){
      if(allkeys[i].indexOf(name) == 0){
        subkeys.push(allkeys[i].substr(name.length))
      }
    }
    return subkeys
  }
  
  function wave_set(row, value){
    var delta = {}
    //console.log(row, value)
    delta[row] = value;
    var val = wave_get(row);
    if(val != value){
      if(typeof val == "string" && val.indexOf("DEL/") == 0){
       if((new Date()).getTime() - parseInt(val.substr(4)) < 1337){
          return; //dont change if deleted recently
       }
     }
      wave.getState().submitDelta(delta)
    }
  }
  
  function wave_get(row){
    return wave.getState().get(row)
  }
  
  var lastfail = 0;
  function playback_fail(){
      var lastlock = 0;
    
    
  if(isPlayback()){
  if(lastfail < (new Date).getTime() - 10000){
  
  alert("Wave is reporting that it is in Playback mode. Editing has been disabled.");
          lastfail = (new Date).getTime();
  }
  }
  }
  
  function is_locked(name){
    //return index_of(name,get_subkeys("locked:")) != -1;
    
    var state = wave_get("locked:"+name);
    
      if(state == null){
    return false;
  }
    
    //never lock what is mine
    if(state == wave.getViewer().getId()){
      return false
    }
    //unlock if owner is dead.
    var people = wave.getParticipants()
    for(var i = 0; i < people.length; i++){
      if(people[i].getId() == state.split("!t")[0]){
        if(parseInt(state.split("!t")[1]) < (new Date).getTime() - (1000*60)){
          return state.split("!t")[0]
        }else{
          return false;
        }
      }
    }
    return false
  }
  
  
  
  function lock_shape(name){
    
    //console.log("Locking:",name)
    wave_set("locked:"+name, wave.getViewer().getId());
  }
  
  function unlock_shape(name){
    
    //console.log("Unlocking:",name)
    wave_set("locked:"+name, null); //delete
  }
  
  
  function stateChanged(){
    var keys = get_subkeys("data:");
    
    if(isPlayback()){
    editor.deleteAll()
    
       for(var i = 0; i < keys.length; i++){
        var text = wave_get("data:"+keys[i]);
        
        //console.log("newshape:",keys[i])
        //console.log("data",text)
        if(typeof text == "string" && text.indexOf("DEL/") == 0){
            continue;
        }
        try {
        var json = JSON.parse(text);
        
        loadShape(json,true)
        }catch(err){
          alert(err.message)
        }
       }
    }else{
    
    for(var i = 0; i < keys.length; i++){
      
      //if(editor.getShapeById(keys[i]) == null){
        
        //if new shape
        var text = wave_get("data:"+keys[i]);
        
        //console.log("newshape:",keys[i])
        //console.log("data",text)
        if(typeof text == "string" && text.indexOf("DEL/") == 0){
          if((new Date()).getTime() - parseInt(text.substr(4)) < 5000){
            //oh noes deleted
            editor.deleteShape(editor.getShapeById(keys[i]))
            //alert('delete'+keys[i])
          }
          
            continue;
        }
        
        try {
          var json = JSON.parse(text);
        }catch(err){
          alert('Parse '+err.message+"\n"+text)
        }  
        try {
          if(editor.getShapeById(keys[i]) == null){
            loadShape(json)
            //alert('load'+keys[i])
          }else if(!editor.is_selected(editor.getShapeById(keys[i]))){
            loadShape(json,true,true)
            //alert('load2'+keys[i])
          }
        
        }catch(err){
          alert('Render '+err.message+"\n"+text)
        } 
        
    }
    
    
    }
    
  }
  
  //stolen from an unreleased version of the ajax animator
  //which interestingly enough, I made. 
  //also the purpose of VectorEditor is for the ajax animator
  //so why am i citing myself?
  
  loadShape = function(shape, noattachlistener, animate){
    var instance = editor//instance?instance:Ax.canvas
    if(!shape || !shape.type || !shape.id)return;
    
	  var newshape = null, draw = instance.draw;editor
    if(!(newshape=editor.getShapeById(shape.id))){
	  if(shape.type == "rect"){
	    newshape = draw.rect(0, 0,0, 0)
	  }else if(shape.type == "path"){
	    newshape = draw.path("")
	  }else if(shape.type == "image"){
      newshape = draw.image(shape.src, 0, 0, 0, 0)
    }else if(shape.type == "ellipse"){
      newshape = draw.ellipse(0, 0, 0, 0)
    }else if(shape.type == "text"){
      newshape = draw.text(0, 0, shape.text)
    }
    }
    
    for(var i in shape){
      if(attr.join("").indexOf(i) == -1){
        delete shape[i];
      }
    }
    
	  if(newshape){
      if(!animate){
	    newshape.attr(shape)
    }else{
      newshape.animate(shape,314,function(){
          newshape.attr(shape)
        })
    }
	    newshape.id = shape.id
	    newshape.subtype = shape.subtype
	    
	        if (!noattachlistener) {
              //Ext.get(newshape).on("mousedown", Ax.canvas.onHit, Ax.canvas);
            instance.addShape(newshape,true)
          }
	  }

}

var lastmove = 0

var attr = "cx,cy,fill,fill-opacity,font,font-family,font-size,font-weight,gradient,height,opacity,path,r,rotation,rx,ry,src,stroke,stroke-dasharray,stroke-opacity,stroke-width,width,x,y".split(",")


dumpshape = function(shape){
    //return Ax.canvas.info(shape)
    var info = {
      type: shape.type,
      id: shape.id,
      subtype: shape.subtype
    }
    
    for(var i = 0; i < attr.length; i++){
      var tmp = shape.attr(attr[i]);
      if(tmp){
        info[attr[i]] = tmp
      }
    }
    
    
    return info
}
  
  function init(){
    $(document).ready(function(){
    window.editor = new VectorEditor(document.getElementById("canvas"), $(window).width(),$(window).height());
    //editor.draw.rect(100,100,480,272).attr("stroke-width", 0).attr("fill", "white")
      setMode("select");
    if(wave && wave.isInWaveContainer()){
      //if(wave.getState()){
      
      //console.log(wave.getState())
        wave.setStateCallback(stateChanged)
      //}else{
      //  return alert("Failed! Wave State is MISSING! Not my fault!")
      //}
    }else{
      return alert("It's only a wave gadget if it's in wave...")
    }

    $(window).resize(function(){
      editor.draw.setSize($(window).width(),$(window).height())
    })
    //setInterval(function(){
    editor.on("mousemove",function(){
    if(!isPlayback()){
              if((new Date).getTime()-lastmove > 500){
            for(var i =0;i<editor.selected.length;i++){
               shape = editor.selected[i]
                //console.log("add shape (interval):",shape) 
                wave_set("data:"+shape.id,JSON.stringify(dumpshape(shape)))
                lock_shape(shape.id)
            }
            lastmove = (new Date).getTime()
          }
        }else{
        playback_fail()
        }
  })
    //},1000)
    
    editor.on("addedshape", function(event, shape, no_select){
      if(!no_select  && !isPlayback()){
        //console.log("Initial Add Shape: ",shape.id)
        wave_set("data:"+shape.id, JSON.stringify(dumpshape(shape)));
        lock_shape(shape.id);
    }else{
      playback_fail()
    }
    })
    
    var lastlock = ""
    function showlock(locker){
      if(locker != lastlock){
        alert("Shape(s) Locked by "+locker)
        lastlock = locker;
       }
    }

    editor.on("select", function(event,shape){
      if(shape){
      var locker;
      if(locker = is_locked(shape.id)){
        //oh noes! it's locked
        showlock(locker)
        return false
      }
      playback_fail()
      if(isPlayback())return false;
      
      //if nobody's locked it
      lock_shape(shape.id)
    }
    })
    
    editor.on("delete", function(event,shape){
      if(shape && !isPlayback()){
      var locker;
      if(locker = is_locked(shape.id)){
        //oh noes! it's locked
        showlock(locker)
        return false
      }
      //if nobody's locked it
      lock_shape(shape.id)
    }
    })
    
    editor.on("selectadd", function(event,shape){
      if(shape && !isPlayback()){
      var locker;
      if(locker = is_locked(shape.id)){
        //oh noes! it's locked
        showlock(locker)
        return false
      }
      //if nobody's locked it
      lock_shape(shape.id)
    }
    })
    
    editor.on("delete", function(event, shape){
    if(!isPlayback()){
      setTimeout(function(){
        wave_set("data:"+shape.id, 'DEL/'+(new Date()).getTime());
        unlock_shape(shape.id);
      },10)
      }
      playback_fail()
    })
    
    
    editor.on("unselect", function(event, shape){
      if(shape && !isPlayback()){
        unlock_shape(shape.id);
        //        if(!is_locked(shape.id)){
        //console.log("add shape (unselect):",shape.id)
        wave_set("data:"+shape.id,JSON.stringify(dumpshape(shape)))
        //sendUpdates();
      //}
      }
      
      playback_fail()
    })
    })
  }
  gadgets.util.registerOnLoadHandler(init);
  
