// Generated automatically by nearley, version 2.13.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "document$ebnf$1$subexpression$1", "symbols": ["intent"]},
    {"name": "document$ebnf$1", "symbols": ["document$ebnf$1$subexpression$1"]},
    {"name": "document$ebnf$1$subexpression$2", "symbols": ["intent"]},
    {"name": "document$ebnf$1", "symbols": ["document$ebnf$1", "document$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "document", "symbols": ["document$ebnf$1"], "postprocess": function(d) { console.log('document:' + JSON.stringify(d)); }},
    {"name": "intent", "symbols": ["intentID", "intentName", "gLINEFEED", "utterancesForIntent"], "postprocess":  function(data) { 
            console.log("intent:" + data.toString()); 
            return {
                "intent":data[1],
                "utterances":data[3]
            };
        } },
    {"name": "intentID$subexpression$1", "symbols": [/[iI]/, /[nN]/, /[tT]/, /[eE]/, /[nN]/, /[tT]/], "postprocess": function (d) {return d.join(""); }},
    {"name": "intentID", "symbols": ["intentID$subexpression$1", {"literal":":"}]},
    {"name": "intentID", "symbols": [{"literal":"#"}]},
    {"name": "intentName$ebnf$1", "symbols": [/./]},
    {"name": "intentName$ebnf$1", "symbols": ["intentName$ebnf$1", /./], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "intentName", "symbols": ["intentName$ebnf$1"], "postprocess": d => d.join('').replace(/,/g,'')},
    {"name": "utterancesForIntent$ebnf$1$subexpression$1", "symbols": ["utterance"]},
    {"name": "utterancesForIntent$ebnf$1", "symbols": ["utterancesForIntent$ebnf$1$subexpression$1"]},
    {"name": "utterancesForIntent$ebnf$1$subexpression$2", "symbols": ["utterance"]},
    {"name": "utterancesForIntent$ebnf$1", "symbols": ["utterancesForIntent$ebnf$1", "utterancesForIntent$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "utterancesForIntent", "symbols": ["utterancesForIntent$ebnf$1"], "postprocess":  function(d) 
        {
            console.log('utterancesForIntent:' + d.toString());
            d = d.join('').replace(/,/g,''); 
            return d; 
        }
        },
    {"name": "utterance$ebnf$1", "symbols": []},
    {"name": "utterance$ebnf$1", "symbols": ["utterance$ebnf$1", /./], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "utterance$ebnf$2", "symbols": []},
    {"name": "utterance$ebnf$2$subexpression$1", "symbols": ["gLINEFEED"]},
    {"name": "utterance$ebnf$2", "symbols": ["utterance$ebnf$2", "utterance$ebnf$2$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "utterance", "symbols": ["utterance$ebnf$1", "utterance$ebnf$2"], "postprocess":  function(d) 
        {
            console.log('utterancesForIntent:' + d.toString());
            d = d.join('').replace(/,/g,''); 
            return d; 
        }
        },
    {"name": "gSPACE$ebnf$1", "symbols": []},
    {"name": "gSPACE$ebnf$1$subexpression$1", "symbols": [{"literal":" "}]},
    {"name": "gSPACE$ebnf$1", "symbols": ["gSPACE$ebnf$1", "gSPACE$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "gSPACE", "symbols": ["gSPACE$ebnf$1"]},
    {"name": "gLINEFEED$ebnf$1$subexpression$1", "symbols": [{"literal":"\n"}]},
    {"name": "gLINEFEED$ebnf$1", "symbols": ["gLINEFEED$ebnf$1$subexpression$1"]},
    {"name": "gLINEFEED$ebnf$1$subexpression$2", "symbols": [{"literal":"\n"}]},
    {"name": "gLINEFEED$ebnf$1", "symbols": ["gLINEFEED$ebnf$1", "gLINEFEED$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "gLINEFEED", "symbols": ["gLINEFEED$ebnf$1"]},
    {"name": "gLINEFEED$ebnf$2$subexpression$1$string$1", "symbols": [{"literal":"\r"}, {"literal":"\n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "gLINEFEED$ebnf$2$subexpression$1", "symbols": ["gLINEFEED$ebnf$2$subexpression$1$string$1"]},
    {"name": "gLINEFEED$ebnf$2", "symbols": ["gLINEFEED$ebnf$2$subexpression$1"]},
    {"name": "gLINEFEED$ebnf$2$subexpression$2$string$1", "symbols": [{"literal":"\r"}, {"literal":"\n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "gLINEFEED$ebnf$2$subexpression$2", "symbols": ["gLINEFEED$ebnf$2$subexpression$2$string$1"]},
    {"name": "gLINEFEED$ebnf$2", "symbols": ["gLINEFEED$ebnf$2", "gLINEFEED$ebnf$2$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "gLINEFEED", "symbols": ["gLINEFEED$ebnf$2"]}
]
  , ParserStart: "document"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
