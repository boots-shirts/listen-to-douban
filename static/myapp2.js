
$(document).ready(function(){
    $('body').css('background-color', body_background_color)
    $('body').css('color', body_text_color)
    $('svg').css('background-color', svg_background_color)
    $('svg text').css('color', svg_text_color)
    // :(
    //$('head').append('<style type="text/css">.newuser-label {fill:' + svg_text_color +
    //                     ';} .bot {fill:' + bot_color +
    //                     ';} .anon {fill:' + anon_color +
    //                     ';} .bot </style>');
    $('body').append('<div id="loading"><p>Loading sound files ...</p></div>')
    
    var svg = d3.select("#display").append("svg")
            .attr({width: width, height: height})
            .style('background-color', '#1c2733');
            
    
    
    var update_window = function() {
            width = w.innerWidth || e.clientWidth || g.clientWidth;
            height = (w.innerHeight  - $('header').height())|| (e.clientHeight - $('header').height()) || (g.clientHeight - $('header').height());

            svg.attr("width", width).attr("height", height);
  
        };
        
    window.onresize = update_window;
    
    
    
    namespace='/_GET';                                               
    var socket = io.connect('http://listen-to-douban.herokuapp.com/'+ namespace);   
    
   
    
    socket.on('connect',function(){
      //$('#result').append('Connected!');
      socket.emit('send data');});
    
    socket.on('message', function(msg){                     
      var resp=JSON.parse(msg.data);   
      console.log(resp);
      v_action(msg,svg);
    });
    
    socket.on('response',function(msg){
      $('#result').append(msg.data);
      console.log(msg.data);});
    
    socket.on('next',function(){
      socket.emit('send data');});
     
      
})

function v_action(d, svg_area){
    var data=JSON.parse(d.data);
    var t=data_type(data);
    
    var id=data['user']['id'];
    if ( id in users) {
        users[id]['mb'] +=1;
    }else {
        users[id]={'mb':1,'name':data['user']['screen_name'],'size':data['size']};
        total_users +=1;
    }
    
    total_miniblogs += 1;
    if (total_miniblogs == 1) {
        $('#miniblog_counter').html('You have seen <span>' + total_miniblogs + ' miniblog from one user:</span>');
    } else {
        $('#miniblog_counter').html('You have seen a total of <span>' + insert_comma(total_miniblogs) + ' miniblogs from ' + total_users + ' users, among which: </span>');
    }
    
    
    if (t==='mbm'||t==='r_mbm') {
        n1 +=1;
        $('#mbm').html( n1 + ' about movie,book and music;');
    }else if (t==='rc_url'||t==='r_rc_url') {
        n2 +=1;
        $('#url').html( n2 + ' information (news) dissemination through sharing urls;');
    }else if (t==='daily trivia'||t==='r_daily trivia') {
        n3 +=1;
        $('#dt').html( n3 + ' broadcasting their thoughts and life details;');
    }else if (t==='photo'||t==='r_photo') {
        n4 +=1;
        $('#photo').html( n4 + ' creation and circulation of personal photo collections;');
    }else{
        n5 +=1;
        $('#other').html( n5 + ' other kinds of douban activities, such as recommendation of side sources;');
    }
    
    var rc_str;
    if ('reshared_status' in data) {
        rc_str=data['user']['screen_name']+'转播： ('+ data['reshared_status']['user']['screen_name']+data['reshared_status']['title'];
        if (data['reshared_status']['attachments'].length===1) {
            rc_str += ' <' + data['reshared_status']['attachments'][0]['title'] + '>';
        };
        if (data['reshared_status']['text'].length !== 0) {
            rc_str += ' "' + data['reshared_status']['text'] + '"';
        };
        rc_str += ')';
        
    }else {
        rc_str=data['user']['screen_name']+ data['title'];
        if  (data['attachments'].length===1) {
            rc_str += ' <' + data['attachments'][0]['title'] + '>';
        };
        if (data['text'].length !== 0) {
            rc_str += ' "' + data['text'] + '"';
        };   
    }
    
    log_rc(rc_str,5);
    
    //count, deciding opacity
    var count=data['comments_count'] + data['like_count'] + 10*data['reshared_count'];
    
    //size and position
    var circle_id = 'd' + ((Math.random() * 100000) | 0); //don't know what's it for!
    var label_text = data_text(data);
    var no_label = false;
    
    var size = data['size'];                         
    var csize = Math.min(Math.max(Math.sqrt(size)*0.01,0.2),1); 
    var abs_size = Math.abs(size);
    size = Math.max(Math.sqrt(abs_size) * scale_factor, 6); 

    
    var x = Math.random() * (width - size) + size;
    var y = Math.random() * (height - size) + size;
    
    play_sound(size,t,csize);
    
    var circle_group = svg_area.append('g')
        .attr('transform', 'translate(' + x + ', ' + y + ')')      
        .attr('fill', edit_color);

    var ring = circle_group.append('circle')   
         .attr({r: size + 20,
                stroke: 'none'})
         .transition()
         .attr('r', size + 40)
         .style('opacity', 0)
         .ease(Math.sqrt)
         .duration(3500)
         .remove();

    var circle_container = circle_group.append('a')   //better use it in order to be more interactive!but not sure my data has this url thing!
        .attr('xlink:href', 'http://www.douban.com/people/'+data['user']['id']+'/status/'+data['id']+'/') 
        .attr('target', '_blank')
        .attr('fill', svg_text_color);

    var circle = circle_container.append('circle')       
        .classed(t, true)                          
        .attr('r', size)
        .attr(type_col(t))                        
        .style('opacity',type_opa(count))  
        .transition()
        .duration(max_life)
        .style('opacity', 0)
        .each('end', function() {
            circle_group.remove();
        })
        .remove();
        
    var text = circle_container.append('text')
            .text(label_text)
            .attr('text-anchor', 'middle')
            .transition()
            .delay(1000)
            .style('opacity', 0)
            .duration(2000)
            .each('end', function() { no_label = true; })
            .remove();
    
    circle_container.on('mouseover', function() {
        if (no_label) {
            no_label = false;
            circle_container.append('text')
                .text(label_text)
                .attr('text-anchor', 'middle')
                .transition()
                .delay(1000)
                .style('opacity', 0)
                .duration(2000)
                .each('end', function() { no_label = true; })
                .remove();
        }

    });
}

