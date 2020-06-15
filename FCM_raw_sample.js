/*
 * Copyright   : KOMA-Network (Indonesia IoT Club)
 * Create by   : Yan Yan Purdiansah
 * Create date : 01/06/2020
 * Link        : https://github.com/yypurdi/koma-fcm
 * Description : This is the sample script for compatibility between FCM and KOMA in XMPP/Raw protocol access
 *               This script is implemented in App Server side in Trusted Environment
 */

var tls = require('tls');
var xmlToJson = require('fast-xml-parser');
var Base64 = require('js-base64').Base64;

/*
 * XMPP Protocol Attribute Definitions XML to JSON
 */
var options = {
    attributeNamePrefix : "",
    attrNodeName: "attr",
    textNodeName : "content",
    ignoreAttributes : false,
    ignoreNameSpace : false,
    allowBooleanAttributes : false,
    parseNodeValue : true,
    parseAttributeValue : true,
    trimValues: true,
    cdataTagName: "__cdata",
    cdataPositionChar: "\\c",
    localeRange: "",
    parseTrueNumberOnly: false
};

/*
 * XMPP Protocol Attribute Definitions JSON to XML
 */
var defaultOptions = {
    attributeNamePrefix : "",
    attrNodeName: "attr",
    textNodeName : "content",
    ignoreAttributes : false,
    cdataTagName: "__cdata",
    cdataPositionChar: "\\c",
    format: false,
    indentBy: "  ",
    supressEmptyNode: false
};

/*
 * Const value from FCM - Firebase Cloud Messaging Console
 */
const SERVICE = 'fcm.googleapis.com';
const HOST = 'fcm-xmpp.googleapis.com';
const PORT = 5236;
const SENDER_ID = '[REPLACE WITH YOUR SENDER_ID]';
const SERVER_KEY = '[REPLACE WITH YOUR SERVER_KEY]';

/*
 * Composite value for Authentication
 */
const composite = SENDER_ID +'@'+ SERVICE +'\0'+ SENDER_ID +'\0'+ SERVER_KEY;
const utf8encoded = Base64.encode(composite);

/*
 * Value for Conection and Authentication Status
 */
var success = false;

/*
 * Create TLS Connection
 */
var client = tls.connect(PORT, HOST, function() {

    if (client.authorized) {
        console.log("Connection authorized by a Certificate Authority.");
    } else {
        console.log("Connection not authorized: " + client.authorizationError)
    }

    // Send an initial stream TAG
    client.setEncoding('utf-8');
    client.write("<stream:stream xmlns='jabber:client' to='fcm.googleapis.com' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>");

});

/*
 * Event from Connection
 */
client.on("data", function(data) {

    console.log('Received: '+data);
    var jsonObj = xmlToJson.parse(data,options);

    if(jsonObj.hasOwnProperty('stream:stream')){
        console.log(jsonObj);
    }
    else if(jsonObj.hasOwnProperty('stream:features')){
        console.log(jsonObj);
        if(success==false){
            let xml = '<auth mechanism="PLAIN" xmlns="urn:ietf:params:xml:ns:xmpp-sasl">'+utf8encoded+'</auth>';
            client.setEncoding('utf-8');
            client.write(xml);
        }
        else{
            let xml = '<iq type="set"><bind xmlns="urn:ietf:params:xml:ns:xmpp-bind"></bind></iq>';
            client.setEncoding('utf-8');
            client.write(xml);
        }
    }
    else if(jsonObj.hasOwnProperty('success')){
        console.log(jsonObj);
        success = true;
        client.setEncoding('utf-8');
        client.write("<stream:stream xmlns='jabber:client' to='fcm.googleapis.com' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>");
    }
    else if(jsonObj.hasOwnProperty('iq')){
        console.log(jsonObj);
        if(jsonObj.iq.hasOwnProperty('bind')){
            if(jsonObj.iq.bind.hasOwnProperty('jid')){
                let jid = jsonObj.iq.bind.jid;
                console.log('JID:'+jid);
            }
        }
    }
    else if(jsonObj.hasOwnProperty('message')){
        console.log(jsonObj);
    }
    else{
        console.log(jsonObj);
    }
});

client.on('close', function() {
    console.log("Connection closed");
    success = false;
});

client.on('error', function(error) {
    console.error(error);
    client.destroy();
    success = false;
});
