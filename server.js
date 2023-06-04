// importing all the Stuff
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors"; 
//app config
const app = express();
const port = process.env.PORT || 9000;
const pusher = new Pusher({
    appId: "1612290",
    key: "b116b186e57ff1cb2a55",
    secret: "17923b8b658defbd0541",
    cluster: "mt1",
    useTLS: true
  });
  
//   pusher.trigger("my-channel", "my-event", {
//     message: "hello world"
//   });

//middleware
app.use(express.json());

app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
    }
);
app.use(cors());

//db config
const connection_url = 'mongodb+srv://ahtisham225ali:2AYixJfgf8Ws7UIp@cluster0.dc9cm1o.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(connection_url);
const connection = mongoose.connection;
connection.once('open',()=>{

    console.log('Connection with MongoDB Established');
    const msgCollection = connection.collection('messagecontents');
    const changeStream = msgCollection.watch();
    changeStream.on('change',(change)=>{
        console.log(change);
        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            }
            );
        }else{
            console.log('Error triggering Pusher');
        }
    });
});

app.get('/', (req, res) => res.status(200).send('hello world'));


app.get('/api/v1/messages/sync', (req, res) => {
    Messages.find().then((result) =>{
        res.status(200).send(result);
    }).catch((err)=>{
        res.status(500).send(err);
    });
});


app.post('/api/v1/messages/new', (req, res) => {
    const dbMessage = req.body;
    Messages.create(dbMessage).then((result)=>{
        res.status(201).send(result);
    }).catch((err)=>{
        res.status(500).send(err);
    });
});

app.listen(port, () => console.log(`Listening on localhost:${port}`));