function play_sound(size,ty,v){   
    var max_pitch = 100.0;
    var log_used = 1.0715307808111486871978099;
    var pitch = 100 - Math.min(max_pitch, Math.log(size + log_used) / Math.log(log_used));
    var index = Math.floor(pitch / 100.0 * Object.keys(celesta).length);
    var fuzz = Math.floor(Math.random() * 4) - 2;
    index += fuzz;
    index = Math.min(Object.keys(celesta).length - 1, index);
    index = Math.max(1, index);
    if (current_notes < note_overlap) {
        current_notes++;
        if (ty==='daily trivia'|| ty==='r_daily trivia' || ty==='rc_url'|| ty==='r_rc_url'||ty==='photo'|| ty==='r_photo'){
            celesta[index].play().volume(Math.min(v,1));
        }else if (ty ==='mbm'|| ty==='r_mbm') {
            var i = Math.round(Math.random() * (swells.length - 1));
            swells[i].play();                               
        }else {
            clav[index].play().volume(Math.min(v,1));
        }
        setTimeout(function() {                                 
            current_notes--;
        }, note_timeout);
    }
}

function data_type(data) {
    var type;
    var att=data['attachments'];
    if ('reshared_status' in data) {
        var source=data['reshared_status'];
        var s_att=source['attachments'];
        if (source['title']==="说："){
            type='r_daily trivia';
        }else if (source['title']==='推荐网址'){
            type='r_rc_url';
        }else if (s_att.length===1) {
            if (s_att[0]['type']==="movie" || s_att[0]['type']==="book" || s_att[0]['type']==="music"){
                type='r_mbm';
            }else if (s_att[0]['type']==="photos"){
                type='r_photo';
            }
        }else{
            type='r_other';
        }
        
    }else if (data['title']==="说："){
        type='daily trivia';
    }else if (data['title']==='推荐网址'){
        type='rc_url';
    }else if (att.length===1) {
        if (att[0]['type']=== "movie" || att[0]['type']=== "book" || att[0]['type']===  "music"){
            type='mbm';
        }else if (att[0]['type']==="photos"){
            type='photo';
        }
    }else {
        type='other';
    }
    return type;
}

function data_text(data){
    var text;
    if ('reshared_status' in data) {
        text=data['reshared_status']['title'];
    }else{
        text=data['title'];
    }
    return text;
}
function type_col(t) {                                           
    if (t=='daily trivia') {
        return {'fill':dt_color ,'stroke':'none'}
    }else if (t=='rc_url') {
        return {'fill': url_color ,'stroke':'none'}
    }else if (t=='mbm') {
        return {'fill':  mbm_color,'stroke':'none'}
    }else if (t=='photo') {
        return {'fill': photo_color ,'stroke':'none'}
    }else if (t=='r_daily trivia') {
        return {'fill': dt_color, 'stroke':dt_s ,'stroke-width':s_wid }
    }else if (t=='r_rc_url') {
        return {'fill': url_color , 'stroke':url_s ,'stroke-width':s_wid}
    }else if (t=='r_mbm') {
        return {'fill':  mbm_color , 'stroke':mbm_s,'stroke-width':s_wid}
    }else if (t=='r_photo') {
        return {'fill': photo_color, 'stroke':photo_s ,'stroke-width':s_wid}
    }else {
        return {'fill': other_color ,'stroke':'none'}
    }
    
}


function type_opa(c){
    var opa=Math.min(0.4+c/100,1);
    return opa;
}


var insert_comma = function(s) {
    s = s.toFixed(0);
    if (s.length > 2) {
        var l = s.length;
        var res = "" + s[0];
        for (var i=1; i<l-1; i++) {
            if ((l - i) % 3 == 0)
                res += ",";
            res +=s[i];
        }
        res +=s[l-1];

        res = res.replace(',.','.');

        return res;
    } else {
        return s;
    }
}


var log_rc = function(rc_str, limit) {
    $('#rc-log').prepend('<li>' + rc_str + '</li>');
    if (limit) {
        if ($('#rc-log li').length > limit) {
            $('#rc-log li').slice(limit, limit + 1).remove();
        }
    }
};


//original request attempt, might delete it later, leave it here for the moment
/*function getdata() {
    if (xhr) {
        xhr.open("GET",URL,true);
        xhr.onreadystatechange=showContents(); 
        xhr.send(null);// what is this?
        
        setTimeout('getdata()',1000);                    //this is the loop!
}
    else {
        alert("Fail to make connection to douban!");
}
    
}
function showContents () {
    var area=document.getElementById('data');
    
    if (xhr.readyState ==4 ) {
        if (xhr.status==200) {
            //var data = JSON.parse(resp.data);
            area.innerHTML=xhr.responseText;           
            
        }
        
    }
    else{
        alert("There was a problem with the request" + xhr.status);
    }
   
    
}*/
