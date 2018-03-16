document -> (intent):+ {% d => d.join('') %}

#Definition of intent
intent -> gSPACE intentID gSPACE intentName gSPACE gLINEFEED utterancesForIntent
intentID -> "intent"i ":"
          | "#"
intentName -> [_a-zA-Z0-9-]:* {% d => d.join('') %}

#utterance collection for an intent is one or more collection of uttereances followed by a blank line
utterancesForIntent -> (utterance):+ gLINEFEED

#utterances are defined as inidivual lines of strings
utterance -> [.]:* gLINEFEED

gLINEFEED -> ("\n"):+
           | ("\r\n"):+
gSPACE -> (" "):*