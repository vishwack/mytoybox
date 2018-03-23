# LUModeller 

Imagine a world where you can quickly author language understanding components for your bot using a simple markdown file... The .lu file and the LUModeller tool was born to serve few use cases:
- Describe intents, entities, utterances and patterns for your bot in simple markdown documents
- The langauge understanding definition for your bot lives with the rest of your code. You can use other CLI tools like luis to create a new LUIS app using the .lu files
- Group language understanding documents by langauge x locale for easier to manage localization purposes. 

The LUModeller tool converts .lu files to a LUIS model json file. 

## LU File
### Intent
An intent represents actions the user wants to perform. The intent is a purpose or goal expressed in a user's input, such as booking a flight, paying a bill, or finding a news article. You define and name intents that correspond to these actions. A travel app may define an intent named "BookFlight."

Here's a simple .lu file that captures a simple 'Greeting' intent with example utterances that capture ways users can express this intent:
```
#Greeting
Hi
Hello
Good morning
Good evening
```
'#\<intent-name\>' describes a new intent definition section. Each line after the intent definition are example utterances that describe that intent.
You can stitch together multiple intent definitions in a single file like this: 
```
#Greeting
Hi
Hello
Good morning
Good evening

#Help
help
I need help
please help
```
A blank line is used to delimit different sections and is also useful for improved readability.

### Entities

