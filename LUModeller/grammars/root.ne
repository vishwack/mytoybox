document -> (intent):+ #{% d => d.join('') %}
{% function(d) { console.log('document:' + JSON.stringify(d)); } %}

#Definition of intent
intent -> intentID intentName gLINEFEED utterancesForIntent 
{% function(data) { 
    console.log("intent:" + data.toString()); 
    return {
        "intent":data[1],
        "utterances":data[3]
    };
} %}
intentID -> "intent"i ":"   
          | "#" 
intentName -> .:+ {% d => d.join('').replace(/,/g,'') %}

#utterance collection for an intent is one or more collection of uttereances followed by a blank line
utterancesForIntent -> (utterance):+ 
{% function(d) 
    {
        console.log('utterancesForIntent:' + d.toString());
        d = d.join('').replace(/,/g,''); 
        return d; 
    }
%}

#utterances are defined as inidivual lines of strings
utterance -> .:* gLINEFEED
{% function(d) 
    {
        console.log('utterancesForIntent:' + d.toString());
        d = d.join('').replace(/,/g,''); 
        return d; 
    }
%}

#Globals
gSPACE -> (" "):* 
gLINEFEED -> ("\n"):+ 
           | ("\r\n"):+ 