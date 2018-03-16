document -> (intent):+ #{% d => d.join('') %}
{% function(d) { console.log('document:' + d.toString()); } %}

#Definition of intent
intent -> intentID gSPACE intentName gLINEFEED 
{% function(data) { 
    console.log("intentName:" + data.toString()); 
    return data;
} %}
intentID -> "intent"i ":"   {% function(d) { console.log('intentID (intent:):' + d.toString()); return 'id';} %}
          | "#" {% function(d) { console.log('intentID (#):' + d.toString()); } %}
intentName -> .:+ 
{% function(d) 
    {
        d = d.join('').replace(/,/g,''); 
        return d; 
    }
%}

#Globals
gLINEFEED -> ("\n"):+ {% function(d) { console.log('gLINEFEED (n):' + d.toString()); } %}
           | ("\r\n"):+ {% function(d) { console.log('gLINEFEED (rn):' + d.toString()); } %}
gSPACE -> (" "):* {% function(d) { console.log('gSPACE:' + d.toString()); } %}